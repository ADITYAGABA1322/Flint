import { describe, it, expect } from 'vitest';
import { StalePRDetector } from '../src/detectors/StalePRDetector';
import type { SignalGroup } from '../src/observation/CorrelationEngine';
import type { WorkspaceConfig } from '../contracts/services';

describe('StalePRDetector', () => {
  const detector = new StalePRDetector();
  const config: WorkspaceConfig = {
    workspaceId: 'T0123ABC',
    watchedChannels: ['C12345'],
    escalationChannel: 'C321',
    thresholds: { stalePrHours: 24, unansweredHours: 4, duplicateWindowHours: 4 },
    enabledPatterns: ['STALE_PR'],
    connectedTools: ['linear'],
    aggressiveness: 'normal'
  };

  it('should ignore signals without pull request links', async () => {
    const group: SignalGroup = {
      id: 'group-1',
      type: 'single',
      signals: [
        {
          id: 'sig-1',
          source: 'slack',
          timestamp: String(Math.floor(Date.now() / 1000)),
          content: 'Hello, can someone review my changes?',
          author: 'U123',
          context: { channelId: 'C12345' }
        }
      ]
    };

    const findings = await detector.detect(group, config);
    expect(findings.length).toBe(0);
  });

  it('should detect stale pull request signals based on duration threshold', async () => {
    const staleTime = Math.floor(Date.now() / 1000) - (25 * 3600); // 25 hours ago
    const group: SignalGroup = {
      id: 'group-2',
      type: 'single',
      signals: [
        {
          id: 'sig-2',
          source: 'slack',
          timestamp: String(staleTime),
          content: 'Hey team, here is the PR review link: https://github.com/org/repo/pull/42',
          author: 'U456',
          context: { channelId: 'C12345' }
        }
      ]
    };

    const findings = await detector.detect(group, config);
    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('STALE_PR');
    expect(findings[0].metadata.prUrl).toBe('https://github.com/org/repo/pull/42');
  });

  it('should force detect stale pull requests if the content contains blocking keywords', async () => {
    const recentTime = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const group: SignalGroup = {
      id: 'group-3',
      type: 'single',
      signals: [
        {
          id: 'sig-3',
          source: 'slack',
          timestamp: String(recentTime),
          content: 'This PR is blocking the release branch: https://github.com/org/repo/pull/42',
          author: 'U789',
          context: { channelId: 'C12345' }
        }
      ]
    };

    const findings = await detector.detect(group, config);
    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('STALE_PR');
  });
});
