import { vi, describe, it, expect } from 'vitest';
import { runObservationCycle } from '../src/observation/ObservationEngine';
import type { WorkspaceConfig } from '../contracts/services';

const mockConfig: WorkspaceConfig = {
  workspaceId: 'T0123ABC',
  watchedChannels: ['C12345'],
  escalationChannel: 'C321',
  thresholds: { stalePrHours: 24, unansweredHours: 4, duplicateWindowHours: 4 },
  enabledPatterns: ['DUPLICATE_BUG'],
  connectedTools: ['linear'],
  aggressiveness: 'normal'
};

// Mock WebClient from @slack/web-api
vi.mock('@slack/web-api', () => {
  const mockHistory = vi.fn().mockResolvedValue({
    ok: true,
    messages: [
      {
        ts: '1712345678.000100',
        user: 'U12345',
        text: 'Checkout page failed with 500 error under high load'
      },
      {
        ts: '1712345688.000200',
        user: 'U67890',
        text: 'iOS app crashed on checkout screen with 500 status code'
      }
    ]
  });

  const mockPostMessage = vi.fn().mockResolvedValue({ ok: true });

  class MockWebClient {
    conversations = {
      history: mockHistory
    };
    chat = {
      postMessage: mockPostMessage
    };
  }
  return {
    WebClient: MockWebClient
  };
});

// Mock userClient for search / permalinks
vi.mock('../src/tools/clients/slack', () => {
  return {
    userClient: {
      search: {
        messages: async () => ({
          messages: {
            matches: []
          }
        })
      },
      chat: {
        getPermalink: async () => ({ permalink: 'https://slack.com/archive/C123/p123' })
      }
    }
  };
});

// Mock Redis client
vi.mock('../src/tools/clients/redis', () => {
  return {
    redis: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK')
    }
  };
});

// Mock nvidia completion engine
vi.mock('../src/tools/clients/nvidia', () => {
  return {
    chatCompletion: async (_messages: any[], systemPrompt: string) => {
      if (systemPrompt.includes('Reasoning Engine')) {
        return JSON.stringify({
          isValid: true,
          confidence: 0.95,
          severity: 'P1',
          title: 'Checkout 500 Internal Server Error under load',
          summary: 'Autonomously identified semantic duplicate reports of checkout 500 crashes.',
          businessRisk: 'iOS checkout is broken for concurrent users.'
        });
      }
      return JSON.stringify({
        title: 'Checkout 500 error on load',
        executiveSummary: 'Checkout fails under high concurrent load.',
        observedBehavior: 'Errors observed.',
        expectedBehavior: 'Errors should not occur.',
        businessImpact: 'Revenue loss.',
        technicalAnalysis: 'DB pool exhaustion.',
        priority: 'P1',
        labels: ['checkout', 'bug'],
        acceptanceCriteria: ['Verify success response.']
      });
    }
  };
});

// Mock ClientRegistry mcp clients list_issues tool
vi.mock('../src/orchestration/ClientRegistry', () => {
  const runMock = vi.fn().mockImplementation(async (step: any) => {
    if (step.tool === 'list_issues') {
      return {
        ok: true,
        tool: step.server,
        description: []
      };
    }
    return {
      ok: true,
      tool: step.server,
      description: `Successfully executed ${step.tool}`
    };
  });
  return {
    getMcpClient: () => ({
      run: runMock
    }),
    registry: {
      get: () => ({
        run: runMock
      }),
      register: vi.fn()
    }
  };
});

// Mock workspace config loaded from store
vi.mock('../src/config/WorkspaceConfigStore', () => {
  return {
    getWorkspaceConfig: async () => mockConfig
  };
});

describe('ObservationEngine', () => {
  it('should run observation cycle, ingest signals, correlate duplicates, run AI validation, and execute proactive workflow', async () => {
    const findings = await runObservationCycle('T0123ABC');
    expect(findings.length).toBe(1);
    
    const finding = findings[0];
    expect(finding.type).toBe('DUPLICATE_BUG');
    expect(finding.status).toBe('ACTIONED');
    expect(finding.confidence).toBe(0.95);
    expect(finding.severity).toBe('P1');
    expect(finding.title).toBe('Checkout 500 Internal Server Error under load');
    expect(finding.occurrences).toBe(2);
  });
});
