import type { FacetedTypes, StationTypes } from '@gms/common-model';

import { BeamformingError } from './beamforming-error';
import type { BeamformingErrorCodes } from './beamforming-error-codes';

export class BeamformingWithStationError extends BeamformingError {
  public readonly station:
    | StationTypes.Station
    | FacetedTypes.VersionReference<'name'>
    | FacetedTypes.EntityReference<'name', StationTypes.Station>
    | undefined;

  public constructor(
    message: string,
    station:
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>
      | undefined,
    id: BeamformingErrorCodes = 'beamforming-error'
  ) {
    super(message, id);
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.station = station;
  }
}
