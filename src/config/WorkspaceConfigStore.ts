import { redis } from '../tools/clients/redis';
import type { WorkspaceConfig } from '../../contracts/services';
import { logger } from '../utils/logger';

const MODULE = 'WorkspaceConfigStore';

const DEFAULT_CONFIG: Omit<WorkspaceConfig, 'workspaceId'> = {
  watchedChannels: [],
  escalationChannel: '',
  thresholds: {
    stalePrHours: 48,
    unansweredHours: 4,
    duplicateWindowHours: 2,
  },
  enabledPatterns: ['DUPLICATE_BUG', 'STALE_PR', 'UNANSWERED_Q', 'RELEASE_GAP'],
  connectedTools: ['linear'],
  aggressiveness: 'normal',
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
