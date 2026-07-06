import type { IntentResult } from '../../contracts/planner';
import type { WorkspaceConfig, ActionResults } from '../../contracts/services';
import type { SlackContext } from '../../contracts/events';
import { Planner } from '../planner/Planner';
import { executeWorkflow } from '../orchestration/WorkflowOrchestrator';

export const executeActions = async (
  intent: IntentResult,
  config: WorkspaceConfig,
  ctx?: SlackContext
): Promise<ActionResults> => {
  const planner = new Planner();
  const plan = await planner.plan(intent, config, ctx);

  return await executeWorkflow(plan);
};
