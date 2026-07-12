import { redis } from '../tools/clients/redis';
import type { WorkspaceConfig } from '../../contracts/services';
import { logger } from '../utils/logger';

const MODULE = 'WorkspaceConfigStore';

export const DEFAULT_ARTIFACT_TEMPLATE = `## Executive Summary
{{SUMMARY}}

## Details
* **Observed Behavior:** {{OBSERVED_BEHAVIOR}}
* **Expected Behavior:** {{EXPECTED_BEHAVIOR}}
* **Business Impact:** {{BUSINESS_IMPACT}}

## Evidence
* **Slack Thread:** {{SLACK_URL}}
* **Reporter:** {{REPORTER}}
* **Channel:** {{CHANNEL}}
* **Timestamp:** {{TIMESTAMP}}

## AI Analysis
*Clearly marked as AI-generated:*
{{AI_ANALYSIS}}

## Metadata
* **Suggested Priority:** {{SUGGESTED_PRIORITY}}
* **Suggested Labels:** {{SUGGESTED_LABELS}}

## Acceptance Criteria
{{ACCEPTANCE_CRITERIA}}

## Related Conversations & Duplicates
{{RELATED_ISSUES}}`;

const DEFAULT_CONFIG: Omit<WorkspaceConfig, 'workspaceId'> = {
  watchedChannels: [],
  escalationChannel: '',
  thresholds: {
    stalePrHours: 24,
    unansweredHours: 4,
    duplicateWindowHours: 4,
    minConfidence: 0.80,
  },
  enabledPatterns: ['DUPLICATE_BUG', 'STALE_PR', 'UNANSWERED_Q', 'RELEASE_GAP'],
  connectedTools: ['linear', 'notion', 'asana'],
  aggressiveness: 'normal',
  artifactTemplate: DEFAULT_ARTIFACT_TEMPLATE,
};

export async function getWorkspaceConfig(workspaceId: string): Promise<WorkspaceConfig> {
  try {
    const key = `workspace:config:${workspaceId}`;
    const cached = await redis.get<Partial<WorkspaceConfig>>(key);
    if (cached) {
      logger.info(MODULE, `Loaded workspace config from Redis for ${workspaceId}`);
      return {
        ...DEFAULT_CONFIG,
        ...cached,
        workspaceId,
      } as WorkspaceConfig;
    }
  } catch (err) {
    logger.warn(MODULE, `Failed to load workspace config from Redis for ${workspaceId}, falling back to defaults`, err);
  }

  return {
    ...DEFAULT_CONFIG,
    workspaceId,
  } as WorkspaceConfig;
}
