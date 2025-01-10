import { BeamformingTemplateTypes } from '../../../src/ts/common-model';
import type { VersionReference } from '../../../src/ts/faceted';
import { convertToVersionReference } from '../../../src/ts/faceted';
import { eventHypothesis } from '../event';
import { signalDetectionsData } from '../signal-detections';
import {
  asarAS01Channel,
  asarAS02Channel,
  asarAS03Channel,
  PD01Channel,
  PD02Channel,
  PD03Channel
} from '../station-definitions';

const pdarChannelVersionReferences: VersionReference<'name'>[] = [
  PD01Channel,
  PD02Channel,
  PD03Channel
].map(channel => convertToVersionReference(channel, 'name'));

const asarChannelVersionReferences: VersionReference<'name'>[] = [
  asarAS01Channel,
  asarAS02Channel,
  asarAS03Channel
].map(channel => convertToVersionReference(channel, 'name'));

export const eventBeamDescription: BeamformingTemplateTypes.BeamDescription = {
  beamSummation: 'COHERENT',
  beamType: BeamformingTemplateTypes.BeamType.EVENT,
  phase: 'P',
  samplingType: 'NEAREST_SAMPLE',
  twoDimensional: true,
  preFilterDefinition: undefined
};

export const fkBeamDescription: BeamformingTemplateTypes.BeamDescription = {
  beamSummation: 'COHERENT',
  beamType: BeamformingTemplateTypes.BeamType.FK,
  phase: 'P',
  samplingType: 'NEAREST_SAMPLE',
  twoDimensional: true,
  preFilterDefinition: undefined
};

export const eventBeamformingTemplate: BeamformingTemplateTypes.BeamformingTemplate = {
  beamDescription: eventBeamDescription,
  beamDuration: 300,
  inputChannels: pdarChannelVersionReferences,
  leadDuration: 5,
  minWaveformsToBeam: 2,
  orientationAngleToleranceDeg: 5,
  sampleRateToleranceHz: 0.5,
  station: { effectiveAt: 1689026400, name: 'PDAR' }
};

export const fkBeamformingTemplate: BeamformingTemplateTypes.BeamformingTemplate = {
  beamDescription: fkBeamDescription,
  beamDuration: 300,
  inputChannels: asarChannelVersionReferences,
  leadDuration: 5,
  minWaveformsToBeam: 2,
  orientationAngleToleranceDeg: 5,
  sampleRateToleranceHz: 0.5,
  station: { effectiveAt: 1689026400, name: 'ASAR' }
};

export const eventBeamformingTemplatesByPhase: BeamformingTemplateTypes.BeamformingTemplatesByPhase =
  {
    P: eventBeamformingTemplate
  };

export const fkBeamformingTemplatesByPhase: BeamformingTemplateTypes.BeamformingTemplatesByPhase = {
  P: fkBeamformingTemplate
};

export const eventBeamformingTemplatesByStationByPhase: BeamformingTemplateTypes.BeamformingTemplatesByStationByPhase =
  {
    PDAR: eventBeamformingTemplatesByPhase
  };

export const fkBeamformingTemplatesByStationByPhase: BeamformingTemplateTypes.BeamformingTemplatesByStationByPhase =
  {
    PDAR: fkBeamformingTemplatesByPhase
  };

export const beamformingTemplatesByBeamTypeByStationByPhase: BeamformingTemplateTypes.BeamformingTemplatesByBeamTypeByStationByPhase =
  {
    EVENT: eventBeamformingTemplatesByStationByPhase,
    FK: fkBeamformingTemplatesByStationByPhase
  };

/**
 * compatible with PDAR channels
 */
export const beamParameters: BeamformingTemplateTypes.BeamParameters = {
  eventHypothesis,
  location: {
    latitudeDegrees: 42.76738,
    longitudeDegrees: -109.5579,
    depthKm: 0,
    elevationKm: 2.215
  },
  minWaveformsToBeam: 3,
  orientationAngles: { verticalAngleDeg: 0, horizontalAngleDeg: -1 },
  orientationAngleToleranceDeg: 5,
  receiverToSourceAzimuthDeg: 10,
  sampleRateHz: 20,
  sampleRateToleranceHz: 5,
  signalDetectionHypothesis: signalDetectionsData[0].signalDetectionHypotheses[0],
  slownessSecPerDeg: 0
};
/**
 * Compatible with all PDAR channels
 */
export const eventBeamDefinition: BeamformingTemplateTypes.BeamDefinition = {
  beamDescription: eventBeamDescription,
  beamParameters
};

/**
 * compatible with ASAR channels
 */
export const ASARbeamParameters: BeamformingTemplateTypes.BeamParameters = {
  eventHypothesis,
  location: {
    latitudeDegrees: 42.76738,
    longitudeDegrees: -109.5579,
    depthKm: 0,
    elevationKm: 2.215
  },
  minWaveformsToBeam: 3,
  orientationAngles: { verticalAngleDeg: 0, horizontalAngleDeg: -1 },
  orientationAngleToleranceDeg: 5,
  receiverToSourceAzimuthDeg: 10,
  sampleRateHz: 20,
  sampleRateToleranceHz: 5,
  signalDetectionHypothesis: signalDetectionsData[0].signalDetectionHypotheses[0],
  slownessSecPerDeg: 0
};

/**
 * compatible with ASAR channels
 */
export const fkBeamDefinition: BeamformingTemplateTypes.BeamDefinition = {
  beamDescription: fkBeamDescription,
  beamParameters: ASARbeamParameters
};
