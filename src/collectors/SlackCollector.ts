import { WebClient } from '@slack/web-api';
import { env } from '../config/env';
import type { Collector } from './CollectorRegistry';
import type { WorkspaceConfig } from '../../contracts/services';
import type { Signal } from '../../contracts/observation';
import { collectorRegistry } from './CollectorRegistry';
import { logger } from '../utils/logger';

const MODULE = 'SlackCollector';

export class SlackCollector implements Collector {
  private slackClient: WebClient;

  constructor() {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN || env.SLACK_BOT_TOKEN);
  }

  async collect(config: WorkspaceConfig): Promise<Signal[]> {
    logger.info(MODULE, `Collecting messages across ${config.watchedChannels.length} watched channels...`);
    const signals: Signal[] = [];

    for (const channelId of config.watchedChannels) {
      try {
        const response = await this.slackClient.conversations.history({
          channel: channelId,
          limit: 30
        });

        const messages = (response.messages || []) as any[];
        logger.info(MODULE, `Found ${messages.length} messages in channel ${channelId}`);

        for (const msg of messages) {
          // Skip bot messages
          if (msg.bot_id || msg.subtype === 'bot_message') {
            continue;
          }

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
      } catch (err) {
        logger.error(MODULE, `Error collecting from channel ${channelId}:`, err);
      }
    }

    return signals;
  }
}

// Auto-register SlackCollector
collectorRegistry.register('slack', new SlackCollector());
