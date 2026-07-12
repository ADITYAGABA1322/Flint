import { describe, it, expect, vi } from 'vitest';
import { formatFriendlyTime } from '../src/utils/time';
import { renderLinear } from '../src/renderers/LinearRenderer';
import { renderNotion } from '../src/renderers/NotionRenderer';
import { renderAsana } from '../src/renderers/AsanaRenderer';
import type { EngineeringArtifact } from '../contracts/artifact';

// Mock Redis client for testing feedback loop
const mockRedisDb: Record<string, any> = {};
vi.mock('../src/tools/clients/redis', () => {
  return {
    redis: {
      get: async (key: string) => mockRedisDb[key] || null,
      set: async (key: string, value: any) => {
        mockRedisDb[key] = value;
        return 'OK';
      }
    }
  };
});

describe('Sprint 5 - Human Friendly Timestamps', () => {
  it('should format timestamps into relative strings correctly', () => {
    const now = new Date();
    
    // Just now
    expect(formatFriendlyTime(now)).toBe('Just now');
    
    // Minutes ago
    const fiveMinsAgo = new Date(now.getTime() - 1000 * 60 * 5);
    expect(formatFriendlyTime(fiveMinsAgo)).toBe('5 minutes ago');
    
    // Hours ago
    const threeHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 3);
    expect(formatFriendlyTime(threeHoursAgo)).toBe('3 hours ago');
  });
});

describe('Sprint 5 - Tool-Specific AI Artifact Renderers', () => {
  const mockArtifact: EngineeringArtifact = {
    title: 'Checkout Failure',
    executiveSummary: 'Global checkout is failing with 500 error.',
    observedBehavior: '500 error thrown at payments API endpoint.',
    expectedBehavior: '200 OK payments complete.',
    businessImpact: 'Users unable to pay.',
    technicalAnalysis: 'Database connection pools are exhausted.',
    priority: 'P0',
    labels: ['bug', 'payment'],
    evidence: {
      slackUrl: 'https://slack.com/archives/C123/p1234',
      reporter: 'U12345',
      channel: 'C12345',
      timestamp: '1712345678.000100'
    },
    acceptanceCriteria: ['Connection pool size increased to 50.'],
    relatedIssues: [],
    
    // Tailored sub-artifacts
    linear: {
      title: '[iOS] Payment Failure LIN',
      conciseSummary: 'Checkout returning 500 payments API failure.',
      severity: 'P0',
      reproduction: '1. Click Checkout\n2. View error.',
      impact: 'Critical payments failure.',
      acceptanceCriteria: ['Increase pool size to 50', 'Test under load']
    },
    notion: {
      title: 'Remediation and Root Cause: Checkout Gateway 500',
      background: 'This pool was originally configured in Sprint 1.',
      investigation: 'Verify connection metrics on the dev console.',
      observations: 'Spiked during checkout traffic hours.',
      technicalAnalysis: 'Pooled connections leaking in query runner.',
      implementationIdeas: 'Replace query runner close callback.',
      references: 'Slack history logs.',
      timeline: '2 hours mitigation.'
    },
    asana: {
      title: 'Fix the checkout database connection pool bug',
      checklist: ['Confirm leaks', 'Reconfigure connection pools'],
      ownerPlaceholders: 'Senior Backend Engineer',
      milestones: 'Remediation complete',
      dependencies: 'None',
      dueSuggestion: 'Within 2 hours'
    }
  };

  it('should render Linear descriptions using the linear sub-artifact fields', () => {
    const rendered = renderLinear(mockArtifact);
    expect(rendered.title).toBe('[iOS] Payment Failure LIN');
    expect(rendered.description).toContain('## Concise Summary');
    expect(rendered.description).toContain('Checkout returning 500 payments API failure.');
    expect(rendered.description).toContain('* **Severity:** P0');
    expect(rendered.description).toContain('1. Click Checkout\n2. View error.');
    expect(rendered.description).toContain('## Acceptance & Verification Criteria');
  });

  it('should render Notion pages using the notion sub-artifact blocks', () => {
    const rendered = renderNotion(mockArtifact);
    expect(rendered.title).toBe('Remediation and Root Cause: Checkout Gateway 500');
    
    // Verify background block
    const backgroundBlock = rendered.blocks.find(b => b.heading_2?.rich_text?.[0]?.text?.content === 'Background');
    expect(backgroundBlock).toBeDefined();

    const quoteBlock = rendered.blocks.find(b => b.type === 'quote');
    expect(quoteBlock.quote.rich_text[0].text.content).toBe('Pooled connections leaking in query runner.');
  });

  it('should render Asana notes and subtasks using the asana sub-artifact checklist', () => {
    const rendered = renderAsana(mockArtifact);
    expect(rendered.name).toBe('Fix the checkout database connection pool bug');
    expect(rendered.notes).toContain('Suggested Owner: Senior Backend Engineer');
    expect(rendered.notes).toContain('Timeline Recommendation: Within 2 hours');
    expect(rendered.subtasks).toEqual(['Confirm leaks', 'Reconfigure connection pools']);
  });
});

describe('Sprint 5 - Feedback Loop Persistence', () => {
  it('should store and read feedback events in Redis', async () => {
    const { redis } = await import('../src/tools/clients/redis');
    
    const feedbackEvent = {
      eventId: 'evt-12345',
      workspaceId: 'T0123ABC',
      findingId: 'finding-55555',
      userId: 'U99999',
      timestamp: new Date().toISOString(),
      action: 'HELPFUL',
      metadata: { reason: 'Clean analysis' }
    };

    const key = `flint:feedback:T0123ABC:finding-55555`;
    await redis.set(key, feedbackEvent);

    const stored = await redis.get(key);
    expect(stored).toEqual(feedbackEvent);
  });
});
