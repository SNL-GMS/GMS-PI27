import type { FacetedTypes, StationTypes } from '@gms/common-model';
import type { MaskAndBeamError } from '@gms/ui-wasm/lib/gms-interop/beam/mask-and-beam-error';

import { BeamformingError } from './beamforming-error';

export class BeamformingAlgorithmError extends BeamformingError {
  public readonly error: MaskAndBeamError;

  public readonly station:
    | StationTypes.Station
    | FacetedTypes.VersionReference<'name'>
    | FacetedTypes.EntityReference<'name', StationTypes.Station>;

  public constructor(
    error: MaskAndBeamError,
    station:
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>
  ) {
    super(`Cannot create beam. Algorithm error: ${error.message}`, 'beamforming-algorithm-error');
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.error = error;
    this.station = station;
  }
}
