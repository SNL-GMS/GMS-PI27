import type { RotationTypes } from '../../../src/ts/common-model';
import type { EntityReference } from '../../../src/ts/faceted';
import { convertToEntityReference } from '../../../src/ts/faceted';
import { akasgBHEChannel, akasgBHNChannel, akasgVersionReference } from '../station-definitions';

const channelVersionReferences: EntityReference<'name'>[] = [akasgBHEChannel, akasgBHNChannel].map(
  channel => convertToEntityReference(channel, 'name')
);

export const rotationDescription: RotationTypes.RotationDescription = {
  phaseType: 'S',
  samplingType: 'NEAREST_SAMPLE',
  twoDimensional: true
};

export const rotationTemplate: RotationTypes.RotationTemplate = {
  rotationDescription,
  duration: 300,
  inputChannels: channelVersionReferences,
  leadDuration: 5,
  locationToleranceKm: 0.1,
  orientationAngleToleranceDeg: 5,
  sampleRateToleranceHz: 0.5,
  station: { name: akasgVersionReference.name }
};

export const rotationTemplatesByPhase: RotationTypes.RotationTemplateByPhase = {
  S: rotationTemplate
};

export const rotationTemplatesByStationByPhase: RotationTypes.RotationTemplateByPhaseByStation = {
  station: { name: akasgVersionReference.name },
  rotationTemplatesByPhase
};

export const rotationTemplateByPhaseByStationRecord: RotationTypes.RotationTemplateByPhaseByStationRecord =
  {
    [akasgVersionReference.name]: rotationTemplatesByStationByPhase
  };
