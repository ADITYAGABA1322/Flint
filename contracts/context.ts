export interface HistoricalThread {
  permalink: string;
  text: string;
  user: string;
  timestamp: string;
  channel: string;
}

export interface ToolIssueMatch {
  id: string;
  title: string;
  status: string;
  url: string;
  similarity: number;
}

export interface WorkspaceContext {
  triggerMessage: string;
  similarThreads: HistoricalThread[];
  similarIssues: ToolIssueMatch[];
  isDuplicate: boolean;
  duplicateTarget?: ToolIssueMatch;
  isAlreadySuggested: boolean;
}
