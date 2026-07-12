import { WebClient } from '@slack/web-api';
import { env } from '../config/env';
import type { Collector } from './CollectorRegistry';
import type { WorkspaceConfig } from '../../contracts/services';
import type { Signal } from '../../contracts/observation';
import { collectorRegistry } from './CollectorRegistry';
import { logger } from '../utils/logger';
import { redis } from '../tools/clients/redis';

const MODULE = 'SlackCollector';

export class SlackCollector implements Collector {
  private slackClient: WebClient;

  constructor() {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN || env.SLACK_BOT_TOKEN);
  }

  async collect(config: WorkspaceConfig): Promise<Signal[]> {
    const signals: Signal[] = [];
    let channelsToWatch = [...config.watchedChannels];

    if (channelsToWatch.length === 0) {
      try {
        logger.info(MODULE, 'watchedChannels is empty in config. Fetching public/private channels that the bot is a member of...');
        let listRes;
        try {
          listRes = await this.slackClient.conversations.list({
            types: 'public_channel,private_channel',
            exclude_archived: true
          });
        } catch (botErr: any) {
          if (botErr.data?.error === 'missing_scope') {
            logger.warn(MODULE, 'Bot token lacks scope for conversations.list. Retrying with userClient (SLACK_USER_TOKEN)...');
            const { userClient } = await import('../tools/clients/slack');
            listRes = await userClient.conversations.list({
              types: 'public_channel,private_channel',
              exclude_archived: true
            });
          } else {
            throw botErr;
          }
        }

        const channels = (listRes.channels || []) as any[];
        // Filter channels where the bot/user is a member
        const joinedChannels = channels.filter(c => c.is_member).map(c => c.id as string);
        logger.info(MODULE, `Dynamically identified ${joinedChannels.length} joined channels: ${JSON.stringify(joinedChannels)}`);
        
        if (joinedChannels.length > 0) {
          channelsToWatch = joinedChannels;
          config.watchedChannels = joinedChannels;
          if (!config.escalationChannel) {
            config.escalationChannel = joinedChannels[0];
          }
          await redis.set(`workspace:config:${config.workspaceId}`, config);
          logger.info(MODULE, `Auto-persisted discovered channels to workspace config in Redis`);
        }
      } catch (err) {
        logger.warn(MODULE, 'Could not dynamically discover channels due to missing Slack API scope (channels:read). ' +
          'Please configure the watched channel manually by running: npx ts-node scripts/setConfig.ts <channel_id>');
      }
    }

    logger.info(MODULE, `Collecting messages across ${channelsToWatch.length} watched channels...`);

    for (const channelId of channelsToWatch) {
      try {
        const lastTsKey = `slack:last_ts:${config.workspaceId}:${channelId}`;
        let lastTs: string | null = null;
        try {
          lastTs = await redis.get<string>(lastTsKey);
        } catch (err) {
          logger.warn(MODULE, `Failed to retrieve last_ts for channel ${channelId} from Redis:`, err);
        }

        const params: any = {
          channel: channelId,
          limit: 30
        };

        if (lastTs) {
          params.oldest = lastTs;
        }

        const response = await this.slackClient.conversations.history(params);
        const messages = (response.messages || []) as any[];
        logger.info(MODULE, `Found ${messages.length} messages in channel ${channelId} (since last_ts=${lastTs || 'none'})`);

        if (messages.length === 0) {
          continue;
        }

        const newestTs = messages[0].ts;

        for (const msg of messages) {
          // Skip bot messages
          if (msg.bot_id || msg.subtype === 'bot_message') {
            continue;
          }

          if (msg.reply_count && msg.reply_count > 0) {
            try {
              logger.info(MODULE, `Fetching ${msg.reply_count} replies for thread ${msg.ts} in channel ${channelId}`);
              const repliesRes = await this.slackClient.conversations.replies({
                channel: channelId,
                ts: msg.ts
              });
              const replies = (repliesRes.messages || []) as any[];
              for (const reply of replies) {
                if (reply.bot_id || reply.subtype === 'bot_message') {
                  continue;
                }
                signals.push({
                  id: `slack:${channelId}:${reply.ts}`,
                  source: 'slack',
                  timestamp: reply.ts,
                  content: reply.text || '',
                  author: reply.user || 'unknown',
                  context: {
                    channelId,
                    threadTs: reply.thread_ts || msg.ts
                  }
                });
              }
            } catch (replyErr) {
              logger.error(MODULE, `Failed to fetch replies for thread ${msg.ts} in channel ${channelId}:`, replyErr);
              // Fallback to adding the parent message only
              signals.push({
                id: `slack:${channelId}:${msg.ts}`,
                source: 'slack',
                timestamp: msg.ts,
                content: msg.text || '',
                author: msg.user || 'unknown',
                context: {
                  channelId,
                  threadTs: msg.thread_ts
                }
              });
            }
          } else {
            signals.push({
              id: `slack:${channelId}:${msg.ts}`,
              source: 'slack',
              timestamp: msg.ts,
              content: msg.text || '',
              author: msg.user || 'unknown',
              context: {
                channelId,
                threadTs: msg.thread_ts
              }
            });
          }
        }

        if (newestTs) {
          try {
            await redis.set(lastTsKey, newestTs);
            logger.info(MODULE, `Updated last_ts cursor for channel ${channelId} to ${newestTs}`);
          } catch (err) {
            logger.warn(MODULE, `Failed to save last_ts cursor for channel ${channelId} to Redis:`, err);
          }
        }
      } catch (err) {
        logger.error(MODULE, `Error collecting from channel ${channelId}:`, err);
      }
    }

    return signals;
  }
}

// Auto-register SlackCollector
collectorRegistry.register('slack', new SlackCollector());
