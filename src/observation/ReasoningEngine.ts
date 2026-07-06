import { chatCompletion } from '../tools/clients/nvidia';
import type { Finding } from '../../contracts/observation';
import { logger } from '../utils/logger';

const MODULE = 'ReasoningEngine';

const EVALUATION_SYSTEM_PROMPT = `You are Flint's Principal Reasoning Engine. Your goal is to evaluate candidate engineering findings collected from workspace signals (chat transcripts, alerts).

Perform a critical review of the incoming finding and output a JSON object containing:
{
  "isValid": true,
  "confidence": 0.95,
  "severity": "P1",
  "title": "Clean, descriptive engineering title",
  "summary": "Clear executive summary of the issue",
  "businessRisk": "Brief impact description"
}
Ensure isValid is false if the finding is conversational noise, social talk, spam, or not actionable for developers.`;

export async function evaluateFinding(finding: Finding): Promise<Finding | null> {
  logger.info(MODULE, `Evaluating candidate finding ${finding.id}...`);

  const signalsText = finding.signals.map(s => `[${s.timestamp} - Author: ${s.author}]: "${s.content}"`).join('\n');
  const promptPayload = [
    `Finding Type: ${finding.type}`,
    `Signals gathered:\n${signalsText}`,
    `Current Title: ${finding.title}`,
    `Current Summary: ${finding.summary}`
  ].join('\n');

  try {
    const rawResult = await chatCompletion(
      [{ role: 'user', content: promptPayload }],
      EVALUATION_SYSTEM_PROMPT
    );

    let parsed: any = null;
    try {
      const cleaned = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      logger.error(MODULE, 'Failed to parse AI evaluation JSON:', parseErr);
    }

    if (parsed) {
      if (parsed.isValid === false) {
        logger.info(MODULE, `Finding ${finding.id} evaluated as spam/invalid by AI. Filtering out.`);
        return null;
      }

      return {
        ...finding,
        title: parsed.title || finding.title,
        summary: parsed.summary || finding.summary,
        confidence: parsed.confidence ?? finding.confidence,
        severity: parsed.severity || finding.severity,
        metadata: {
          ...finding.metadata,
          businessRisk: parsed.businessRisk || ''
        }
      };
    }
  } catch (err) {
    logger.error(MODULE, 'AI evaluation failed. Falling back to default finding parameters.', err);
  }

  return finding;
}
