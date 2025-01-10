import type { CommonTypes, WaveformTypes } from '@gms/common-model';
import type {
  BeamDefinition,
  BeamDescription,
  BeamParameters
} from '@gms/common-model/lib/beamforming-templates/types';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';
import type { ChannelSegment, ProcessingMask } from '@gms/common-model/lib/channel-segment';
import { ProcessingOperation, TimeseriesType } from '@gms/common-model/lib/channel-segment';
import { Units } from '@gms/common-model/lib/common';
import type { EventHypothesis } from '@gms/common-model/lib/event';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import type { QcSegmentVersion } from '@gms/common-model/lib/qc-segment';
import type { RelativePosition } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Waveform } from '@gms/common-model/lib/waveform/types';

import type { MaskAndBeamWaveformProps } from '../../../src/ts/ui-wasm';
import data from './beamforming-data.json';

export type DataType = 'raw' | 'mask';

const KM_PER_DEGREE = 111.3;

const beamDescription: BeamDescription = {
  beamSummation: 'COHERENT',
  beamType: BeamType.EVENT,
  samplingType: 'NEAREST_SAMPLE',
  twoDimensional: false,
  phase: 'P',
  preFilterDefinition: undefined
};

const getBeamParameters = (type: DataType): BeamParameters => {
  return {
    eventHypothesis: {} as EventHypothesis,
    minWaveformsToBeam: 2,
    orientationAngles: {
      horizontalAngleDeg: 1,
      verticalAngleDeg: 1
    },
    orientationAngleToleranceDeg: 5,
    receiverToSourceAzimuthDeg: data[type].beam.azimuthDeg,
    sampleRateHz: 40,
    slownessSecPerDeg: data[type].beam.slownessSecPerKm * KM_PER_DEGREE,
    sampleRateToleranceHz: 0.001
  };
};

const getBeamDefinition = (type: DataType): BeamDefinition => ({
  beamDescription,
  beamParameters: getBeamParameters(type)
});

const getChannelSegments = (type: DataType): ChannelSegment<Waveform>[] => {
  const channelSegments: ChannelSegment<Waveform>[] = [];
  const channelSegmentData = data[type].channelSegments;
  const channelSegmentCount = channelSegmentData.length;
  const timeseriesType: TimeseriesType = TimeseriesType.WAVEFORM;
  const units: Units = Units.NANOMETERS;
  for (let i = 0; i < channelSegmentCount; i += 1) {
    const timeseries: Waveform[] = [];
    const channelName = channelSegmentData[i].id.channel.name;
    const creationTime = 1702403100.407;
    const { startTime } = channelSegmentData[i].id;
    const { endTime } = channelSegmentData[i].id;
    const timeseriesCount = channelSegmentData[i].timeseries.length;
    for (let j = 0; j < timeseriesCount; j += 1) {
      const { sampleCount } = channelSegmentData[i].timeseries[j];
      const timeseriesStartTime = channelSegmentData[i].timeseries[j].startTime;
      const timeseriesEndTime = channelSegmentData[i].timeseries[j].endTime;
      const { sampleRateHz } = channelSegmentData[i].timeseries[j];
      const samples: Float64Array = Float64Array.from(channelSegmentData[i].timeseries[j].samples);
      const waveform: Waveform = {
        startTime: timeseriesStartTime,
        endTime: timeseriesEndTime,
        sampleRateHz,
        type: TimeseriesType.WAVEFORM,
        samples,
        sampleCount
      };
      timeseries.push(waveform);
    }
    const channel: VersionReference<'name'> = { name: channelName, effectiveAt: creationTime };

    const channelSegment: ChannelSegment<Waveform> = {
      id: {
        startTime,
        endTime,
        channel,
        creationTime
      },
      timeseriesType,
      timeseries,
      maskedBy: [],
      missingInputChannels: [],
      units
    };
    channelSegments.push(channelSegment);
  }
  return channelSegments;
};

const getRelativePositionsByChannel = (type: DataType): Record<string, RelativePosition> => {
  const relativePositionsByChannel: Record<string, RelativePosition> = {};
  const channelSegments = getChannelSegments(type);
  channelSegments.forEach(channelSegment => {
    const channelName = channelSegment.id.channel.name;
    const siteStart = channelName.indexOf('.');
    const siteEnd = channelName.indexOf('.', siteStart + 1);
    const siteName = channelName.substring(siteStart + 1, siteEnd);
    const relativePosition: RelativePosition = {
      northDisplacementKm: data.sites[siteName].northOffsetKm,
      eastDisplacementKm: data.sites[siteName].eastOffsetKm,
      verticalDisplacementKm: data.sites[siteName].elevationKm
    };
    relativePositionsByChannel[channelName] = relativePosition;
  });
  return relativePositionsByChannel;
};

const getProcessingMasks = (type: DataType): Record<string, ProcessingMask[]> => {
  const processingMasks: Record<string, ProcessingMask[]> = {};

  const { channelSegments } = data[type];

  channelSegments.forEach(channelSegment => {
    const processingMaskCount = channelSegment.maskedBy.length;
    if (processingMaskCount > 0) {
      for (let j = 0; j < processingMaskCount; j += 1) {
        const channelName = channelSegment.id.channel.name;
        const appliedToRawChannel: VersionReference<'name'> = {
          name: channelName,
          effectiveAt: 0
        };

        const { maskedBy } = channelSegment;
        let maskStartSample = -1;
        let previousSampleMasked = false;
        const channelSegmentStartTime = channelSegment.id.startTime;
        const sampleRate = channelSegment.timeseries[0].sampleRateHz;
        maskedBy.forEach((masked, k) => {
          if (masked) {
            if (!previousSampleMasked) {
              maskStartSample = k;
              previousSampleMasked = true;
            }
          } else if (previousSampleMasked) {
            // const appliedToRawChannel = Channel(channelName);
            const processingOperation = ProcessingOperation.EVENT_BEAM;
            const effectiveAt = 0;
            const startTime = channelSegmentStartTime + maskStartSample / sampleRate;
            const endTime = channelSegmentStartTime + (k - 1) / sampleRate;
            const maskedQcSegmentVersions: QcSegmentVersion[] = [];
            if (processingMasks[channelName] == null) {
              processingMasks[channelName] = [];
            }
            processingMasks[channelName].push({
              id: `${j}`,
              appliedToRawChannel,
              processingOperation,
              effectiveAt,
              startTime,
              endTime,
              maskedQcSegmentVersions
            });

            previousSampleMasked = false;
          }
        });
      }
    }
  });
  return processingMasks;
};

const getBeamStartTime = (type: DataType) => data[type].beam.startTime;
const getBeamEndTime = (type: DataType) => data[type].beam.endTime;

export const getSampleInput = (type: DataType): MaskAndBeamWaveformProps => {
  return {
    station: {
      name: 'station'
    },
    beamDefinition: getBeamDefinition(type),
    channelSegments: getChannelSegments(type),
    relativePositionsByChannel: getRelativePositionsByChannel(type),
    beamStartTime: getBeamStartTime(type),
    beamEndTime: getBeamEndTime(type),
    processingMasks: getProcessingMasks(type)
  };
};

export const getExpectedResults = (
  type: DataType
): CommonTypes.TimeseriesWithMissingInputChannels<WaveformTypes.Waveform> => {
  return {
    timeseries: [
      {
        startTime: data[type].beam.startTime,
        endTime: data[type].beam.endTime,
        type: TimeseriesType.WAVEFORM,
        sampleRateHz: 40,
        sampleCount: data[type].beam.samples.length,
        samples: Float64Array.from(data[type].beam.samples)
      }
    ],
    missingInputChannels: []
  };
};
