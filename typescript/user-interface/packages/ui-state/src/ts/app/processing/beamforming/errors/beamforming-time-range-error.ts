import type { CommonTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';

import { BeamformingError } from './beamforming-error';

export class BeamformingTimeRangeError extends BeamformingError {
  public readonly timeRange: Nullable<CommonTypes.TimeRange>;

  public constructor(timeRange: Nullable<CommonTypes.TimeRange>) {
    super(`Cannot create beam. Current interval not found.`, 'beamforming-invalid-time-range');
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.timeRange = timeRange;
  }
}
