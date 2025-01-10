import type { EventTypes, FacetedTypes, StationTypes } from '@gms/common-model';

import { BeamformingError } from './beamforming-error';
import { BeamformingWithStationError } from './beamforming-with-station-error';

export class BeamformingAzimuthError extends BeamformingWithStationError {
  public readonly event: EventTypes.Event | undefined;

  public readonly eventHypothesis: EventTypes.EventHypothesis | undefined;

  public readonly phase: string | undefined;

  public constructor(
    station:
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>,
    event: EventTypes.Event | undefined,
    eventHypothesis: EventTypes.EventHypothesis | undefined,
    phase: string | undefined
  ) {
    super(`Cannot create beam. No azimuth found.`, station, 'beamforming-invalid-azimuth');
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.event = event;
    this.eventHypothesis = eventHypothesis;
    this.phase = phase;
  }
}
