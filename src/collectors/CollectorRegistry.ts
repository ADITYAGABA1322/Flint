import type { WorkspaceConfig } from '../../contracts/services';
import type { Signal } from '../../contracts/observation';

export interface Collector {
  collect(config: WorkspaceConfig): Promise<Signal[]>;
}

export class CollectorRegistry {
  private collectors: Map<string, Collector> = new Map();

  register(name: string, collector: Collector): void {
    this.collectors.set(name, collector);
  }

  get(name: string): Collector | undefined {
    return this.collectors.get(name);
  }

  getAll(): Map<string, Collector> {
    return this.collectors;
  }
}

export const collectorRegistry = new CollectorRegistry();
