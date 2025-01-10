import type { FkTypes } from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import {
  PD01Channel,
  pd01ProcessingMask,
  pdar,
  processingMaskDefinition,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { SECONDS_IN_MINUTES } from '@gms/common-util';

import type { ComputeFkSpectraArgs } from '../../../src/ts/app';
import {
  computeFkSpectraWorker,
  getPeakFkAttributesWorker
} from '../../../src/ts/workers/waveform-worker/operations/ui-fk-processor';
import { defaultSpectraTemplate, getTestFkData } from '../../__data__';

const fkAttributes: FkTypes.FkAttributes = {
  peakFStat: 11.1391088585,
  receiverToSourceAzimuth: {
    value: 120.55096987354057,
    standardDeviation: 0.007000210384022968,
    units: CommonTypes.Units.DEGREES
  },
  slowness: {
    value: 13071.373483361533,
    standardDeviation: 1.597017531000969,
    units: CommonTypes.Units.SECONDS
  }
};

jest.mock('@gms/ui-wasm', () => {
  const fkWithMissingChannels: CommonTypes.TimeseriesWithMissingInputChannels<FkTypes.FkSpectraCOI> =
    {
      timeseries: [
        {
          fkSpectraMetadata: {
            phase: 'P',
            slownessGrid: {
              maxSlowness: 40,
              numPoints: 81
            },
            fkSpectrumWindow: {
              duration: 5.1,
              lead: 1.1
            }
          },
          samples: [],
          type: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
          startTime: 100,
          endTime: 310,
          sampleRateHz: 20,
          sampleCount: 1
        }
      ],
      missingInputChannels: []
    };

  return {
    computeFkWasm: jest.fn(() => fkWithMissingChannels),
    getPeakFkAttributesWasm: jest.fn(() => fkAttributes)
  };
});

describe('UI FK Processor', () => {
  describe('computeFkSpectraWorker', () => {
    const mockArrivalTime = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(
        signalDetectionsData[0].signalDetectionHypotheses
      ).featureMeasurements
    ).arrivalTime.value;

    const mockProcessingMasksByChannel = [
      {
        channel: { ...PD01Channel, station: pdar },
        processingMasks: [pd01ProcessingMask]
      }
    ];

    const args: ComputeFkSpectraArgs = {
      fkSpectraDefinition: {
        fkParameters: defaultSpectraTemplate.fkSpectraParameters,
        orientationAngles: {
          horizontalAngleDeg: 0,
          verticalAngleDeg: 0
        }
      },
      station: pdar,
      inputChannels: [PD01Channel],
      uiChannelSegments: [],
      detectionTime: mockArrivalTime,
      startTime: mockArrivalTime - SECONDS_IN_MINUTES,
      endTime: mockArrivalTime + SECONDS_IN_MINUTES * 4,
      processingMasksByChannel: mockProcessingMasksByChannel,
      maskTaperDefinition: processingMaskDefinition.taperDefinition,
      expandedTimeBufferSeconds: 60
    };

    test('computeFkSpectra called with all props and returns a defined result', async () => {
      let error;
      const result = await computeFkSpectraWorker(args).catch(e => {
        error = e;
      });
      expect(result).toMatchSnapshot();
      expect(error).toBeUndefined();
    });
  });
});

describe('getPeakFkAttributesWorker', () => {
  test('getPeakFkAttributesWorker', async () => {
    const arrivalTime = 1000;
    const fkSpectra = getTestFkData(arrivalTime);
    let error;
    const result = await getPeakFkAttributesWorker(fkSpectra).catch(e => {
      error = e;
    });
    expect(result).toMatchSnapshot();
    expect(error).toBeUndefined();
  });
});
