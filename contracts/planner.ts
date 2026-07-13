import type { SlackContext, PatternMatch } from './events';
import type { ToolName, Severity } from './shared';

export type IntentType =
  | 'QUERY'
  | 'CREATE_TICKET'
  | 'CAPTURE_DECISION'
  | 'ASSIGN_TASK'
  | 'STATUS_CHECK'
  | 'SNOOZE'
  | 'NONE';

export interface IntentEntities {
  title?: string;
  description?: string;
  severity?: Severity;
  toolTargets: ToolName[];
  assigneeHint?: string;
  releaseContext?: string;
  query?: string;
  dueDate?: string;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: IntentEntities;
  reasoning: string;
}

export type ClassifyIntent = (
  ctx: SlackContext,
  pattern?: PatternMatch
) => Promise<IntentResult>;
