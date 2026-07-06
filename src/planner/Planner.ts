import type { SlackContext } from '../../contracts/events';
import type { WorkspaceConfig } from '../../contracts/services';
import type { IntentResult } from '../../contracts/planner';
import type { WorkflowPlan, WorkflowStep } from '../../contracts/orchestration';
import type { EngineeringArtifact } from '../../contracts/artifact';
import { gatherContext } from '../context/ContextEngine';
import { classifyIntent } from '../intent/IntentEngine';
import type { KnownBlock } from '@slack/bolt';
import { buildBriefingCard } from '../blocks/BriefingCard';
import { synthesizeArtifact } from './ArtifactSynthesizer';
import { renderLinear } from '../renderers/LinearRenderer';
import { renderNotion } from '../renderers/NotionRenderer';
import { renderAsana } from '../renderers/AsanaRenderer';

export interface ProactiveObservationPlan {
  shouldSuggest: boolean;
  blocks?: KnownBlock[];
  textSummary?: string;
}

function buildFallbackArtifact(intent: IntentResult, ctx?: SlackContext): EngineeringArtifact {
  return {
    title: intent.entities.title || 'Untitled Issue',
    executiveSummary: intent.entities.description || 'Slack triggered workflow.',
    observedBehavior: ctx?.text || intent.entities.description || 'Not specified.',
    expectedBehavior: 'Not specified.',
    businessImpact: 'Not specified.',
    technicalAnalysis: 'No analysis available.',
    priority: intent.entities.severity || 'P3',
    labels: [],
    evidence: {
      slackUrl: undefined,
      reporter: ctx?.userId || 'unknown',
      channel: ctx?.channelId || 'unknown',
      timestamp: ctx?.messageTs || String(new Date().getTime() / 1000)
    },
    acceptanceCriteria: ['Verify resolution with reporter.'],
    relatedIssues: []
  };
}

export class Planner {
  async plan(
    intent: IntentResult,
    config: WorkspaceConfig,
    ctx?: SlackContext
  ): Promise<WorkflowPlan> {
    const steps: WorkflowStep[] = [];

    if (intent.intent === 'CREATE_TICKET') {
      let artifact: EngineeringArtifact;

      if (ctx) {
        try {
          const workspaceCtx = await gatherContext(ctx, config);
          artifact = await synthesizeArtifact(ctx, workspaceCtx);
        } catch (err) {
          console.error('[Planner] Failed to enrich artifact details, falling back to intent values:', err);
          artifact = buildFallbackArtifact(intent, ctx);
        }
      } else {
        artifact = buildFallbackArtifact(intent, ctx);
      }

      if (config.connectedTools.includes('linear')) {
        const rendered = renderLinear(artifact);
        steps.push({
          server: 'linear',
          tool: 'create_issue',
          params: {
            title: rendered.title,
            description: rendered.description,
            priority: rendered.priority
          }
        });
      }

      if (config.connectedTools.includes('notion')) {
        const rendered = renderNotion(artifact);
        steps.push({
          server: 'notion',
          tool: 'create_page',
          params: {
            title: rendered.title,
            blocks: rendered.blocks
          }
        });
      }

      if (config.connectedTools.includes('asana')) {
        const rendered = renderAsana(artifact);
        steps.push({
          server: 'asana',
          tool: 'create_task',
          params: {
            name: rendered.name,
            notes: rendered.notes,
            subtasks: rendered.subtasks
          }
        });
      }
    }

    return {
      steps
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
