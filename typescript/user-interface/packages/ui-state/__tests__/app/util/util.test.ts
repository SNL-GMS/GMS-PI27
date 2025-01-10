import type { ChannelSegmentTypes, CommonTypes, WaveformTypes } from '@gms/common-model';
import {
  eventHypothesis,
  PD01Channel,
  sampleRotationDefinition,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { ProcessingMask } from '@gms/common-model/lib/channel-segment';
import { ProcessingOperation, TimeseriesType } from '@gms/common-model/lib/channel-segment';
import { ChannelOrientationType } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import {
  HALF_CIRCLE_DEGREES,
  THREE_QUARTER_CIRCLE_DEGREES,
  toEpochSeconds
} from '@gms/common-util';

import {
  adjustRotationDefinitionForChannelOrientation,
  createRotatedUiChannelSegment,
  determineAllAssociableSignalDetections,
  determineAllDeletableSignalDetections,
  determineAllNonAssociableSignalDetections,
  findOverlappingProcessingMasks,
  trimUiChannelSegment
} from '../../../src/ts/app/util/util';
import { buildUiChannelSegmentRecordFromList } from '../../__data__';

describe('State Utils', () => {
  it('determineAllAssociableSignalDetections exists', () => {
    expect(determineAllAssociableSignalDetections).toBeDefined();
  });

  it('determineAllNonAssociableSignalDetections exists', () => {
    expect(determineAllNonAssociableSignalDetections).toBeDefined();
  });

  it('determineAllAssociableSignalDetections finds all associable detections', () => {
    const result = determineAllAssociableSignalDetections(
      eventHypothesis,
      signalDetectionsData[0].signalDetectionHypotheses
    );
    expect(result).toBeDefined();
    expect(result).toEqual([]);
  });

  it('determineAllNonAssociableSignalDetections finds all non associable detections', () => {
    const result = determineAllNonAssociableSignalDetections(
      eventHypothesis,
      signalDetectionsData[0].signalDetectionHypotheses
    );
    expect(result).toBeDefined();
    expect(result).toEqual(['012de1b9-8ae3-3fd4-800d-58665c3152cc']);
  });

  it('determineAllDeletableSignalDetections finds all deletable detections', () => {
    const result = determineAllDeletableSignalDetections(
      signalDetectionsData[0].signalDetectionHypotheses
    );
    expect(result).toBeDefined();
    expect(result).toEqual(['012de1b9-8ae3-3fd4-800d-58665c3152cc']);
  });

  describe('trimUiChannelSegment', () => {
    const uiChannelSegmentRecord = buildUiChannelSegmentRecordFromList(['PDAR', 'ASAR']);

    const pdarChannelSegment = uiChannelSegmentRecord.PDAR.Unfiltered[0];

    it('returns channel segments with the trimmed start and end times', () => {
      const trimmedTimeRange = {
        startTimeSecs: 1638298000,
        endTimeSecs: 1638298100
      };
      const trimmedChannelSegment = trimUiChannelSegment(pdarChannelSegment, trimmedTimeRange);
      expect(
        trimmedChannelSegment.channelSegment.timeseries.reduce((prev, current) => {
          return Math.min(prev, current.startTime);
        }, Infinity)
      ).toBe(trimmedTimeRange.startTimeSecs);
      expect(
        trimmedChannelSegment.channelSegment.timeseries.reduce((prev, current) => {
          return Math.max(prev, current.endTime);
        }, -Infinity)
      ).toBe(trimmedTimeRange.endTimeSecs);
    });
    it('returns channel segments with the original start and end times if within the trimmed range', () => {
      const trimmedTimeRange = {
        startTimeSecs: 1638296000,
        endTimeSecs: 1638299999
      };
      const trimmedChannelSegment = trimUiChannelSegment(pdarChannelSegment, trimmedTimeRange);
      expect(
        trimmedChannelSegment.channelSegment.timeseries.reduce((prev, current) => {
          return Math.min(prev, current.startTime);
        }, Infinity)
      ).toBeGreaterThan(trimmedTimeRange.startTimeSecs);
      expect(
        trimmedChannelSegment.channelSegment.timeseries.reduce((prev, current) => {
          return Math.max(prev, current.endTime);
        }, -Infinity)
      ).toBeLessThan(trimmedTimeRange.endTimeSecs);
    });
  });

  describe('adjustRotationDefinitionForChannelOrientation', () => {
    it('adjusts the horizontalAngleDeg by 180 if the channel orientation type is radial', () => {
      const result = adjustRotationDefinitionForChannelOrientation(
        sampleRotationDefinition,
        ChannelOrientationType.RADIAL
      );
      expect(result.rotationParameters.orientationAngles.horizontalAngleDeg).toEqual(
        sampleRotationDefinition.rotationParameters.receiverToSourceAzimuthDeg + HALF_CIRCLE_DEGREES
      );
    });
    it('adjusts the horizontalAngleDeg by 270 if the channel orientation type is transverse', () => {
      const result = adjustRotationDefinitionForChannelOrientation(
        sampleRotationDefinition,
        ChannelOrientationType.TRANSVERSE
      );
      expect(result.rotationParameters.orientationAngles.horizontalAngleDeg).toEqual(
        sampleRotationDefinition.rotationParameters.receiverToSourceAzimuthDeg +
          THREE_QUARTER_CIRCLE_DEGREES
      );
    });

    it('makes no change if the channel orientation type is not radial or transverse', () => {
      const result = adjustRotationDefinitionForChannelOrientation(
        sampleRotationDefinition,
        ChannelOrientationType.EAST_WEST
      );
      expect(result).toMatchObject(sampleRotationDefinition);
    });
  });

  const waveforms: WaveformTypes.Waveform[] = [
    {
      samples: new Float64Array(),
      type: TimeseriesType.WAVEFORM,
      startTime: 0,
      endTime: 10,
      sampleRateHz: 0,
      sampleCount: 0
    },
    {
      samples: new Float64Array(),
      type: TimeseriesType.WAVEFORM,
      startTime: 11,
      endTime: 20,
      sampleRateHz: 0,
      sampleCount: 0
    },
    {
      samples: new Float64Array(),
      type: TimeseriesType.WAVEFORM,
      startTime: 21,
      endTime: 30,
      sampleRateHz: 0,
      sampleCount: 0
    }
  ];
  const processingMasks: ProcessingMask[] = [
    {
      id: '',
      effectiveAt: 0,
      startTime: 0,
      endTime: 1,
      appliedToRawChannel: { name: '' },
      processingOperation: ProcessingOperation.ROTATION,
      maskedQcSegmentVersions: []
    },
    {
      id: '',
      effectiveAt: 0,
      startTime: 10,
      endTime: 11,
      appliedToRawChannel: { name: '' },
      processingOperation: ProcessingOperation.ROTATION,
      maskedQcSegmentVersions: []
    },
    {
      id: '',
      effectiveAt: 0,
      startTime: 29,
      endTime: 40,
      appliedToRawChannel: { name: '' },
      processingOperation: ProcessingOperation.ROTATION,
      maskedQcSegmentVersions: []
    },
    {
      id: '',
      effectiveAt: 0,
      startTime: 40,
      endTime: 50,
      appliedToRawChannel: { name: '' },
      processingOperation: ProcessingOperation.ROTATION,
      maskedQcSegmentVersions: []
    }
  ];

  describe('findOverlappingProcessingMasks', () => {
    it('will get the filtered list of overlapping processing masks', () => {
      const result = findOverlappingProcessingMasks(processingMasks, waveforms);
      expect(result).toHaveLength(3);
    });
  });

  describe('createRotatedUiChannelSegment', () => {
    it('creates the channel segment with the given input', () => {
      const date = new Date('2024-01-01');
      const creationTime = toEpochSeconds(date.toDateString());
      jest.useFakeTimers().setSystemTime(date);

      const rotationTimeInterval: CommonTypes.TimeRange = {
        startTimeSecs: 123,
        endTimeSecs: 321
      };

      const domainTimeRange: CommonTypes.TimeRange = {
        startTimeSecs: 123,
        endTimeSecs: 321
      };

      const missingInputChannels: ChannelSegmentTypes.TimeRangesByChannel[] = [
        {
          channel: {
            name: PD01Channel.name
          },
          timeRanges: [
            {
              startTime: 0,
              endTime: 1
            }
          ]
        }
      ];

      const result = createRotatedUiChannelSegment(
        PD01Channel,
        rotationTimeInterval,
        domainTimeRange,
        waveforms,
        TimeseriesType.WAVEFORM,
        processingMasks,
        missingInputChannels
      );
      jest.useRealTimers();

      expect(result).toMatchObject({
        channelSegmentDescriptor: {
          channel: {
            name: PD01Channel.name,
            effectiveAt: PD01Channel.effectiveAt
          },
          startTime: rotationTimeInterval.startTimeSecs,
          endTime: rotationTimeInterval.endTimeSecs,
          creationTime
        },
        channelSegment: {
          id: {
            channel: {
              name: PD01Channel.name,
              effectiveAt: PD01Channel.effectiveAt
            },
            startTime: rotationTimeInterval.startTimeSecs,
            endTime: rotationTimeInterval.endTimeSecs,
            creationTime
          },
          units: PD01Channel.units,
          timeseriesType: TimeseriesType.WAVEFORM,
          timeseries: waveforms,
          maskedBy: processingMasks,
          missingInputChannels
        },
        domainTimeRange: {
          startTimeSecs: rotationTimeInterval.startTimeSecs,
          endTimeSecs: rotationTimeInterval.endTimeSecs
        }
      });
    });
  });
});
