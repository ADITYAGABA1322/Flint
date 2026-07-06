import { vi, describe, it, expect } from 'vitest';
import { Planner } from '../src/planner/Planner';
import type { IntentResult } from '../contracts/planner';
import type { WorkspaceConfig } from '../contracts/services';
import type { SlackContext } from '../contracts/events';

vi.mock('../src/context/ContextEngine', () => {
  return {
    gatherContext: async () => ({
      triggerMessage: 'Checkout page failed with 500 error',
      similarThreads: [],
      similarIssues: [],
      isDuplicate: false,
      isAlreadySuggested: false,
      triggerPermalink: 'https://slack.com/archives/C123/p123'
    })
  };
});

vi.mock('../src/tools/clients/nvidia', () => {
  return {
    chatCompletion: async () => JSON.stringify({
      title: 'Fix Checkout 500 Error',
      executiveSummary: 'Enriched Summary',
      observedBehavior: 'Observed 500 on checkout',
      expectedBehavior: 'Observed success response',
      businessImpact: 'High impact',
      technicalAnalysis: 'Caused by missing payload validations',
      priority: 'P1',
      labels: ['bug', 'checkout'],
      acceptanceCriteria: ['Ensure checkout resolves successfully']
    })
  };
});

describe('Planner', () => {
  const config: WorkspaceConfig = {
    workspaceId: 'test-workspace',
    watchedChannels: ['C123'],
    escalationChannel: 'C321',
    thresholds: { stalePrHours: 48, unansweredHours: 4, duplicateWindowHours: 2 },
    enabledPatterns: [],
    connectedTools: ['linear', 'notion', 'asana'],
    aggressiveness: 'normal'
  };

  it('should plan creation steps with fallback artifact when ctx is not provided', async () => {
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
    expect(plan.steps.length).toBe(3);
    expect(plan.steps[0].server).toBe('linear');
    expect(plan.steps[0].params.title).toBe('Fix critical crash');
    expect(plan.steps[0].params.priority).toBe('P1');
  });

  it('should enrich and natively render parameters when SlackContext is provided', async () => {
    const planner = new Planner();
    const intent: IntentResult = {
      intent: 'CREATE_TICKET',
      confidence: 0.95,
      entities: {
        title: 'Fix critical crash',
        description: 'Payment gateway throws 500 error',
        severity: 'P2',
        toolTargets: ['linear'],
      },
      reasoning: 'User asked to track bug',
    };

    const ctx: SlackContext = {
      workspaceId: 'test-workspace',
      channelId: 'C123',
      userId: 'U123',
      messageTs: '12345.678',
      text: 'Checkout page failed with 500 error',
      triggerType: 'mention'
    };

    const plan = await planner.plan(intent, config, ctx);
    expect(plan.steps.length).toBe(3);
    
    // 1. Linear check
    const linearStep = plan.steps.find(s => s.server === 'linear')!;
    expect(linearStep.params.title).toBe('Fix Checkout 500 Error');
    expect(linearStep.params.priority).toBe('P1');
    expect(linearStep.params.description as string).toContain('## Executive Summary\nEnriched Summary');
    expect(linearStep.params.description as string).toContain('Ensure checkout resolves successfully');

    // 2. Notion check
    const notionStep = plan.steps.find(s => s.server === 'notion')!;
    expect(notionStep.params.title).toBe('Fix Checkout 500 Error');
    expect(Array.isArray(notionStep.params.blocks)).toBe(true);
    const summaryHeader = (notionStep.params.blocks as any[]).find(b => b.type === 'heading_2' && b.heading_2.rich_text[0].text.content === 'Executive Summary');
    expect(summaryHeader).toBeDefined();

    // 3. Asana check
    const asanaStep = plan.steps.find(s => s.server === 'asana')!;
    expect(asanaStep.params.name).toBe('Fix Checkout 500 Error');
    expect(asanaStep.params.notes as string).toContain('EXECUTIVE SUMMARY:\nEnriched Summary');
    expect(Array.isArray(asanaStep.params.subtasks)).toBe(true);
    expect((asanaStep.params.subtasks as string[])[0]).toBe('Ensure checkout resolves successfully');
  });
});
