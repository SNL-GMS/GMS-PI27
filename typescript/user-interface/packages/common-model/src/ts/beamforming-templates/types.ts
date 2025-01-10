import type { CommonTypes, EventTypes, SignalDetectionTypes } from '../common-model';
import type { EntityReference, VersionReference } from '../faceted';
import type { FilterDefinition } from '../filter';
import type {
  Channel,
  OrientationAngles
} from '../station-definitions/channel-definitions/channel-definitions';
import type { Station } from '../station-definitions/station-definitions/station-definitions';

export enum BeamType {
  CONTINUOUS_LOCATION = 'CONTINUOUS_LOCATION',
  DETECTION = 'DETECTION',
  EVENT = 'EVENT',
  FK = 'FK'
}

// TODO: beamSummationType enum instead of string
export interface BeamDescription {
  readonly beamSummation: string;
  readonly beamType: BeamType;
  readonly phase: string;
  readonly samplingType: string;
  readonly twoDimensional: boolean;
  readonly preFilterDefinition?: FilterDefinition;
}

export interface BeamformingTemplate {
  readonly beamDescription: BeamDescription;
  readonly inputChannels: VersionReference<'name'>[] | Channel[];
  readonly minWaveformsToBeam: number;
  readonly orientationAngleToleranceDeg: number;
  readonly sampleRateToleranceHz: number;
  readonly station: VersionReference<'name'> | Station;
  readonly beamDuration?: number;
  readonly leadDuration?: number;
}

export interface BeamParameters {
  eventHypothesis?: EntityReference<'id', EventTypes.EventHypothesis>;
  location?: CommonTypes.Location;
  minWaveformsToBeam: number;
  orientationAngles: OrientationAngles;
  orientationAngleToleranceDeg: number;
  receiverToSourceAzimuthDeg: number | undefined;
  sampleRateHz: number;
  sampleRateToleranceHz: number;
  signalDetectionHypothesis?: SignalDetectionTypes.SignalDetectionHypothesis;
  slownessSecPerDeg: number | undefined;
}

export interface BeamDefinition {
  beamDescription: BeamDescription;
  beamParameters: BeamParameters;
}

export type BeamformingTemplatesByPhase = Record<string, BeamformingTemplate>;

export type BeamformingTemplatesByStationByPhase = Record<string, BeamformingTemplatesByPhase>;

export type BeamformingTemplatesByBeamTypeByStationByPhase = Record<
  string,
  BeamformingTemplatesByStationByPhase
>;
