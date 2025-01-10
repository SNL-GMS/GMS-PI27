import type {
  BeamformingTemplateTypes,
  ChannelTypes,
  FacetedTypes,
  StationTypes
} from '@gms/common-model';

import { BeamformingError } from './beamforming-error';
import { BeamformingWithStationChannelsError } from './beamforming-with-station-channels-error';

export class BeamformingMinimumNumberOfChannelsError extends BeamformingWithStationChannelsError {
  public readonly template: BeamformingTemplateTypes.BeamformingTemplate;

  public constructor(
    station:
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>,
    channels: ChannelTypes.Channel[],
    template: BeamformingTemplateTypes.BeamformingTemplate
  ) {
    super(
      `Cannot create beam due to a configuration issue. Input channels within the beamforming template do not meet the minimum waveform criteria to beam.`,
      station,
      channels,
      'beamforming-minimum-number-of-channels'
    );
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.template = template;
  }
}
