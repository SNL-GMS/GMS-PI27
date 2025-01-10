import type { BeamformingTemplateTypes, FacetedTypes, StationTypes } from '@gms/common-model';

import { BeamformingError } from './beamforming-error';
import { BeamformingWithStationError } from './beamforming-with-station-error';

export class BeamformingTemplateError extends BeamformingWithStationError {
  public readonly template: BeamformingTemplateTypes.BeamformingTemplate | undefined;

  public constructor(
    station:
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>,
    template: BeamformingTemplateTypes.BeamformingTemplate | undefined
  ) {
    super(
      `Cannot create beam. Unable to load beamforming template.`,
      station,
      'beamforming-invalid-beamforming-template'
    );
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.template = template;
  }
}
