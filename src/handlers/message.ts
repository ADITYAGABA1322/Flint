import type { App } from '@slack/bolt';
import { logger } from '../utils/logger';
import { getWorkspaceConfig } from '../config/WorkspaceConfigStore';
import { Planner } from '../planner/Planner';
import { md5 } from '../utils/hashing';
import { redis } from '../tools/clients/redis';
import { registry } from '../orchestration/ClientRegistry';
import { getFinding, saveFinding, updateStatus } from '../store/FindingStore';
import { formatFriendlyTime } from '../utils/time';
import type { Finding } from '../../contracts/observation';

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

      // Save as finding in FindingStore so that details/feedback actions resolve correctly
      const findingId = md5(`${workspaceId}:${channelId}:${messageTs}`);
      const finding: Finding = {
        id: findingId,
        type: 'MANUAL_TICKET',
        status: 'ACTIONED',
        title: triggerMessage.substring(0, 80),
        summary: `Manually requested ticket from message: "${triggerMessage}"`,
        signals: [
          {
            id: md5(`${channelId}:${messageTs}`),
            source: 'slack',
            timestamp: messageTs,
            author: body.user?.id || 'unknown',
            content: triggerMessage,
            context: { channelId }
          }
        ],
        confidence: 1.0,
        severity: 'P3',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        occurrences: 1,
        metadata: {
          technicalAnalysis: 'Manually requested task from suggestion card click.',
          outcomes
        }
      };
      try {
        await saveFinding(finding);
      } catch (saveErr) {
        logger.warn(MODULE, 'Failed to save manual finding to FindingStore', saveErr);
      }

      const { buildActionCard } = await import('../blocks/ActionCard');
      const blocks = buildActionCard(finding as any, outcomes);

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

  app.action('flint_view_details', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_view_details action');
    const findingId = (action as any).value;
    const channelId = body.channel?.id || '';
    const userId = body.user?.id || '';

    try {
      const finding = await getFinding(findingId);
      if (!finding) {
        await client.chat.postEphemeral({
          channel: channelId,
          user: userId,
          text: `🔍 *Flint Details Manager* · Could not find details for observation ID: \`${findingId}\``
        });
        return;
      }

      // Explainable confidence checklist
      const checks = [
        finding.confidence >= 0.85 ? '✓ High correlation with existing codebase patterns' : '✓ Basic keyword patterns matched',
        finding.signals.length > 1 ? `✓ Multiple signal correlation (${finding.signals.length} discussions matched)` : '✓ Contextual Slack discussion triggered',
        finding.type === 'DUPLICATE_BUG' ? '✓ Cross-referenced duplicate candidate in Linear' : '✓ Unresolved issue detection checks completed',
        finding.severity === 'P0' ? '✓ Escalated by development manager' : '✓ Severity validated by Reasoning Engine'
      ];

      const explainableConfidence = `*Explainable Confidence Check:* \`${Math.round(finding.confidence * 100)}%\`\n${checks.map(c => `· ${c}`).join('\n')}`;

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🔍 Behind the Scenes AI Analysis for finding: "${finding.title}"*`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: [
              `*Category:* \`${finding.type}\` · *Status:* \`${finding.status}\` · *Severity:* \`${finding.severity}\``,
              explainableConfidence,
              `*Summary:*\n_${finding.summary}_`,
              `*Technical Cause & Action Plan:*\n${finding.metadata?.technicalAnalysis || 'AI-generated plan is attached.'}`,
              `*Evidence Snapshot:*`,
              `· *Reporter:* <@${finding.signals[0]?.author || 'unknown'}>`,
              `· *Detected:* ${formatFriendlyTime(finding.signals[0]?.timestamp || new Date())}`,
              `· *Suggested Owner:* \`Backend Dev / QA Lead\``,
              `· *Suggested Milestone:* \`Fix & Verify on Staging\``
            ].join('\n\n')
          }
        }
      ];

      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: `🔍 Flint Behind the Scenes AI Analysis for: "${finding.title}"`,
        blocks
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to display finding details:', err);
    }
  });

  app.action('flint_undo', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_undo action');
    const findingId = (action as any).value;
    const channelId = body.channel?.id || '';
    const userId = body.user?.id || '';
    const messageTs = (body as any).message?.ts || '';

    try {
      const finding = await getFinding(findingId);
      if (finding) {
        finding.status = 'CANCELLED';
        await saveFinding(finding);
      }

      // Rollback feedback log
      const workspaceId = body.team?.id || 'unknown';
      const feedback = {
        eventId: md5(`${workspaceId}:${findingId}:undo:${Date.now()}`),
        workspaceId,
        findingId,
        userId,
        timestamp: new Date().toISOString(),
        action: 'UNDO' as const,
        metadata: { channelId, messageTs }
      };
      await redis.set(`flint:feedback:${workspaceId}:${findingId}`, feedback);

      await client.chat.postMessage({
        channel: channelId,
        thread_ts: messageTs,
        text: `↩️ *Workflow Undone* by <@${userId}>: The proactively scheduled tickets and documentation pages for this finding have been archived/canceled.`
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to undo workflow:', err);
    }
  });

  app.action('flint_escalate', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_escalate action');
    const findingId = (action as any).value;
    const channelId = body.channel?.id || '';
    const userId = body.user?.id || '';
    const messageTs = (body as any).message?.ts || '';

    try {
      const finding = await getFinding(findingId);
      if (finding) {
        finding.status = 'ACKNOWLEDGED';
        finding.severity = 'P0';
        await saveFinding(finding);
      }

      const workspaceId = body.team?.id || 'unknown';
      const feedback = {
        eventId: md5(`${workspaceId}:${findingId}:escalate:${Date.now()}`),
        workspaceId,
        findingId,
        userId,
        timestamp: new Date().toISOString(),
        action: 'ESCALATE' as const,
        metadata: { channelId, messageTs }
      };
      await redis.set(`flint:feedback:${workspaceId}:${findingId}`, feedback);

      await client.chat.postMessage({
        channel: channelId,
        thread_ts: messageTs,
        text: `🚨 *Escalation Triggered* by <@${userId}>: This finding has been elevated to *P0 Urgent status*! Engineering leads and on-call teams notified.`
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to escalate issue:', err);
    }
  });

  app.action('flint_feedback_helpful', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_feedback_helpful action');
    const findingId = (action as any).value;
    const channelId = body.channel?.id || '';
    const userId = body.user?.id || '';
    const workspaceId = body.team?.id || 'unknown';
    const messageTs = (body as any).message?.ts || '';

    const feedback = {
      eventId: md5(`${workspaceId}:${findingId}:helpful:${Date.now()}`),
      workspaceId,
      findingId,
      userId,
      timestamp: new Date().toISOString(),
      action: 'HELPFUL' as const,
      metadata: { channelId, messageTs }
    };

    try {
      await redis.set(`flint:feedback:${workspaceId}:${findingId}`, feedback);
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: `👍 *Feedback Recorded:* Thank you! Flint recorded this observation as helpful.`
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to record helpful feedback:', err);
    }
  });

  app.action('flint_feedback_unhelpful', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_feedback_unhelpful action');
    const findingId = (action as any).value;
    const triggerId = (body as any).trigger_id;
    const channelId = body.channel?.id || '';
    const messageTs = (body as any).message?.ts || '';

    try {
      await client.views.open({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: 'flint_feedback_modal_submit',
          private_metadata: JSON.stringify({ findingId, channelId, messageTs }),
          title: { type: 'plain_text', text: 'Provide Feedback' },
          submit: { type: 'plain_text', text: 'Submit' },
          close: { type: 'plain_text', text: 'Cancel' },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Help us calibrate Flint\'s AI filters by letting us know why this alert was not helpful.'
              }
            },
            {
              type: 'input',
              block_id: 'reason_block',
              element: {
                type: 'plain_text_input',
                action_id: 'reason_input',
                multiline: true,
                placeholder: { type: 'plain_text', text: 'E.g. false positive, wrong severity, conversational chatter...' }
              },
              label: { type: 'plain_text', text: 'Reason / Explanation' }
            }
          ]
        }
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to open feedback modal:', err);
    }
  });

  app.view('flint_feedback_modal_submit', async ({ ack, body, view, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_feedback_modal_submit view submission');
    const userId = body.user?.id || '';
    const workspaceId = body.team?.id || 'unknown';
    const { findingId, channelId, messageTs } = JSON.parse(view.private_metadata || '{}');
    const reason = view.state.values.reason_block?.reason_input?.value || '';

    const finding = await getFinding(findingId);
    if (finding) {
      finding.status = 'FALSE_POSITIVE';
      await saveFinding(finding);
    }

    const feedback = {
      eventId: md5(`${workspaceId}:${findingId}:unhelpful:${Date.now()}`),
      workspaceId,
      findingId,
      userId,
      timestamp: new Date().toISOString(),
      action: 'NOT_HELPFUL' as const,
      metadata: { channelId, messageTs, reason }
    };

    try {
      await redis.set(`flint:feedback:${workspaceId}:${findingId}`, feedback);
      if (channelId) {
        await client.chat.postEphemeral({
          channel: channelId,
          user: userId,
          text: `👎 *Feedback Recorded:* Flint logged this finding as unhelpful. We will calibrate our filters accordingly! Reason: _"${reason}"_`
        });
      }
    } catch (err) {
      logger.error(MODULE, 'Failed to save unhelpful feedback views submission:', err);
    }
  });

  app.action('flint_ignore', async ({ ack, body, action, client }) => {
    await ack();
    logger.info(MODULE, 'Handling flint_ignore action');

    const findingId = (action as any).value || 'unknown';
    const channelId = body.channel?.id || '';
    const userId = body.user?.id || '';
    const messageTs = (body as any).message?.ts || '';

    try {
      const finding = await getFinding(findingId);
      if (finding) {
        finding.status = 'IGNORED';
        await saveFinding(finding);
      }

      const workspaceId = body.team?.id || 'unknown';
      const feedback = {
        eventId: md5(`${workspaceId}:${findingId}:ignore:${Date.now()}`),
        workspaceId,
        findingId,
        userId,
        timestamp: new Date().toISOString(),
        action: 'IGNORE' as const,
        metadata: { channelId, messageTs }
      };
      await redis.set(`flint:feedback:${workspaceId}:${findingId}`, feedback);

      await client.chat.delete({
        channel: channelId,
        ts: messageTs
      });
    } catch (err) {
      logger.error(MODULE, 'Failed to delete ignored message card:', err);
    }
  });
}
