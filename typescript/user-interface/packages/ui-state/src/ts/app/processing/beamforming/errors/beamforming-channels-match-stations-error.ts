import type { ChannelTypes, FacetedTypes, StationTypes } from '@gms/common-model';

import { BeamformingError } from './beamforming-error';

export class BeamformingChannelsMatchStationsError extends BeamformingError {
  public readonly stations:
    | StationTypes.Station
    | FacetedTypes.VersionReference<'name'>
    | FacetedTypes.EntityReference<'name', StationTypes.Station>[];

  public readonly channels: ChannelTypes.Channel[];

  public constructor(
    channels: ChannelTypes.Channel[],
    stations:
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>[]
  ) {
    super(
      `Cannot create beam. Selected channels do not match selected station(s).`,
      'beamforming-invalid-channels-to-stations'
    );
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.channels = channels;
    this.stations = stations;
  }
}
