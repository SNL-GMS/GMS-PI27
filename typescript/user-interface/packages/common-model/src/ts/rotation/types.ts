import type { CommonTypes } from '../common-model';
import type { EntityReference } from '../faceted';
import type {
  Channel,
  ChannelGroup,
  OrientationAngles
} from '../station-definitions/channel-definitions/channel-definitions';
import type { Station } from '../station-definitions/station-definitions/station-definitions';
import type { RequireOnlyOne } from '../type-util/type-util';

export interface RotationDescription {
  phaseType: string;
  samplingType: string;
  twoDimensional: boolean;
}

export interface RotationParameters {
  location: CommonTypes.Location;
  locationToleranceKm: number;
  orientationAngles: OrientationAngles;
  orientationAngleToleranceDeg: number;
  receiverToSourceAzimuthDeg: number;
  sampleRateHz: number;
  sampleRateToleranceHz: number;
}

export interface RotationDefinition {
  rotationDescription: RotationDescription;
  rotationParameters: RotationParameters;
}

export type RotationTemplate = RequireOnlyOne<
  {
    duration: number;
    inputChannels?: EntityReference<'name', Channel>[];
    inputChannelGroup?: EntityReference<'name', ChannelGroup>;
    leadDuration: number;
    locationToleranceKm: number;
    orientationAngleToleranceDeg: number;
    rotationDescription: RotationDescription;
    sampleRateToleranceHz: number;
    station: EntityReference<'name', Station>;
  },
  'inputChannels' | 'inputChannelGroup'
>;

/**
 * Keyed on phase
 */
export type RotationTemplateByPhase = Record<string, RotationTemplate>;

export interface RotationTemplateByPhaseByStation {
  station: EntityReference<'name', Station>;
  rotationTemplatesByPhase: RotationTemplateByPhase;
}

/**
 * Keyed on station
 */
export type RotationTemplateByPhaseByStationRecord = Record<
  string,
  RotationTemplateByPhaseByStation
>;
