import { vi, describe, it, expect } from 'vitest';
import { gatherContext } from '../src/context/ContextEngine';
import type { SlackContext } from '../contracts/events';
import type { WorkspaceConfig } from '../contracts/services';

vi.mock('../src/tools/clients/slack', () => {
  return {
    userClient: {
      search: {
        messages: async () => ({
          messages: {
            matches: [
              {
                permalink: 'https://slack.com/archive/C123/p123',
                text: 'Payment crashed on checkout',
                username: 'harshit',
                ts: '12345.678',
                channel: { id: 'C123', name: 'prod-alerts' }
              }
            ]
          }
        })
      },
      chat: {
        getPermalink: async () => ({ permalink: 'https://slack.com/archive/C123/p123' })
      }
    }
  };
});

vi.mock('../src/tools/mcp/LinearClient', () => {
  return {
    run: async () => ({
      ok: true,
      description: JSON.stringify({
        issues: [
          { id: 'LIN-42', title: 'Gateway crash during checkout', status: 'In Progress' }
        ]
      })
    })
  };
});

vi.mock('../src/tools/clients/redis', () => {
  return {
    redis: {
      get: async () => null,
      set: async () => 'OK'
    }
  };
});

describe('ContextEngine', () => {
  const config: WorkspaceConfig = {
    workspaceId: 'test-workspace',
    watchedChannels: ['C123'],
    escalationChannel: 'C321',
    thresholds: { stalePrHours: 48, unansweredHours: 4, duplicateWindowHours: 2 },
    enabledPatterns: [],
    connectedTools: ['linear'],
    aggressiveness: 'normal',
  };

  it('should gather workspace search history and identify duplicates', async () => {
    const ctx: SlackContext = {
      workspaceId: 'test-workspace',
      channelId: 'C123',
      userId: 'U123',
      messageTs: '1234.567',
      text: 'Gateway crash during checkout',
      triggerType: 'observation'
    };

    const context = await gatherContext(ctx, config);

    expect(context.isAlreadySuggested).toBe(false);
    expect(context.similarThreads.length).toBe(1);
    expect(context.similarThreads[0].channel).toBe('prod-alerts');
    expect(context.similarIssues.length).toBe(1);
    expect(context.similarIssues[0].id).toBe('LIN-42');
    expect(context.isDuplicate).toBe(true);
    expect(context.duplicateTarget?.id).toBe('LIN-42');
  });
});
