import { vi, describe, it, expect } from 'vitest';
import { Planner } from '../src/planner/Planner';
import type { SlackContext } from '../contracts/events';
import type { WorkspaceConfig } from '../contracts/services';

vi.mock('../src/intent/IntentEngine', () => {
  return {
    classifyIntent: async () => ({
      intent: 'CREATE_TICKET',
      confidence: 0.95,
      entities: {
        toolTargets: ['linear']
      },
      reasoning: 'Observation bug found'
    })
  };
});

vi.mock('../src/context/ContextEngine', () => {
  return {
    gatherContext: async () => ({
      triggerMessage: 'Checkout page failed with 500 error',
      similarThreads: [],
      similarIssues: [],
      isDuplicate: false,
      isAlreadySuggested: false
    })
  };
});

describe('Planner Observation Planning', () => {
  const config: WorkspaceConfig = {
    workspaceId: 'test-workspace',
    watchedChannels: ['C123'],
    escalationChannel: 'C321',
    thresholds: { stalePrHours: 48, unansweredHours: 4, duplicateWindowHours: 2 },
    enabledPatterns: [],
    connectedTools: ['linear'],
    aggressiveness: 'normal',
  };

  it('should generate suggestion blocks if intent matches and no duplicate alert is cached', async () => {
    const planner = new Planner();
    const ctx: SlackContext = {
      workspaceId: 'test-workspace',
      channelId: 'C123',
      userId: 'U123',
      messageTs: '1234.567',
      text: 'Checkout page failed with 500 error',
      triggerType: 'observation'
    };

    const plan = await planner.planObservation(ctx, config);

    expect(plan.shouldSuggest).toBe(true);
    expect(plan.blocks).toBeDefined();
    expect(plan.textSummary).toContain('Proactive Task Suggestion');
  });
});
