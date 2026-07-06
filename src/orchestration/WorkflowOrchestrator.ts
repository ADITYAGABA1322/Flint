import type { WorkflowPlan } from '../../contracts/orchestration';
import type { ActionResults, ActionResult } from '../../contracts/services';
import { registry } from './ClientRegistry';
import { logger } from '../utils/logger';

const MODULE = 'WorkflowOrchestrator';

export async function executeWorkflow(plan: WorkflowPlan): Promise<ActionResults> {
  logger.info(MODULE, `Executing workflow plan containing ${plan.steps.length} steps`);

  console.log('\nPlanner generated workflow:\n');
  plan.steps.forEach((step, index) => {
    const serverNameCap = step.server.charAt(0).toUpperCase() + step.server.slice(1);
    console.log(`Tool ${index + 1}:`);
    console.log(`${serverNameCap}\n`);
  });

  console.log('Executing...\n');

  const promises = plan.steps.map(async (step): Promise<ActionResult> => {
    const runner = registry.get(step.server);

    if (!runner) {
      logger.warn(MODULE, `No tool runner registered for server: "${step.server}"`);
      const serverNameCap = step.server.charAt(0).toUpperCase() + step.server.slice(1);
      console.log(`${serverNameCap} ✗\n`);
      return {
        tool: step.server as any,
        ok: false,
        description: `Unregistered tool runner for server: "${step.server}"`
      };
    }

    try {
      logger.info(MODULE, `Executing step: server="${step.server}", tool="${step.tool}"`);
      // Map WorkflowStep to ToolCall signature
      const call = {
        server: step.server as any,
        tool: step.tool,
        params: step.params
      };
      const result = await runner.run(call);
      const serverNameCap = step.server.charAt(0).toUpperCase() + step.server.slice(1);
      console.log(`${serverNameCap} ${result.ok ? '✓' : '✗'}\n`);
      return result;
    } catch (err: any) {
      logger.error(MODULE, `Exception executing step on "${step.server}":`, err);
      const serverNameCap = step.server.charAt(0).toUpperCase() + step.server.slice(1);
      console.log(`${serverNameCap} ✗\n`);
      return {
        tool: step.server as any,
        ok: false,
        description: `Orchestrator runner exception: ${err.message || String(err)}`
      };
    }
  });

  const results = await Promise.all(promises);
  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  const summary = `Workflow completed. Succeeded: ${succeeded.length}, Failed: ${failed.length}.`;
  console.log('Workflow completed.\n');

  logger.info(MODULE, summary);

  return {
    results,
    succeeded,
    failed,
    summary
  };
}
