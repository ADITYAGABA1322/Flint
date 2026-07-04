import type { KnownBlock } from '@slack/bolt';
import type { WorkspaceContext } from '../../contracts/context';

export function buildBriefingCard(context: WorkspaceContext): KnownBlock[] {
  const card: KnownBlock[] = [];

  if (context.isDuplicate && context.duplicateTarget) {
    const target = context.duplicateTarget;
    card.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚠️ Possible Duplicate Bug Detected*\nI found an existing Linear ticket matching your discussion:\n\n*<${target.url}|${target.id}: ${target.title}>* (Status: \`${target.status}\`)`
      }
    });

    if (context.similarThreads.length > 0) {
      const threadsList = context.similarThreads
        .slice(0, 3)
        .map(t => `• <${t.permalink}|#${t.channel}> by @${t.user}: _"${t.text.substring(0, 60)}..."_`)
        .join('\n');

      card.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🔍 Workspace History (Slack RTS)*\n${threadsList}`
        }
      });
    }

    card.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Link conversation to ticket' },
          action_id: 'flint_link_to_issue',
          value: target.id,
          style: 'primary'
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Ignore' },
          action_id: 'flint_ignore',
          value: 'ignore'
        }
      ]
    });
  } else {
    card.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚡ Proactive Task Suggestion*\nI observed a conversational bug report that isn't currently tracked:\n\n> _"${context.triggerMessage}"_`
      }
    });

    if (context.similarThreads.length > 0) {
      const threadsList = context.similarThreads
        .slice(0, 3)
        .map(t => `• <${t.permalink}|#${t.channel}> by @${t.user}: _"${t.text.substring(0, 60)}..."_`)
        .join('\n');

      card.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🔍 Workspace History (Slack RTS)*\n${threadsList}`
        }
      });
    }

    card.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Create Ticket' },
          action_id: 'flint_create_new_ticket',
          value: context.triggerMessage,
          style: 'primary'
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Ignore' },
          action_id: 'flint_ignore',
          value: 'ignore'
        }
      ]
    });
  }

  card.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '_Powered by Flint · AI Context & Workspace Search (RTS)_'
      }
    ]
  });

  return card;
}
