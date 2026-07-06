import { redis } from '../tools/clients/redis';
import type { Finding } from '../../contracts/observation';
import { logger } from '../utils/logger';

const MODULE = 'FindingStore';
const MEMORY_STORE: Map<string, Finding> = new Map();

function getRedisKey(id: string): string {
  return `flint:finding:${id}`;
}

export async function getFinding(id: string): Promise<Finding | null> {
  try {
    const key = getRedisKey(id);
    const data = await redis.get<Finding>(key);
    if (data) {
      return data;
    }
  } catch (err) {
    logger.warn(MODULE, `Failed to get finding ${id} from Redis:`, err);
  }
  return MEMORY_STORE.get(id) || null;
}

export async function saveFinding(finding: Finding, ttlSeconds = 86400): Promise<void> {
  try {
    const key = getRedisKey(finding.id);
    await redis.set(key, finding, { ex: ttlSeconds });
    logger.info(MODULE, `Saved finding ${finding.id} (Status: ${finding.status}) to Redis`);
  } catch (err) {
    logger.warn(MODULE, `Failed to save finding ${finding.id} to Redis, using memory:`, err);
  }
  MEMORY_STORE.set(finding.id, finding);
}

export async function updateStatus(id: string, status: Finding['status']): Promise<void> {
  const finding = await getFinding(id);
  if (!finding) {
    logger.error(MODULE, `Cannot update status: finding ${id} not found`);
    return;
  }

  finding.status = status;
  finding.lastSeen = new Date().toISOString();
  await saveFinding(finding);
  logger.info(MODULE, `Updated status of finding ${id} to ${status}`);
}

export async function isFresh(id: string): Promise<boolean> {
  const finding = await getFinding(id);
  if (!finding) {
    return true;
  }
  // A finding is considered fresh if it's new, confirmed, or not yet completed/ignored.
  // It is NOT fresh if it has been NOTIFIED, ACTIONED, IGNORED, or SNOOZED recently.
  return !['NOTIFIED', 'ACTIONED', 'IGNORED', 'SNOOZED'].includes(finding.status);
}
