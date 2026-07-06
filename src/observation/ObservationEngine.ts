import { WebClient } from '@slack/web-api';
import { env } from '../config/env';
import { collectorRegistry } from '../collectors/CollectorRegistry';
import { detectorRegistry } from '../detectors/DetectorRegistry';
import { correlateSignals } from './CorrelationEngine';
import { evaluateFinding } from './ReasoningEngine';
import { isFresh, saveFinding, updateStatus } from '../store/FindingStore';
import { Planner } from '../planner/Planner';
import { executeWorkflow } from '../orchestration/WorkflowOrchestrator';
import { buildActionCard } from '../blocks/ActionCard';
import { getWorkspaceConfig } from '../config/WorkspaceConfigStore';
import { logger } from '../utils/logger';
import type { Finding, Signal } from '../../contracts/observation';
import type { SlackContext } from '../../contracts/events';
import type { IntentResult } from '../../contracts/planner';

const MODULE = 'ObservationEngine';

// Import collectors and detectors to ensure auto-registration
import '../collectors/SlackCollector';
import '../detectors/DuplicateBugDetector';

export async function runObservationCycle(workspaceId: string): Promise<Finding[]> {
  logger.info(MODULE, `--- Starting Observation Cycle for ${workspaceId} ---`);
  const config = await getWorkspaceConfig(workspaceId);
  const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN || env.SLACK_BOT_TOKEN);

  // 1. Ingestion Phase
  const rawSignals: Signal[] = [];
  const collectors = collectorRegistry.getAll();
  for (const [name, collector] of collectors) {
    try {
      const signals = await collector.collect(config);
      logger.info(MODULE, `Collector "${name}" fetched ${signals.length} signals`);
      rawSignals.push(...signals);
    } catch (err) {
      logger.error(MODULE, `Collector "${name}" failed:`, err);
    }
  }

  // 2. Correlation Phase
  const groups = correlateSignals(rawSignals);
  logger.info(MODULE, `Correlated ${rawSignals.length} signals into ${groups.length} groups`);

  const triggeredFindings: Finding[] = [];

  // 3. Detection Phase
  const detectors = detectorRegistry.getAll();
  for (const group of groups) {
    for (const detector of detectors) {
      try {
        const candidates = await detector.detect(group, config);
        for (const candidate of candidates) {
          // 4. State & Lifecycle Check
          const fresh = await isFresh(candidate.id);
          if (!fresh) {
            logger.debug(MODULE, `Finding ${candidate.id} has already been actioned recently. Skipping.`);
            continue;
          }

          // 5. Reasoning Phase
          const evaluated = await evaluateFinding(candidate);
          if (!evaluated) {
            continue;
          }

          // Transition to CONFIRMED
          evaluated.status = 'CONFIRMED';
          await saveFinding(evaluated);

          // 6. Action Execution (Planner & Orchestrator Integration)
          if (evaluated.confidence >= 0.80) {
            logger.info(MODULE, `Finding ${evaluated.id} confidence ${evaluated.confidence} >= 0.80. Executing proactive actions...`);

            // Synthesize mock SlackContext for trigger
            const targetChannel = config.escalationChannel || 'C12345';
            const triggerSig = evaluated.signals[0];
            const slackCtx: SlackContext = {
              workspaceId,
              channelId: triggerSig.context.channelId as string || targetChannel,
              userId: triggerSig.author,
              messageTs: triggerSig.timestamp,
              text: triggerSig.content,
              triggerType: 'observation',
              rawEvent: {}
            };

            const intent: IntentResult = {
              intent: 'CREATE_TICKET',
              confidence: evaluated.confidence,
              entities: {
                title: evaluated.title,
                description: evaluated.summary,
                severity: evaluated.severity,
                toolTargets: config.connectedTools
              },
              reasoning: 'Autonomously triggered via continuous observation'
            };

            // Call stable Sprint 3 Planner
            const planner = new Planner();
            const plan = await planner.plan(intent, config, slackCtx);

            // Execute Workflow via Orchestrator
            const outcomes = await executeWorkflow(plan);

            // Post Proactive Alert ActionCard to Slack
            const titleBlock = {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🚨 *Flint Proactive Observation Alert*\nFlint autonomously detected workflow friction (*${evaluated.type}*) in <#${slackCtx.channelId}>:\n\n> *${evaluated.title}*\n> _${evaluated.summary}_`
              }
            };
            const outcomeCards = buildActionCard(null, outcomes);
            const alertBlocks = [titleBlock, ...outcomeCards];

            await slackClient.chat.postMessage({
              channel: targetChannel,
              text: `🚨 Flint Proactive Observation Alert: ${evaluated.title}`,
              blocks: alertBlocks
            });

            // Transition to ACTIONED
            await updateStatus(evaluated.id, 'ACTIONED');
            triggeredFindings.push(evaluated);
          }
        }
      } catch (err) {
        logger.error(MODULE, `Error running detector on group ${group.id}:`, err);
      }
    }
  }

  logger.info(MODULE, `--- Finished Observation Cycle. Actioned ${triggeredFindings.length} findings. ---`);
  return triggeredFindings;
}
