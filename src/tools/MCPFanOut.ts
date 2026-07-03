import type { IntentResult } from '../../contracts/planner';
import type { WorkspaceConfig, ActionResult, ActionResults } from '../../contracts/services';
import { Planner } from '../planner/Planner';
import * as linear from './mcp/LinearClient';

export const executeActions = async (
  intent: IntentResult,
  config: WorkspaceConfig
): Promise<ActionResults> => {
  const planner = new Planner();
  const plan = await planner.plan(intent, config);

  const succeeded: ActionResult[] = [];
  const failed: ActionResult[] = [];
  const results: ActionResult[] = [];

  for (const call of plan.calls) {
    if (call.server === 'linear') {
      const res = await linear.run(call);
      results.push(res);
      if (res.ok) {
        succeeded.push(res);
      } else {
        failed.push(res);
      }
    }
  }

  return {
    results,
    succeeded,
    failed,
    summary: `Processed tool actions. Succeeded: ${succeeded.length}, Failed: ${failed.length}`
  };
};
