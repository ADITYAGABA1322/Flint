import type { PatternType } from './shared';

export interface SlackContext {
  workspaceId: string;
  channelId: string;
  userId: string;
  messageTs: string;
  threadTs?: string;
  text: string;
  triggerType: 'mention' | 'slash' | 'action' | 'observation';
  command?: string;
  actionId?: string;
  rawEvent: unknown;
}

export interface SourceMessage {
  channelId: string;
  messageTs: string;
  userId: string;
  text: string;
  permalink?: string;
}

export interface PatternMatch {
  id: string;
  type: PatternType;
  workspaceId: string;
  targetChannelId: string;
  summary: string;
  sourceMessages: SourceMessage[];
  suggestedIntent?: any; // Will be typed as IntentResult in planner.ts
  detectedAt: string;
}
