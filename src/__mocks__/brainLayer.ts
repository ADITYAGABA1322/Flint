import type { ClassifyIntent } from '../../contracts/planner';
import type { KnownBlock } from '@slack/bolt';
import type { PatternMatch } from '../../contracts/events';
import type { ActionResults } from '../../contracts/services';

export const classifyIntent: ClassifyIntent = async (ctx) => {
  return {
    intent: 'CREATE_TICKET',
    confidence: 0.95,
    entities: {
      title: 'Payment gateway crash',
      description: ctx.text,
      severity: 'P1',
      toolTargets: ['linear', 'notion'],
      assigneeHint: '@aditya',
    },
    reasoning: 'The text describes a critical payment checkout crash.',
  };
};

export const buildActionCard = (
  pattern: any,
  results: any
): KnownBlock[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚡ Flint Mocked Action summary*\n${results.summary}`,
      },
    },
  ];
};
