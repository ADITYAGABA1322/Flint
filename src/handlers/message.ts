import type { App } from '@slack/bolt';
import { logger } from '../utils/logger';
import { getWorkspaceConfig } from '../config/WorkspaceConfigStore';
import { Planner } from '../planner/Planner';
import { md5 } from '../utils/hashing';
import { redis } from '../tools/clients/redis';
import { registry } from '../orchestration/ClientRegistry';

const MODULE = 'SlackMessageHandler';

export function registerMessageHandler(app: App): void {
  logger.info(MODULE, 'Registering message handler listener');
  app.message(async ({ message, client }) => {
    const event = message as any;
    logger.info(MODULE, `Raw message event received: ${JSON.stringify(event)}`);
    if (event.subtype || (event as any).bot_id) {
      logger.info(MODULE, `Skipping message event: subtype="${event.subtype}", bot_id="${(event as any).bot_id}"`);
      return;
    }
    if (event.thread_ts) {
      logger.info(MODULE, `Skipping message event: is thread reply thread_ts="${event.thread_ts}"`);
      return;
    }

    logger.info(MODULE, `Processing passive observation message from user ${event.user} in channel ${event.channel}`);
    logger.info(MODULE, 'Message received');

    try {
      const config = await getWorkspaceConfig(event.team || 'unknown');
      
      // Auto-register the channel to watchedChannels list upon receiving any message in it
      if (!config.watchedChannels.includes(event.channel)) {
        config.watchedChannels.push(event.channel);
        if (!config.escalationChannel) {
          config.escalationChannel = event.channel;
        }
        try {
          await redis.set(`workspace:config:${event.team || 'unknown'}`, config);
          logger.info(MODULE, `Dynamically registered channel "${event.channel}" to watched list in Redis.`);
        } catch (redisErr) {
          logger.warn(MODULE, 'Failed to save auto-registered channel to Redis config', redisErr);
        }
      }

      const cleanText = event.text ? event.text.replace(/<@[^>]+>/g, '').trim() : '';
      if (cleanText.length < 10) {
        logger.info(MODULE, `Skipping message: clean text length is less than 10 characters ("${cleanText}")`);
        return;
      }

      const ctx = {
        workspaceId: event.team || 'unknown',
        channelId: event.channel,
        userId: event.user || 'unknown',
        messageTs: event.ts,
        text: cleanText,
        triggerType: 'observation' as const,
        rawEvent: event
      };

      logger.info(MODULE, `Calling Planner.planObservation with text="${cleanText}"`);
      const planner = new Planner();
      const plan = await planner.planObservation(ctx, config);

      logger.info(MODULE, `Planner outcome: shouldSuggest=${plan.shouldSuggest}`);

      if (plan.shouldSuggest && plan.blocks) {
        logger.info(MODULE, 'Posting briefing card');
        await client.chat.postMessage({
          channel: event.channel,
          thread_ts: event.ts,
          blocks: plan.blocks,
          text: plan.textSummary || 'Flint observed an actionable task.'
        });

        const messageHash = md5(cleanText);
        const suggestKey = `workspace:suggested:${event.channel}:${messageHash}`;
        logger.info(MODULE, `Setting Redis deduplication key "${suggestKey}"`);
        await redis.set(suggestKey, new Date().toISOString(), { ex: 7200 }).catch((err) => {
          logger.warn(MODULE, 'Failed to save deduplication key to Redis', err);
        });
      }
    } catch (err) {
      logger.error(MODULE, 'Error in passive observation handler:', err);
    }
  });
}

export function registerActionHandlers(app: App): void {
  logger.info(MODULE, 'Registering Block Kit action handlers');
  app.action('flint_link_to_issue', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_link_to_issue action');

    const issueId = (action as any).value;
    const channelId = body.channel?.id || '';
    const messageTs = (body as any).message?.thread_ts || (body as any).message?.ts || '';

    try {
      const history = await client.conversations.replies({
        channel: channelId,
        ts: messageTs,
        limit: 10
      });

      const threadMessages = history.messages || [];
      const logContent = threadMessages
        .map((m) => `[User: ${m.user}] ${m.text}`)
        .join('\n');

      const permalinkRes = await client.chat.getPermalink({
        channel: channelId,
        message_ts: messageTs
      });

      const permalink = permalinkRes.permalink || '';

      const runner = registry.get('linear');
      if (!runner) throw new Error('Linear runner not registered');
      await runner.run({
        server: 'linear',
        tool: 'save_comment',
        params: {
          issue: issueId,
          body: `Linked Slack discussion thread: ${permalink}\n\nChat logs:\n\`\`\`\n${logContent}\n\`\`\``
        }
      });

      await client.chat.update({
        channel: channelId,
        ts: (body as any).message.ts,
        text: `✅ Slack thread linked to Linear issue ${issueId} successfully!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *Slack Thread Linked*\nI've linked this conversation history directly to issue *${issueId}*!`
            }
          }
        ]
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to link thread:', err);
    }
  });

  app.action('flint_create_new_ticket', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_create_new_ticket action');

    const triggerMessage = (action as any).value;
    const channelId = body.channel?.id || '';
    const messageTs = (body as any).message?.thread_ts || (body as any).message?.ts || '';
    const workspaceId = body.team?.id || 'unknown';

    try {
      const config = await getWorkspaceConfig(workspaceId);
      const intent = {
        intent: 'CREATE_TICKET' as const,
        confidence: 1.0,
        entities: {
          title: triggerMessage.substring(0, 80),
          description: `Captured proactively from Slack discussion:\n> "${triggerMessage}"`,
          severity: 'P3' as const,
          toolTargets: config.connectedTools
        },
        reasoning: 'Proactive creation from suggestion card click'
      };

      const ctx = {
        workspaceId,
        channelId,
        userId: body.user?.id || 'unknown',
        messageTs,
        text: triggerMessage,
        triggerType: 'action' as const,
        rawEvent: body
      };

      const planner = new Planner();
      const plan = await planner.plan(intent, config, ctx);

      const { executeWorkflow } = await import('../orchestration/WorkflowOrchestrator');
      const outcomes = await executeWorkflow(plan);

      const blocks: any[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*:zap: Flint Workflow Executed:*`
          }
        }
      ];

      outcomes.results.forEach((res) => {
        const icon = res.ok ? '✅' : '❌';
        const displayTool = res.tool.toUpperCase();
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${icon} *${displayTool}*\n${res.description}${res.url ? ` · <${res.url}|View Item>` : ''}`
          }
        });
      });

      await client.chat.update({
        channel: channelId,
        ts: (body as any).message.ts,
        text: `✅ Workflow executed: ${outcomes.summary}`,
        blocks
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to create ticket from suggestion:', err);
    }
  });

  app.action('flint_ignore', async ({ ack, body, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_ignore action');

    const channelId = body.channel?.id || '';
    const messageTs = (body as any).message.ts;

    try {
      await client.chat.delete({
        channel: channelId,
        ts: messageTs
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to delete ignored message card:', err);
    }
  });
}
