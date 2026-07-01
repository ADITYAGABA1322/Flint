import type { App } from '@slack/bolt';
import { logger } from '../utils/logger';
import { classifyIntent } from '../intent/IntentEngine';
import { executeActions } from '../tools/MCPFanOut';
import { buildActionCard } from '../blocks/ActionCard';

const MODULE = 'SlackMentionHandler';

export function registerMentionHandler(app: App): void {
  app.event('app_mention', async ({ event, client, say }) => {
    logger.info(MODULE, `Received app_mention from user ${event.user} in channel ${event.channel}`);

    // Standard eye reactions to acknowledge event receipt
    await client.reactions.add({
      channel: event.channel,
      timestamp: event.ts,
      name: 'eyes'
    }).catch(() => {});

    const cleanText = event.text.replace(/<@[^>]+>/g, '').trim();

    const ctx = {
      workspaceId: event.team || 'unknown',
      channelId: event.channel,
      userId: event.user || 'unknown',
      messageTs: event.ts,
      threadTs: event.thread_ts,
      text: cleanText,
      triggerType: 'mention' as const,
      rawEvent: event
    };

    const intent = await classifyIntent(ctx);

    if (intent.intent === 'NONE') {
      await say({
        thread_ts: event.ts,
        text: 'Not sure that needs an action from me — say the word if it does. ⚡'
      });
      return;
    }

    const results = await executeActions(intent, {
      workspaceId: ctx.workspaceId,
      watchedChannels: [ctx.channelId],
      thresholds: { stalePrHours: 48, unansweredHours: 4, duplicateWindowHours: 2 },
      enabledPatterns: [],
      connectedTools: [],
      aggressiveness: 'normal'
    });

    const blocks = buildActionCard(null, results);
    await say({
      thread_ts: event.ts,
      blocks,
      text: results.summary
    });

    await client.reactions.add({
      channel: event.channel,
      timestamp: event.ts,
      name: 'white_check_mark'
    }).catch(() => {});
  });
}
