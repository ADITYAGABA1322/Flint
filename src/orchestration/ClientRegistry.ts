import type { ToolRunner } from '../../contracts/orchestration';
import { logger } from '../utils/logger';

const MODULE = 'ClientRegistry';

class ClientRegistry {
  private runners = new Map<string, ToolRunner>();

  register(serverName: string, runner: ToolRunner): void {
    logger.info(MODULE, `Registering tool runner for server: "${serverName}"`);
    this.runners.set(serverName.toLowerCase(), runner);
  }

  get(serverName: string): ToolRunner | undefined {
    return this.runners.get(serverName.toLowerCase());
  }

  has(serverName: string): boolean {
    return this.runners.has(serverName.toLowerCase());
  }

  clear(): void {
    this.runners.clear();
  }
}

export const registry = new ClientRegistry();
