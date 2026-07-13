import type { ExecuteActions, GatherStatus, WorkspaceConfig } from '../../contracts/services';
import type { SourceMessage } from '../../contracts/events';

export const executeActions: ExecuteActions = async (intent) => {
  const succeeded = intent.entities.toolTargets.map((tool) => ({
    tool,
    ok: true,
    description: `Created mock ticket for "${intent.entities.title ?? 'Untitled'}"`,
    url: 'https://linear.app/mock-issue-url',
  }));

  return {
    results: succeeded,
    succeeded,
    failed: [],
    summary: `Created ${succeeded.length} mock items successfully.`,
  };
};

export const gatherStatus: GatherStatus = async (query) => {
  return {
    query,
    items: [
      {
        source: 'linear',
        title: 'Fix payment gateway crash on checkout',
        status: 'In Progress',
        owner: '@aditya',
        url: 'https://linear.app/mock-1',
      },
      {
        source: 'notion',
        title: 'v2.4 Release Post-Mortem Plan',
        status: 'Draft',
        owner: '@aditya',
        url: 'https://notion.so/mock-2',
      },
    ],
    blockers: [
      {
        source: 'linear',
        title: 'Fix payment gateway crash on checkout',
        status: 'In Progress',
        owner: '@aditya',
        url: 'https://linear.app/mock-1',
      },
    ],
  };
};

export const searchContext = async (): Promise<SourceMessage[]> => {
  return [
    {
      channelId: 'C12345',
      messageTs: '1712345678.000100',
      userId: 'U12345',
      text: 'The payment gateway is crashing when users try to checkout on iOS 17.4.',
      permalink: 'https://slack.com/mock-permalink-1',
    },
  ];
};

export const getWorkspaceConfig = async (workspaceId: string): Promise<WorkspaceConfig> => {
  return {
    workspaceId,
    watchedChannels: ['C12345'],
    escalationChannel: 'C54321',
    thresholds: {
      stalePrHours: 48,
      unansweredHours: 4,
      duplicateWindowHours: 2,
    },
    enabledPatterns: ['DUPLICATE_BUG', 'STALE_PR', 'UNANSWERED_Q', 'RELEASE_GAP'],
    connectedTools: ['linear', 'notion'],
    aggressiveness: 'normal',
  };
};
