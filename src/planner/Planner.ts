import type { IntentResult } from '../../contracts/planner';
import type { WorkspaceConfig, ToolCall } from '../../contracts/services';
import { env } from '../config/env';

export interface ExecutionPlan {
  intent: IntentResult;
  calls: ToolCall[];
  requiresConfirmation: boolean;
  risks: string[];
}

export class Planner {
  async plan(intent: IntentResult, config: WorkspaceConfig): Promise<ExecutionPlan> {
    const calls: ToolCall[] = [];
    const risks: string[] = [];
    const requiresConfirmation = false;

    const targets = intent.entities.toolTargets;

    if (intent.intent === 'CREATE_TICKET' && targets.includes('linear')) {
      const team = env.LINEAR_DEFAULT_TEAM || '';
      calls.push({
        server: 'linear',
        tool: 'create_issue',
        params: {
          title: intent.entities.title || 'Slack captured ticket',
          description: intent.entities.description || '',
          priority: intent.entities.severity || 'P2',
          ...(team ? { team } : {})
        }
      });
    }

    return {
      intent,
      calls,
      requiresConfirmation,
      risks
    };
  }
}
