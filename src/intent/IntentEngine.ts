import type { SlackContext, PatternMatch } from '../../contracts/events';
import type { IntentResult, IntentType } from '../../contracts/planner';
import { CLASSIFY_SYSTEM_PROMPT } from './prompts/classify';
import { anthropic } from '../tools/clients/claude';
import type { TextBlock } from '@anthropic-ai/sdk/resources';

const VALID_INTENTS: IntentType[] = [
  'QUERY',
  'CREATE_TICKET',
  'CAPTURE_DECISION',
  'ASSIGN_TASK',
  'STATUS_CHECK',
  'SNOOZE',
  'NONE',
];

const FALLBACK: IntentResult = {
  intent: 'NONE',
  confidence: 0,
  entities: { toolTargets: [] },
  reasoning: 'classification failed or low confidence',
};

function buildPayload(ctx: SlackContext, pattern?: PatternMatch): string {
  if (pattern) {
    return [
      'A monitoring pattern was detected. Classify the workflow action it implies.',
      `Pattern type: ${pattern.type}`,
      `Summary: ${pattern.summary}`,
      `Source messages:\n${pattern.sourceMessages.map((m) => `- ${m.text}`).join('\n')}`,
    ].join('\n');
  }
  return [
    `A message was posted in channel <#${ctx.channelId}> by <@${ctx.userId}>.`,
    `Trigger: ${ctx.triggerType}${ctx.command ? ` (${ctx.command})` : ''}`,
    `Message: "${ctx.text}"`,
  ].join('\n');
}

function parseIntent(raw: string): IntentResult {
  try {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const obj = JSON.parse(cleaned) as Partial<IntentResult>;

    if (!obj.intent || !VALID_INTENTS.includes(obj.intent)) return FALLBACK;
    const confidence = typeof obj.confidence === 'number' ? obj.confidence : 0;
    const entities = obj.entities ?? { toolTargets: [] };
    if (!Array.isArray(entities.toolTargets)) entities.toolTargets = [];

    const result: IntentResult = {
      intent: confidence < 0.7 ? 'NONE' : obj.intent,
      confidence,
      entities,
      reasoning: obj.reasoning ?? '',
    };
    return result;
  } catch (err) {
    console.error('[IntentEngine] JSON parse failed:', err);
    return FALLBACK;
  }
}

export const classifyIntent = async (
  ctx: SlackContext,
  pattern?: PatternMatch,
): Promise<IntentResult> => {
  try {
    const res = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0,
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPayload(ctx, pattern) }],
    });

    const text = res.content
      .filter((b): b is TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const intent = parseIntent(text);
    console.log(`[IntentEngine] -> ${intent.intent} (${intent.confidence})`);
    return intent;
  } catch (err) {
    console.error('[IntentEngine] API call failed:', err);
    return FALLBACK;
  }
};
