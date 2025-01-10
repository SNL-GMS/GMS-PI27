import type { WorkflowTypes } from '@gms/common-model';

import { BeamformingError } from './beamforming-error';

export class BeamformingIntervalIdError extends BeamformingError {
  public readonly intervalId: WorkflowTypes.IntervalId | undefined;

  public constructor(intervalId: WorkflowTypes.IntervalId | undefined) {
    super(`Cannot create beam. Interval ID not found.`, 'beamforming-invalid-interval-id');
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.intervalId = intervalId;
  }
}
