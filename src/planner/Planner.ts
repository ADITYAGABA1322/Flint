import type { SlackContext } from '../../contracts/events';
import type { WorkspaceConfig, ToolCall } from '../../contracts/services';
import type { IntentResult } from '../../contracts/planner';
import { gatherContext } from '../context/ContextEngine';
import { classifyIntent } from '../intent/IntentEngine';
import type { KnownBlock } from '@slack/bolt';
import { buildBriefingCard } from '../blocks/BriefingCard';

export interface ProactiveObservationPlan {
  shouldSuggest: boolean;
  blocks?: KnownBlock[];
  textSummary?: string;
}

export class Planner {
  async plan(intent: IntentResult, config: WorkspaceConfig): Promise<{ calls: ToolCall[] }> {
    const calls: ToolCall[] = [];

    if (intent.intent === 'CREATE_TICKET' && config.connectedTools.includes('linear')) {
      calls.push({
        server: 'linear',
        tool: 'create_issue',
        params: {
          title: intent.entities.title || 'Untitled Issue',
          description: intent.entities.description || '',
          priority: intent.entities.severity || 'P3'
        }
      });
    }

    return {
      calls
    };
  }
  async planObservation(
    ctx: SlackContext,
    config: WorkspaceConfig
  ): Promise<ProactiveObservationPlan> {
    console.log('[Planner] Planner entered');
    console.log(`[Planner] planObservation triggered for message: "${ctx.text}"`);
    // 1. Classification (Intelligence)
    const intent = await classifyIntent(ctx);
    console.log(`[Planner] Intent classification: intent="${intent.intent}", confidence=${intent.confidence}`);
    console.log('[Planner] Intent detected');

    if (intent.intent !== 'CREATE_TICKET' || intent.confidence < 0.70) {
      console.log(`[Planner] Classification did not match CREATE_TICKET or confidence < 0.70. Skipping suggestion.`);
      return { shouldSuggest: false };
    }

    // 2. Load Unified Context (ContextEngine boundary)
    console.log(`[Planner] Actionable intent found. Calling ContextEngine.gatherContext...`);
    const context = await gatherContext(ctx, config);
    console.log(`[Planner] Context loaded: threadsCount=${context.similarThreads.length}, issuesCount=${context.similarIssues.length}, isDuplicate=${context.isDuplicate}, isAlreadySuggested=${context.isAlreadySuggested}`);
    console.log('[Planner] Context gathered');

    // 3. Deduplication Check
    if (context.isAlreadySuggested) {
      console.log(`[Planner] Suggestion already sent recently inside deduplication window. Skipping.`);
      return { shouldSuggest: false };
    }

    // 4. Formulate UX blocks
    console.log(`[Planner] Creating briefing card Block Kit layout. duplicateTarget=${context.duplicateTarget?.id}`);
    const blocks = buildBriefingCard(context);
    const textSummary = context.isDuplicate
      ? `⚠️ Possible Duplicate Bug Detected: ${context.duplicateTarget?.id}`
      : `⚡ Proactive Task Suggestion: "${context.triggerMessage}"`;

    return {
      shouldSuggest: true,
      blocks,
      textSummary
    };
  }
}
