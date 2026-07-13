import { describe, it, expect } from 'vitest';
import { UnansweredQDetector } from '../src/detectors/UnansweredQDetector';
import type { SignalGroup } from '../src/observation/CorrelationEngine';
import type { WorkspaceConfig } from '../contracts/services';

describe('UnansweredQDetector', () => {
  const detector = new UnansweredQDetector();
  const config: WorkspaceConfig = {
    workspaceId: 'T0123ABC',
    watchedChannels: ['C12345'],
    escalationChannel: 'C321',
    thresholds: { stalePrHours: 24, unansweredHours: 4, duplicateWindowHours: 4 },
    enabledPatterns: ['UNANSWERED_Q'],
    connectedTools: ['linear'],
    aggressiveness: 'normal'
  };

  it('should ignore signals that do not represent long questions', async () => {
    const group: SignalGroup = {
      id: 'group-1',
      type: 'single',
      signals: [
        {
          id: 'sig-1',
          source: 'slack',
          timestamp: String(Math.floor(Date.now() / 1000)),
          content: 'Hello world',
          author: 'U123',
          context: { channelId: 'C12345' }
        }
      ]
    };

    const findings = await detector.detect(group, config);
    expect(findings.length).toBe(0);
  });

  it('should ignore questions with replies (multiple signals in thread)', async () => {
    const staleTime = Math.floor(Date.now() / 1000) - (5 * 3600); // 5 hours ago
    const group: SignalGroup = {
      id: 'group-2',
      type: 'thread',
      signals: [
        {
          id: 'sig-2',
          source: 'slack',
          timestamp: String(staleTime),
          content: 'Where is the connections client configured in this database?',
          author: 'U456',
          context: { channelId: 'C12345' }
        },
        {
          id: 'sig-2-reply',
          source: 'slack',
          timestamp: String(staleTime + 60),
          content: 'It is in client/redis.ts',
          author: 'U111',
          context: { channelId: 'C12345', threadTs: String(staleTime) }
        }
      ]
    };

    const findings = await detector.detect(group, config);
    expect(findings.length).toBe(0);
  });

  it('should detect unanswered questions based on duration threshold', async () => {
    const staleTime = Math.floor(Date.now() / 1000) - (5 * 3600); // 5 hours ago
    const group: SignalGroup = {
      id: 'group-3',
      type: 'single',
      signals: [
        {
          id: 'sig-3',
          source: 'slack',
          timestamp: String(staleTime),
          content: 'Is anyone familiar with the database pool config? I have a question about connections pool size.',
          author: 'U789',
          context: { channelId: 'C12345' }
        }
      ]
    };

    const findings = await detector.detect(group, config);
    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('UNANSWERED_Q');
  });
});
