import { describe, it, expect } from 'vitest';
import { Planner } from '../src/planner/Planner';
import type { IntentResult } from '../contracts/planner';
import type { WorkspaceConfig } from '../contracts/services';

describe('Planner', () => {
  const config: WorkspaceConfig = {
    workspaceId: 'test-workspace',
    watchedChannels: ['C123'],
    escalationChannel: 'C321',
    thresholds: { stalePrHours: 48, unansweredHours: 4, duplicateWindowHours: 2 },
    enabledPatterns: [],
    connectedTools: ['linear'],
    aggressiveness: 'normal',
  };

  it('should plan linear issue creation for CREATE_TICKET intent', async () => {
    const planner = new Planner();
    const intent: IntentResult = {
      intent: 'CREATE_TICKET',
      confidence: 0.95,
      entities: {
        title: 'Fix critical crash',
        description: 'Payment gateway throws 500 error',
        severity: 'P1',
        toolTargets: ['linear'],
      },
      reasoning: 'User asked to track bug',
    };

    const plan = await planner.plan(intent, config);
    expect(plan.calls.length).toBe(1);
    expect(plan.calls[0].server).toBe('linear');
    expect(plan.calls[0].tool).toBe('create_issue');
    expect(plan.calls[0].params.title).toBe('Fix critical crash');
    expect(plan.calls[0].params.description).toBe('Payment gateway throws 500 error');
    expect(plan.calls[0].params.priority).toBe('P1');
  });

  it('should plan nothing for NONE intent', async () => {
    const planner = new Planner();
    const intent: IntentResult = {
      intent: 'NONE',
      confidence: 0.98,
      entities: {
        toolTargets: [],
      },
      reasoning: 'User said hello',
    };

    const plan = await planner.plan(intent, config);
    expect(plan.calls.length).toBe(0);
  });
});
