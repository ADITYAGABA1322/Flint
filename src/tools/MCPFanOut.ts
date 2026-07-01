import type { IntentResult } from '../../contracts/planner';
import type { WorkspaceConfig, ActionResult, ActionResults } from '../../contracts/services';
import * as linear from './mcp/LinearClient';

export const executeActions = async (
  intent: IntentResult,
  _config: WorkspaceConfig
): Promise<ActionResults> => {
  const succeeded: ActionResult[] = [];
  const failed: ActionResult[] = [];
  const results: ActionResult[] = [];

  const targets = intent.entities.toolTargets;

  if (targets.includes('linear')) {
    const res = await linear.run({
      server: 'linear',
      tool: 'create_issue',
      params: {
        title: intent.entities.title || 'Slack captured ticket',
        description: intent.entities.description || '',
        priority: intent.entities.severity || 'P2'
      }
    });
    results.push(res);
    if (res.ok) {
      succeeded.push(res);
    } else {
      failed.push(res);
    }
  }

  return {
    results,
    succeeded,
    failed,
    summary: `Processed tool actions. Succeeded: ${succeeded.length}, Failed: ${failed.length}`
  };
};
