import type { Detector } from './DetectorRegistry';
import type { SignalGroup } from '../observation/CorrelationEngine';
import type { Finding } from '../../contracts/observation';
import type { WorkspaceConfig } from '../../contracts/services';
import { detectorRegistry } from './DetectorRegistry';
import { logger } from '../utils/logger';

const MODULE = 'UnansweredQDetector';

export class UnansweredQDetector implements Detector {
  async detect(group: SignalGroup, config: WorkspaceConfig): Promise<Finding[]> {
    const unansweredHours = config.thresholds?.unansweredHours || 4;
    const nowMs = Date.now();
    const findings: Finding[] = [];

    // Find the first (oldest) signal in the group, which would be the question starter
    const signals = [...group.signals].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    if (signals.length === 0) return [];

    const parentSignal = signals[0];
    const isQuestion = parentSignal.content.includes('?') && parentSignal.content.length > 15;

    if (!isQuestion) return [];

    // Count replies in the thread group (messages other than parent)
    const repliesCount = signals.length - 1;

    // Calculate age of the unanswered question
    const signalTs = Number(parentSignal.timestamp);
    const signalTimeMs = isNaN(signalTs) ? nowMs : signalTs * 1000;
    const ageHours = (nowMs - signalTimeMs) / (1000 * 60 * 60);

    const forceAlert = parentSignal.content.toLowerCase().includes('blocking') || parentSignal.content.toLowerCase().includes('urgent');

    if (repliesCount === 0 && (ageHours >= unansweredHours || forceAlert)) {
      logger.info(MODULE, `Detected unanswered question in Group ID: ${group.id}`);

      const finding: Finding = {
        id: `unanswered_q:${parentSignal.id}`,
        type: 'UNANSWERED_Q',
        status: 'NEW',
        title: `Unanswered question blockage in Slack`,
        summary: `A question from @${parentSignal.author} has remained unanswered for over ${unansweredHours} hours in channel <#${parentSignal.context.channelId || ''}>.`,
        signals: [parentSignal],
        confidence: 0.85,
        severity: 'P3',
        metadata: {
          author: parentSignal.author,
          ageHours: Math.round(ageHours),
          thresholdHours: unansweredHours
        },
        firstSeen: new Date(signalTimeMs).toISOString(),
        lastSeen: new Date(signalTimeMs).toISOString(),
        occurrences: 1
      };

      findings.push(finding);
    }

    return findings;
  }
}

detectorRegistry.register(new UnansweredQDetector());
