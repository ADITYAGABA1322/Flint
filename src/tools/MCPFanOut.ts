import type { IntentResult } from '../../contracts/planner';
import type { WorkspaceConfig, ActionResults } from '../../contracts/services';
import { Planner } from '../planner/Planner';
import { executeWorkflow } from '../orchestration/WorkflowOrchestrator';

export const executeActions = async (
  intent: IntentResult,
  config: WorkspaceConfig
): Promise<ActionResults> => {
  const planner = new Planner();
  const plan = await planner.plan(intent, config);

  return await executeWorkflow(plan);
};
