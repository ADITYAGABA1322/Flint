import type { IntentResult } from './planner';

export interface Signal {
  id: string; // Unique source-defined ID (e.g. message ts or webhook event ID)
  source: 'slack' | 'github' | 'jira' | 'sentry' | 'pagerduty';
  timestamp: string;
  content: string;
  author: string;
  context: Record<string, unknown>; // e.g. channelId, repoName, url
}

export interface Finding {
  id: string; // Stable hash of grouped signals to prevent duplicates
  type: string; // e.g. 'DUPLICATE_BUG', 'STALE_PR', 'UNANSWERED_Q'
  status: 'NEW' | 'CONFIRMED' | 'NOTIFIED' | 'ACTIONED' | 'RESOLVED' | 'IGNORED' | 'SNOOZED';
  title: string;
  summary: string;
  signals: Signal[];
  confidence: number;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  metadata: Record<string, unknown>;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  suggestedIntent?: IntentResult;
}
