import type { SlackContext } from './events';
import type { IntentResult } from './planner';
import type { WorkspaceContext } from './context';

export interface SuggestionContext {
  messageContext: SlackContext;
  intent: IntentResult;
  workspaceContext: WorkspaceContext;
}
