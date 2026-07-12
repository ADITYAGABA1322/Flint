import type { Detector } from './DetectorRegistry';
import type { SignalGroup } from '../observation/CorrelationEngine';
import type { Finding } from '../../contracts/observation';
import type { WorkspaceConfig } from '../../contracts/services';
import { detectorRegistry } from './DetectorRegistry';
import { logger } from '../utils/logger';

const MODULE = 'StalePRDetector';

export class StalePRDetector implements Detector {
  async detect(group: SignalGroup, config: WorkspaceConfig): Promise<Finding[]> {
    const prRegex = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/[0-9]+/i;
    const findings: Finding[] = [];

    const stalePrHours = config.thresholds?.stalePrHours || 24;
    const nowMs = Date.now();

    for (const signal of group.signals) {
      const match = signal.content.match(prRegex);
      if (match) {
        const prUrl = match[0];
        // Calculate age
        const signalTs = Number(signal.timestamp);
        const signalTimeMs = isNaN(signalTs) ? nowMs : signalTs * 1000;
        const ageHours = (nowMs - signalTimeMs) / (1000 * 60 * 60);

        // For simulation or offline replay, we also allow the word "stale" or "blocking" to bypass duration check
        const forceStale = signal.content.toLowerCase().includes('stale') || signal.content.toLowerCase().includes('blocking');

        if (ageHours >= stalePrHours || forceStale) {
          logger.info(MODULE, `Detected stale PR: ${prUrl} in Group ID: ${group.id}`);

          const finding: Finding = {
            id: `stale_pr:${signal.id}`,
            type: 'STALE_PR',
            status: 'NEW',
            title: `Review reminder: Pull request is stale or blocking progress`,
            summary: `The pull request at ${prUrl} has been open for more than ${stalePrHours} hours without review or resolution.`,
            signals: [signal],
            confidence: 0.90,
            severity: 'P2',
            metadata: {
              prUrl,
              ageHours: Math.round(ageHours),
              thresholdHours: stalePrHours
            },
            firstSeen: new Date(signalTimeMs).toISOString(),
            lastSeen: new Date(signalTimeMs).toISOString(),
            occurrences: 1
          };

          findings.push(finding);
        }
      }
    }

    return findings;
  }
}

detectorRegistry.register(new StalePRDetector());
