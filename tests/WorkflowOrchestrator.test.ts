import { vi, describe, it, expect, beforeEach } from 'vitest';
import { executeWorkflow } from '../src/orchestration/WorkflowOrchestrator';
import { registry } from '../src/orchestration/ClientRegistry';
import type { ToolCall, ActionResult } from '../contracts/services';
import type { ToolRunner, WorkflowPlan } from '../contracts/orchestration';

describe('WorkflowOrchestrator', () => {
  beforeEach(() => {
    registry.clear();
  });

  it('should run multiple steps in parallel and return aggregated results', async () => {
    const mockLinearRunner: ToolRunner = {
      async run(call: ToolCall): Promise<ActionResult> {
        return { tool: 'linear', ok: true, description: 'Linear issue created' };
      }
    };

    const mockNotionRunner: ToolRunner = {
      async run(call: ToolCall): Promise<ActionResult> {
        return { tool: 'notion', ok: true, description: 'Notion page logged' };
      }
    };

    registry.register('linear', mockLinearRunner);
    registry.register('notion', mockNotionRunner);

    const plan: WorkflowPlan = {
      steps: [
        { server: 'linear', tool: 'create_issue', params: { title: 'Bug A' } },
        { server: 'notion', tool: 'create_page', params: { title: 'Bug A documentation' } }
      ]
    };

    const outcomes = await executeWorkflow(plan);
    expect(outcomes.results.length).toBe(2);
    expect(outcomes.succeeded.length).toBe(2);
    expect(outcomes.failed.length).toBe(0);
    expect(outcomes.summary).toContain('Succeeded: 2, Failed: 0');
  });

  it('should isolate partial failures and capture error logs', async () => {
    const mockLinearRunner: ToolRunner = {
      async run(call: ToolCall): Promise<ActionResult> {
        return { tool: 'linear', ok: true, description: 'Linear issue created' };
      }
    };

    const mockAsanaRunner: ToolRunner = {
      async run(call: ToolCall): Promise<ActionResult> {
        throw new Error('Asana API error 500');
      }
    };

    registry.register('linear', mockLinearRunner);
    registry.register('asana', mockAsanaRunner);

    const plan: WorkflowPlan = {
      steps: [
        { server: 'linear', tool: 'create_issue', params: { title: 'Bug B' } },
        { server: 'asana', tool: 'create_task', params: { title: 'Bug B tracking' } }
      ]
    };

    const outcomes = await executeWorkflow(plan);
    expect(outcomes.results.length).toBe(2);
    expect(outcomes.succeeded.length).toBe(1);
    expect(outcomes.failed.length).toBe(1);
    expect(outcomes.failed[0].description).toContain('Orchestrator runner exception: Asana API error 500');
    expect(outcomes.summary).toContain('Succeeded: 1, Failed: 1');
  });
});
