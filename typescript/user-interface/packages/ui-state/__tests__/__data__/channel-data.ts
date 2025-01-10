/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ChannelTypes, CommonTypes } from '@gms/common-model';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import type { ToOSDTime } from '@gms/common-model/lib/time';
import { toEpochSeconds } from '@gms/common-util';

export const testChannel: ChannelTypes.Channel = {
  canonicalName: 'ARCES.ARA0.BHE',
  channelBandType: ChannelTypes.ChannelBandType.BROADBAND,
  channelDataType: ChannelTypes.ChannelDataType.SEISMIC,
  channelInstrumentType: ChannelTypes.ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationCode: 'E',
  channelOrientationType: ChannelTypes.ChannelOrientationType.EAST_WEST,
  configuredInputs: [],
  description: 'broad-band_east',
  effectiveUntil: toEpochSeconds('2022-08-17T01:59:59.984Z'),
  location: {
    depthKm: 0.0,
    elevationKm: 0.403,
    latitudeDegrees: 69.534859,
    longitudeDegrees: 25.505777
  },
  nominalSampleRateHz: 40.0,
  orientationAngles: {
    horizontalAngleDeg: 90.0,
    verticalAngleDeg: 90.0
  },
  processingDefinition: {},
  processingMetadata: { CHANNEL_GROUP: 'ARA0' },
  response: undefined,
  station: {
    effectiveAt: toEpochSeconds('2022-08-09T00:00:00Z'),
    name: 'ARCES'
  },
  units: CommonTypes.Units.NANOMETERS,
  effectiveAt: toEpochSeconds('2022-08-09T12:00:00Z'),
  name: 'ARCES.ARA0.BHE'
};

const configuredInputs: ToOSDTime<VersionReference<'name'>>[] = [
  { effectiveAt: '2022-08-09T12:00:00Z', name: 'ARCES.ARA0.BHE' }
];

const testStationVersionReference: ToOSDTime<VersionReference<'name'>> = {
  effectiveAt: '2022-08-09T00:00:00Z',
  name: 'ARCES'
};

export const testChannelCOI: ToOSDTime<ChannelTypes.Channel> = {
  canonicalName: 'ARCES.ARA0.BHE',
  channelBandType: ChannelTypes.ChannelBandType.BROADBAND,
  channelDataType: ChannelTypes.ChannelDataType.SEISMIC,
  channelInstrumentType: ChannelTypes.ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationCode: 'E',
  channelOrientationType: ChannelTypes.ChannelOrientationType.EAST_WEST,
  configuredInputs: configuredInputs as any, // cast it so that we can keep type safety elsewhere
  description: 'broad-band_east Filtered using a filter def name-1 filter.',
  effectiveUntil: '2022-08-17T01:59:59.984Z',
  location: {
    depthKm: 0.0,
    elevationKm: 0.403,
    latitudeDegrees: 69.534859,
    longitudeDegrees: 25.505777
  },
  nominalSampleRateHz: 40.0,
  orientationAngles: { horizontalAngleDeg: 90.0, verticalAngleDeg: 90.0 },
  processingDefinition: {
    filterDescription: {
      comments: 'the comments 1',
      causal: false,
      filterType: 'LINEAR',
      linearFilterType: 'IIR_BUTTERWORTH',
      lowFrequencyHz: 0.5,
      highFrequencyHz: 1.0,
      order: 1,
      zeroPhase: false,
      passBandType: 'BAND_PASS',
      parameters: {
        sampleRateHz: 40.0,
        sampleRateToleranceHz: 2.0,
        sosDenominatorCoefficients: [0.1, 1.0],
        sosNumeratorCoefficients: [1.1, 1.2],
        groupDelaySec: 'PT3S'
      }
    },
    comments: 'the comments 1',
    name: 'filter def name-1'
  },
  processingMetadata: {
    CHANNEL_GROUP: 'ARA0',
    FILTER_CAUSALITY: false,
    FILTER_TYPE: 'IIR_BUTTERWORTH'
  },
  response: undefined,
  station: testStationVersionReference,
  units: CommonTypes.Units.NANOMETERS,
  effectiveAt: '2022-08-09T12:00:00Z',
  name: 'ARCES.ARA0.BHE'
};
