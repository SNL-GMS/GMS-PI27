import type { WaveformTypes } from '@gms/common-model';
import { CommonTypes } from '@gms/common-model';
import type {
  BeamDefinition,
  BeamDescription,
  BeamParameters
} from '@gms/common-model/lib/beamforming-templates/types';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';
import type { ChannelSegment, ProcessingMask } from '@gms/common-model/lib/channel-segment';
import { TimeseriesType } from '@gms/common-model/lib/channel-segment';
import type { EventHypothesis } from '@gms/common-model/lib/event';
import type { RelativePosition } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';

import { MaskAndBeamError } from '../../../src/ts/gms-interop/beam/mask-and-beam-error';
import { maskAndBeamWaveforms } from '../../../src/ts/ui-wasm';
import { numberPrecisionCompare, precisionCompare } from '../filters/validation/test-utils';
import type { DataType } from './beamforming-data';
import { getExpectedResults, getSampleInput } from './beamforming-data';

describe('GMS interop maskAndBeamWaveforms', () => {
  test('maskAndBeamWaveforms with invalid beam start and end time', async () => {
    const beamStartTime = 5;
    const beamEndTime = 0;

    const channelSegments: ChannelSegment<WaveformTypes.Waveform>[] = [
      {
        id: {
          channel: { name: 'BAD', effectiveAt: 0 },
          startTime: 5,
          endTime: 0,
          creationTime: 0
        },
        units: CommonTypes.Units.HERTZ,
        timeseriesType: TimeseriesType.WAVEFORM,
        timeseries: [],
        missingInputChannels: [],
        maskedBy: []
      }
    ];

    const beamDescription: BeamDescription = {
      beamSummation: 'COHERENT',
      beamType: BeamType.CONTINUOUS_LOCATION,
      samplingType: 'INTERPOLATED',
      phase: 'P',
      twoDimensional: false
    };

    const beamParameters: BeamParameters = {
      eventHypothesis: {} as EventHypothesis,
      minWaveformsToBeam: 1,
      orientationAngles: {
        horizontalAngleDeg: 1,
        verticalAngleDeg: 1
      },
      orientationAngleToleranceDeg: 1,
      receiverToSourceAzimuthDeg: 1,
      sampleRateHz: 1,
      slownessSecPerDeg: 1,
      sampleRateToleranceHz: 1
    };

    const beamDefinition: BeamDefinition = { beamDescription, beamParameters };
    const relativePositionsByChannel: Record<string, RelativePosition> = {
      BAD: {
        northDisplacementKm: 100,
        eastDisplacementKm: 100,
        verticalDisplacementKm: 100
      }
    };

    // Processing masks not presently used but are required by the C++ function signature
    const processingMasks: Record<string, ProcessingMask[]> = {};

    await expect(async () => {
      await maskAndBeamWaveforms({
        station: {
          name: 'station'
        },
        beamDefinition,
        channelSegments,
        relativePositionsByChannel,
        beamStartTime,
        beamEndTime,
        processingMasks
      });
    }).rejects.toThrow(
      new MaskAndBeamError(
        `Failed to compute mask and beam waveforms. std::invalid_argument: SigPro returned a code: 1`,
        {
          station: {
            name: 'station'
          },
          beamDefinition,
          channelSegments,
          relativePositionsByChannel,
          beamStartTime,
          beamEndTime,
          processingMasks
        }
      )
    );
  });

  test('maskAndBeamWaveforms', async () => {
    const endTimePrecision = 3;
    const samplePrecision = 6;

    const type: DataType = 'raw';

    const result = await maskAndBeamWaveforms(getSampleInput(type));

    const expected = getExpectedResults(type);

    expect(result.timeseries).toHaveLength(expected.timeseries.length);
    expect(result.missingInputChannels).toHaveLength(expected.missingInputChannels.length);

    for (let i = 0; i < result.timeseries.length; i += 1) {
      expect(result.timeseries[i].startTime).toEqual(expected.timeseries[i].startTime);
      // end time is a calculated value in the beamforming algo, won't match results exactly; this is parallel to the C++
      numberPrecisionCompare(
        result.timeseries[i].endTime,
        expected.timeseries[i].endTime,
        endTimePrecision
      );
      expect(result.timeseries[i].sampleCount).toEqual(expected.timeseries[i].sampleCount);
      expect(result.timeseries[i].sampleRateHz).toEqual(expected.timeseries[i].sampleRateHz);
      expect(result.timeseries[i].type).toEqual(expected.timeseries[i].type);

      precisionCompare(
        result.timeseries[i].samples,
        expected.timeseries[i].samples,
        samplePrecision
      );
    }
  });

  test('maskAndBeamWaveforms with processing masks', async () => {
    const endTimePrecision = 3;
    const samplePrecision = 6;

    const type: DataType = 'mask';

    const result = await maskAndBeamWaveforms(getSampleInput(type));

    const expected = getExpectedResults(type);

    expect(result.timeseries).toHaveLength(expected.timeseries.length);
    expect(result.missingInputChannels).toHaveLength(expected.missingInputChannels.length);

    for (let i = 0; i < result.timeseries.length; i += 1) {
      expect(result.timeseries[i].startTime).toEqual(expected.timeseries[i].startTime);
      // end time is a calculated value in the beamforming algo, won't match results exactly; this is parallel to the C++
      numberPrecisionCompare(
        result.timeseries[i].endTime,
        expected.timeseries[i].endTime,
        endTimePrecision
      );
      expect(result.timeseries[i].sampleCount).toEqual(expected.timeseries[i].sampleCount);
      expect(result.timeseries[i].sampleRateHz).toEqual(expected.timeseries[i].sampleRateHz);
      expect(result.timeseries[i].type).toEqual(expected.timeseries[i].type);

      precisionCompare(
        result.timeseries[i].samples,
        expected.timeseries[i].samples,
        samplePrecision
      );
    }
  });
});
