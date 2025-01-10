import { SignalDetectionTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { getTestFkData } from '@gms/ui-state/__tests__/__data__';

import {
  buildBeamAndTraceMarkers,
  buildDataBySampleRate,
  computeDisabled,
  fStatDataContainsUndefined,
  useGetBeamChannelSegmentRecord
} from '~analyst-ui/components/azimuth-slowness/components/fk-display/fk-plots/fk-plots-utils';

const arrivalTimeFmValue = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
  SignalDetectionTypes.Util.getCurrentHypothesis(signalDetectionsData[0].signalDetectionHypotheses)
    .featureMeasurements
);
const fkData = getTestFkData(arrivalTimeFmValue.arrivalTime.value);

describe('FK Plots utils', () => {
  test('functions are defined', () => {
    expect(fStatDataContainsUndefined).toBeDefined();
    expect(computeDisabled).toBeDefined();
    expect(buildDataBySampleRate).toBeDefined();
    expect(buildBeamAndTraceMarkers).toBeDefined();
    expect(useGetBeamChannelSegmentRecord).toBeDefined();
  });

  describe('fStatDataContainsUndefined', () => {
    test('returns true because there is no fstatData', () => {
      expect(fStatDataContainsUndefined(undefined)).toBe(true);
    });

    test('returns true because there is no azimuthWf', () => {
      expect(
        fStatDataContainsUndefined({
          ...fkData.fstatData,
          azimuthWf: undefined
        })
      ).toBe(true);
    });

    test('returns true because there is no fstatWf', () => {
      expect(
        fStatDataContainsUndefined({
          ...fkData.fstatData,
          fstatWf: undefined
        })
      ).toBe(true);
    });

    test('returns true because there is no slownessWf', () => {
      expect(
        fStatDataContainsUndefined({
          ...fkData.fstatData,
          slownessWf: undefined
        })
      ).toBe(true);
    });

    test('returns false because all data is present', () => {
      expect(fStatDataContainsUndefined(fkData.fstatData)).toBe(false);
    });
  });

  describe('computeDisabled', () => {
    test('returns true, no fk', () => {
      expect(
        computeDisabled(
          fkData.configuration.fkSpectraParameters.fkSpectrumWindow.lead,
          fkData.configuration.fkSpectraParameters.fkSpectrumWindow.duration,
          undefined
        )
      ).toBe(true);
    });

    test('returns true, parameters are equal', () => {
      expect(
        computeDisabled(
          fkData.configuration.fkSpectraParameters.fkSpectrumWindow.lead,
          fkData.configuration.fkSpectraParameters.fkSpectrumWindow.duration,
          fkData
        )
      ).toBe(true);
    });

    test('returns false, parameters are different', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        computeDisabled(1.2, 5.5, fkData)
      ).toBe(false);
    });
  });

  test('buildDataBySampleRate builds DataBySampleRate object', () => {
    const result = buildDataBySampleRate(fkData.fstatData.fstatWf);

    expect(result).toMatchSnapshot();
  });

  test('buildSelectionMarkers builds Markers object', () => {
    const interval = { startTimeSecs: fkData.startTime, endTimeSecs: fkData.endTime };
    const result = buildBeamAndTraceMarkers(
      fkData.configuration.fkSpectraParameters.spectrumStepDuration,
      interval,
      arrivalTimeFmValue.arrivalTime.value,
      1.0,
      interval
    );

    expect(result).toMatchSnapshot();
  });
});
