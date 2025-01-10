import type { ChannelTypes, FacetedTypes, StationTypes } from '@gms/common-model';

import { BeamformingError } from './beamforming-error';
import type { BeamformingErrorCodes } from './beamforming-error-codes';
import { BeamformingWithStationError } from './beamforming-with-station-error';

export class BeamformingWithStationChannelsError extends BeamformingWithStationError {
  public readonly channels: ChannelTypes.Channel[] | undefined;

  public constructor(
    message: string,
    station:
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>
      | undefined,
    channels: ChannelTypes.Channel[] | undefined = undefined,
    id: BeamformingErrorCodes = 'beamforming-error'
  ) {
    let theStation = station;
    if (!theStation) {
      theStation = channels && channels.length > 0 ? channels[0].station : undefined;
    }

    super(message, theStation, id);
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.channels = channels;
  }
}
