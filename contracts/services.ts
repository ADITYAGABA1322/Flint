import type { ToolName, PatternType } from './shared';
import type { IntentResult } from './planner';

export interface ToolCall {
  server: ToolName;
  tool: string;
  params: Record<string, unknown>;
}

export interface ActionResult {
  tool: ToolName;
  ok: boolean;
  description: string;
  url?: string;
  error?: string;
}

export interface ActionResults {
  results: ActionResult[];
  succeeded: ActionResult[];
  failed: ActionResult[];
  summary: string;
}

export interface StatusItem {
  source: ToolName | 'slack';
  title: string;
  status: string;
  owner?: string;
  url?: string;
}

export interface StatusData {
  query: string;
  items: StatusItem[];
  blockers: StatusItem[];
}

export interface WorkspaceConfig {
  workspaceId: string;
  watchedChannels: string[];
  escalationChannel?: string;
  thresholds: {
    stalePrHours: number;
    unansweredHours: number;
    duplicateWindowHours: number;
  };
  enabledPatterns: PatternType[];
  connectedTools: ToolName[];
  aggressiveness: 'subtle' | 'normal' | 'proactive';
  artifactTemplate?: string;
}

export type ExecuteActions = (
  intent: IntentResult,
  config: WorkspaceConfig
) => Promise<ActionResults>;

export type GatherStatus = (
  query: string,
  config: WorkspaceConfig
) => Promise<StatusData>;
