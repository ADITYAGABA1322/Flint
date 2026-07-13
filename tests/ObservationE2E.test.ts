import { vi, describe, it, expect, beforeEach } from 'vitest';
import { runObservationCycle } from '../src/observation/ObservationEngine';
import { redis } from '../src/tools/clients/redis';
import { getFinding } from '../src/store/FindingStore';
import type { WorkspaceConfig } from '../contracts/services';

// Import collectors and detectors to ensure registry is populated
import '../src/collectors/SlackCollector';
import '../src/detectors/DuplicateBugDetector';
import '../src/detectors/StalePRDetector';
import '../src/detectors/UnansweredQDetector';

const mockConfig: WorkspaceConfig = {
  workspaceId: 'T0123ABC',
  watchedChannels: ['C12345'],
  escalationChannel: 'C321',
  thresholds: { stalePrHours: 24, unansweredHours: 4, duplicateWindowHours: 4, minConfidence: 0.80 },
  enabledPatterns: ['DUPLICATE_BUG', 'STALE_PR', 'UNANSWERED_Q'],
  connectedTools: ['linear'],
  aggressiveness: 'normal'
};

// Global mutable mock messages array for the Slack Conversations API mock
let mockHistoryMessages: any[] = [];

// Mock WebClient from @slack/web-api
vi.mock('@slack/web-api', () => {
  const mockHistory = vi.fn().mockImplementation(() => {
    return Promise.resolve({
      ok: true,
      messages: mockHistoryMessages
    });
  });

  const mockReplies = vi.fn().mockImplementation((args: any) => {
    const parentMsg = mockHistoryMessages.find(m => m.ts === args.ts);
    const replies = parentMsg?.mockReplies || [parentMsg];
    return Promise.resolve({
      ok: true,
      messages: replies
    });
  });

  const mockPostMessage = vi.fn().mockResolvedValue({ ok: true });

  class MockWebClient {
    conversations = {
      history: mockHistory,
      replies: mockReplies
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

// Mock Nvidia chat completion
vi.mock('../src/tools/clients/nvidia', () => {
  return {
    chatCompletion: async (_messages: any[], systemPrompt: string) => {
      if (systemPrompt.includes('Reasoning Engine')) {
        return JSON.stringify({
          isValid: true,
          confidence: 0.95,
          severity: 'P1',
          title: 'E2E Verified Issue',
          summary: 'Autonomously identified workflow friction.',
          businessRisk: 'High'
        });
      }
      return JSON.stringify({
        title: 'E2E Title',
        executiveSummary: 'E2E Summary',
        observedBehavior: 'E2E Behavior',
        expectedBehavior: 'E2E Expected',
        businessImpact: 'E2E Impact',
        technicalAnalysis: 'E2E Analysis',
        priority: 'P1',
        labels: ['e2e'],
        acceptanceCriteria: ['Pass']
      });
    }
  };
});

// Mock LinearClient to prevent real network calls
vi.mock('../src/tools/mcp/LinearClient', () => {
  return {
    run: async () => ({
      ok: true,
      description: JSON.stringify({
        issues: []
      })
    })
  };
});

// Mock ClientRegistry mcp clients list_issues tool
vi.mock('../src/orchestration/ClientRegistry', () => {
  const runMock = vi.fn().mockImplementation(async (step: any) => {
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

// Mock WorkspaceConfigStore load
vi.mock('../src/config/WorkspaceConfigStore', () => {
  return {
    getWorkspaceConfig: async () => mockConfig
  };
});

// Memory-backed Redis mock to test locks, cursors and deduplication
const redisMemoryStore = new Map<string, any>();

vi.mock('../src/tools/clients/redis', () => {
  return {
    redis: {
      get: vi.fn().mockImplementation(async (key: string) => {
        return redisMemoryStore.get(key) ?? null;
      }),
      set: vi.fn().mockImplementation(async (key: string, value: any, options?: any) => {
        if (options?.nx) {
          if (redisMemoryStore.has(key)) {
            return null; // Set NX fails (returns null) if lock exists
          }
        }
        redisMemoryStore.set(key, value);
        return 'OK';
      }),
      del: vi.fn().mockImplementation(async (key: string) => {
        const existed = redisMemoryStore.has(key);
        redisMemoryStore.delete(key);
        return existed ? 1 : 0;
      })
    }
  };
});

describe('Continuous Workspace Observation E2E Scenarios', () => {
  beforeEach(() => {
    redisMemoryStore.clear();
    mockHistoryMessages = [];
  });

  it('Scenario 1: should detect duplicate checkout crash reports, plan ticket, and update FindingStore to ACTIONED', async () => {
    mockHistoryMessages = [
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
    ];

    const findings = await runObservationCycle('T0123ABC');
    expect(findings.length).toBe(1);

    const finding = findings[0];
    expect(finding.type).toBe('DUPLICATE_BUG');
    expect(finding.status).toBe('ACTIONED');

    // Retrieve from store to ensure status was updated in Redis
    const saved = await getFinding(finding.id);
    expect(saved).not.toBeNull();
    expect(saved?.status).toBe('ACTIONED');
  });

  it('Scenario 2: should detect a stale PR using blocking keywords and create a finding', async () => {
    mockHistoryMessages = [
      {
        ts: String(Math.floor(Date.now() / 1000) - 600),
        user: 'U12345',
        text: 'https://github.com/org/repo/pull/123 is stale and blocking progress'
      }
    ];

    const findings = await runObservationCycle('T0123ABC');
    expect(findings.length).toBe(1);

    const finding = findings[0];
    expect(finding.type).toBe('STALE_PR');
    expect(finding.status).toBe('ACTIONED');
  });

  it('Scenario 3: should flag threadless unanswered question using urgent keywords', async () => {
    mockHistoryMessages = [
      {
        ts: String(Math.floor(Date.now() / 1000) - 300),
        user: 'U12345',
        text: 'Does anyone have the production database credentials? This is urgent.'
      }
    ];

    const findings = await runObservationCycle('T0123ABC');
    expect(findings.length).toBe(1);

    const finding = findings[0];
    expect(finding.type).toBe('UNANSWERED_Q');
    expect(finding.status).toBe('ACTIONED');
  });

  it('Scenario 4: should prevent concurrent tick runs using Redis distributed lock', async () => {
    mockHistoryMessages = [
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
    ];

    // Manually acquire lock before running cycle
    await redis.set('lock:cron:tick:T0123ABC', 'locked');

    // Running cycle should fail to acquire lock and skip immediately
    const findings = await runObservationCycle('T0123ABC');
    expect(findings.length).toBe(0);
  });

  it('Scenario 5: should deduplicate and skip already actioned findings on subsequent ticks', async () => {
    mockHistoryMessages = [
      {
        ts: '1712399999.000100',
        user: 'U12345',
        text: 'Checkout page failed with 500 error under high load'
      },
      {
        ts: '1712399999.000200',
        user: 'U67890',
        text: 'iOS app crashed on checkout screen with 500 status code'
      }
    ];

    // First cycle triggers finding
    const findings1 = await runObservationCycle('T0123ABC');
    expect(findings1.length).toBe(1);

    // Second cycle should skip since finding status is ACTIONED
    const findings2 = await runObservationCycle('T0123ABC');
    expect(findings2.length).toBe(0);
  });
});
