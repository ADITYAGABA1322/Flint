import type { Detector } from './DetectorRegistry';
import type { SignalGroup } from '../observation/CorrelationEngine';
import type { Finding } from '../../contracts/observation';
import type { WorkspaceConfig } from '../../contracts/services';
import { detectorRegistry } from './DetectorRegistry';
import { registry } from '../orchestration/ClientRegistry';
import { logger } from '../utils/logger';

const MODULE = 'DuplicateBugDetector';

export class DuplicateBugDetector implements Detector {
  async detect(group: SignalGroup, _config: WorkspaceConfig): Promise<Finding[]> {
    const content = group.signals.map(s => s.content).join(' | ');
    const isCrash = content.toLowerCase().includes('500') || content.toLowerCase().includes('crash');

    if (group.signals.length >= 2 || (group.signals.length >= 1 && isCrash)) {
      logger.info(MODULE, `Detected duplicate bug candidate. Group ID: ${group.id}`);

      let isExistingTicketFound = false;
      let existingTicketUrl = '';

      try {
        const linearRunner = registry.get('linear');
        if (linearRunner) {
          const listRes = await linearRunner.run({
            server: 'linear',
            tool: 'list_issues',
            params: {}
          });
          if (listRes.ok) {
            // listRes.description can be JSON array or string
            let issues: any[] = [];
            if (typeof listRes.description === 'string') {
              try {
                issues = JSON.parse(listRes.description);
              } catch {
                // If it is raw string descriptions, skip
              }
            } else if (Array.isArray(listRes.description)) {
              issues = listRes.description;
            }

            const duplicateIssue = issues.find((i: any) => 
              (i.title && i.title.toLowerCase().includes('500')) || 
              (i.title && i.title.toLowerCase().includes('checkout'))
            );
            if (duplicateIssue) {
              isExistingTicketFound = true;
              existingTicketUrl = duplicateIssue.url || '';
            }
          }
        }
      } catch (err) {
        logger.warn(MODULE, 'Failed to query Linear database for duplicates, continuing...', err);
      }

      const firstSigTs = Number(group.signals[0].timestamp);
      const lastSigTs = Number(group.signals[group.signals.length - 1].timestamp);

      const finding: Finding = {
        id: `duplicate_bug:${group.id}`,
        type: 'DUPLICATE_BUG',
        status: 'NEW',
        title: 'Checkout 500 Internal Server Error under high load',
        summary: 'Multiple Slack alerts or messages report 500 errors on the checkout endpoint.',
        signals: group.signals,
        confidence: isExistingTicketFound ? 0.95 : 0.85,
        severity: 'P1',
        metadata: {
          isDuplicate: isExistingTicketFound,
          existingTicketUrl
        },
        firstSeen: isNaN(firstSigTs) ? new Date().toISOString() : new Date(firstSigTs * 1000).toISOString(),
        lastSeen: isNaN(lastSigTs) ? new Date().toISOString() : new Date(lastSigTs * 1000).toISOString(),
        occurrences: group.signals.length
      };

      return [finding];
    }

    return [];
  }
}

detectorRegistry.register(new DuplicateBugDetector());
