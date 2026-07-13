import type { SignalGroup } from '../observation/CorrelationEngine';
import type { Finding } from '../../contracts/observation';
import type { WorkspaceConfig } from '../../contracts/services';

export interface Detector {
  detect(group: SignalGroup, config: WorkspaceConfig): Promise<Finding[]>;
}

export class DetectorRegistry {
  private detectors: Detector[] = [];

  register(detector: Detector): void {
    this.detectors.push(detector);
  }

  getAll(): Detector[] {
    return this.detectors;
  }
}

export const detectorRegistry = new DetectorRegistry();
