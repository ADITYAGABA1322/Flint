import type { ToolCall, ActionResult } from './services';

export interface ToolRunner {
  run(call: ToolCall): Promise<ActionResult>;
}

export interface WorkflowStep {
  server: string;
  tool: string;
  params: Record<string, unknown>;
}

export interface WorkflowPlan {
  steps: WorkflowStep[];
}
