/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { FilterTypes } from '@gms/common-model';
import { CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import { linearFilterDefinition, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type {
  FeatureMeasurement,
  SignalDetectionHypothesis
} from '@gms/common-model/lib/signal-detection';
import { FeatureMeasurementType } from '@gms/common-model/lib/signal-detection';
import { AnalystWorkspaceTypes, defaultTheme } from '@gms/ui-state';
import { buildUiChannelSegmentRecordFromList } from '@gms/ui-state/__tests__/__data__';
import cloneDeep from 'lodash/cloneDeep';

import {
  AMPLITUDE_VALUES,
  FREQUENCY_VALUES
} from '../../../../../src/ts/components/analyst-ui/common/utils/amplitude-scale-constants';
import {
  calculateAmplitudeMeasurementValue,
  exportChannelSegmentsBySelectedSignalDetections,
  exportChannelSegmentsBySelectedStations,
  findMinMaxAmplitudeForPeakTrough,
  getChannelSegmentStringForCurrentHypothesis,
  getExportedChannelSegmentsFileName,
  getSignalDetectionAnalysisWaveformChannelName,
  getSignalDetectionChannelName,
  getSignalDetectionStatusColor,
  getSignalDetectionStatusString,
  getUIChannelSegmentsBySelectedStations,
  getWaveformValueForTime,
  isPeakTroughInWarning,
  scaleAmplitudeForPeakTrough,
  scaleAmplitudeMeasurementValue,
  sortAndOrderSignalDetections
} from '../../../../../src/ts/components/analyst-ui/common/utils/signal-detection-util';
import { systemConfig } from '../../../../../src/ts/components/analyst-ui/config/system-config';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

// Mock Object URL
global.URL.createObjectURL = jest.fn();

/**
 * Tests the ability to check if the peak trough is in warning
 */
describe('isPeakTroughInWarning', () => {
  const { min } = systemConfig.measurementMode.peakTroughSelection.warning;
  const { max } = systemConfig.measurementMode.peakTroughSelection.warning;
  const mid = (max - min) / 2 + min;
  const { startTimeOffsetFromSignalDetection } = systemConfig.measurementMode.selection;
  const { endTimeOffsetFromSignalDetection } = systemConfig.measurementMode.selection;

  it('check [min] period value', () => {
    expect(
      isPeakTroughInWarning(
        0,
        min,
        startTimeOffsetFromSignalDetection,
        endTimeOffsetFromSignalDetection
      )
    ).toEqual(false);
  });

  it('check [max] period value', () => {
    expect(
      isPeakTroughInWarning(
        0,
        max,
        startTimeOffsetFromSignalDetection,
        endTimeOffsetFromSignalDetection
      )
    ).toEqual(false);
  });

  it('check [min, max] period value', () => {
    expect(
      isPeakTroughInWarning(
        0,
        mid,
        startTimeOffsetFromSignalDetection,
        endTimeOffsetFromSignalDetection
      )
    ).toEqual(false);
  });

  it('check bad [min] period value', () => {
    expect(
      isPeakTroughInWarning(
        0,
        min - 0.1,
        startTimeOffsetFromSignalDetection,
        endTimeOffsetFromSignalDetection
      )
    ).toEqual(true);
  });

  it('check bad [max] period value', () => {
    expect(
      isPeakTroughInWarning(
        0,
        max + 0.1,
        startTimeOffsetFromSignalDetection,
        endTimeOffsetFromSignalDetection
      )
    ).toEqual(true);
  });

  it('check trough greater than peak', () => {
    expect(
      isPeakTroughInWarning(
        0,
        mid,
        endTimeOffsetFromSignalDetection,
        startTimeOffsetFromSignalDetection
      )
    ).toEqual(true);
  });

  it('check trough out of range', () => {
    expect(
      isPeakTroughInWarning(
        0,
        mid,
        startTimeOffsetFromSignalDetection - 0.1,
        endTimeOffsetFromSignalDetection
      )
    ).toEqual(true);
  });

  it('check peak out of range', () => {
    expect(
      isPeakTroughInWarning(
        0,
        mid,
        startTimeOffsetFromSignalDetection,
        endTimeOffsetFromSignalDetection + 0.1
      )
    ).toEqual(true);
  });

  it('check peak trough out of range', () => {
    expect(
      isPeakTroughInWarning(
        0,
        mid,
        startTimeOffsetFromSignalDetection - 0.1,
        endTimeOffsetFromSignalDetection + 0.1
      )
    ).toEqual(true);
  });
});

/**
 * Tests the ability to find the [min,max] for the peak trough
 */
describe('findMinMaxForPeakTrough', () => {
  it('find [min,max] with a bad starting index', () => {
    const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let result = findMinMaxAmplitudeForPeakTrough(-1, samples);
    expect(result.min.value).toEqual(0);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(0);
    expect(result.max.index).toEqual(0);

    result = findMinMaxAmplitudeForPeakTrough(samples.length, samples);
    expect(result.min.value).toEqual(0);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(0);
    expect(result.max.index).toEqual(0);
  });

  it('find [min,max] with a bad data samples', () => {
    let result = findMinMaxAmplitudeForPeakTrough(0, undefined);
    expect(result.min.value).toEqual(0);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(0);
    expect(result.max.index).toEqual(0);

    result = findMinMaxAmplitudeForPeakTrough(0, []);
    expect(result.min.value).toEqual(0);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(0);
    expect(result.max.index).toEqual(0);
  });

  it('find [min,max] for a flat line', () => {
    const samples = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    const result = findMinMaxAmplitudeForPeakTrough(4, samples);
    expect(result.min.value).toEqual(2);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(2);
    expect(result.max.index).toEqual(samples.length - 1);
  });

  it('find [min,max] for a partial flat line', () => {
    const samples = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    const result = findMinMaxAmplitudeForPeakTrough(4, samples);
    expect(result.min.value).toEqual(2);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(5);
    expect(result.max.index).toEqual(samples.length - 1);
  });

  it('find [min,max] for another partial flat line', () => {
    const samples = [7, 2, 2, 2, 2, 2, 2, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    const result = findMinMaxAmplitudeForPeakTrough(10, samples);
    expect(result.min.value).toEqual(2);
    expect(result.min.index).toEqual(1);
    expect(result.max.value).toEqual(5);
    expect(result.max.index).toEqual(samples.length - 1);
  });

  it('find [min,max] with good data', () => {
    const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4];

    let result = findMinMaxAmplitudeForPeakTrough(0, samples);
    expect(result.min.value).toEqual(1);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(10);
    expect(result.max.index).toEqual(9);

    result = findMinMaxAmplitudeForPeakTrough(9, samples);
    expect(result.min.value).toEqual(1);
    expect(result.min.index).toEqual(0);
    expect(result.max.value).toEqual(10);
    expect(result.max.index).toEqual(9);

    result = findMinMaxAmplitudeForPeakTrough(13, samples);
    expect(result.min.value).toEqual(4);
    expect(result.min.index).toEqual(15);
    expect(result.max.value).toEqual(10);
    expect(result.max.index).toEqual(9);

    result = findMinMaxAmplitudeForPeakTrough(15, samples);
    expect(result.min.value).toEqual(4);
    expect(result.min.index).toEqual(15);
    expect(result.max.value).toEqual(10);
    expect(result.max.index).toEqual(9);
  });
});

/**
 * Tests the ability scale an amplitude measurement value
 */
describe('scaleAmplitudeMeasurementValue', () => {
  it('expect scale of amplitude measurement too throw exception with bad data', () => {
    expect(() => {
      scaleAmplitudeMeasurementValue(undefined);
    }).toThrow();
  });

  it('scale amplitude measurement value', () => {
    const amplitude = 5;
    const periodValues = FREQUENCY_VALUES.map(freq => 1 / freq);

    const amplitudeMeasurementValue: SignalDetectionTypes.AmplitudeMeasurementValue = {
      amplitude,
      units: CommonTypes.Units.UNITLESS,
      period: periodValues[8],
      clipped: false,
      measurementTime: 500,
      measurementWindowDuration: 100,
      measurementWindowStart: 450
    };

    const scaledAmplitudeMeasurementValue =
      scaleAmplitudeMeasurementValue(amplitudeMeasurementValue);
    const normalizedAmplitude = AMPLITUDE_VALUES[8] / AMPLITUDE_VALUES[348];
    expect(scaledAmplitudeMeasurementValue.amplitude).toEqual(amplitude / normalizedAmplitude);
    expect(scaledAmplitudeMeasurementValue.period).toEqual(periodValues[8]);
    expect(scaledAmplitudeMeasurementValue.measurementTime).toEqual(500);
  });
});

/**
 * Tests the ability calculate the scaled amplitude
 */
describe('scaleAmplitudeForPeakTrough', () => {
  it('expect calculation to throw exception with bad data', () => {
    expect(() => {
      scaleAmplitudeForPeakTrough(0, 0, 1, [], []);
    }).toThrow();

    expect(() => {
      scaleAmplitudeForPeakTrough(0, 0, 1, [1, 2, 3], [1, 2]);
    }).toThrow();
  });

  it('scale amplitude value appropriately when nominal calibration period is equal to 1', () => {
    const amplitude = 5;
    const periodValues = FREQUENCY_VALUES.map(freq => 1 / freq);
    const normalizedAmplitude = AMPLITUDE_VALUES[5] / AMPLITUDE_VALUES[348];
    expect(scaleAmplitudeForPeakTrough(amplitude, periodValues[5])).toEqual(
      amplitude / normalizedAmplitude
    );
  });

  it('scale amplitude value appropriately with nominal calibration period is equal to 2', () => {
    const amplitude = 5;
    const periodValues = FREQUENCY_VALUES.map(freq => 1 / freq);
    const nominalCalibrationPeriod = 2;
    const expectedFoundPeriod: { index: number; value: number } = {
      index: 5,
      value: 909.090909090909
    };
    const expectedNormalizedAmplitude = AMPLITUDE_VALUES[expectedFoundPeriod.index];
    const expectedFoundPeriodForCalibration: {
      index: number;
      value: number;
    } = { value: 2.004008016032064, index: 313 };
    const normalizedAmplitude =
      expectedNormalizedAmplitude / AMPLITUDE_VALUES[expectedFoundPeriodForCalibration.index];

    expect(
      scaleAmplitudeForPeakTrough(amplitude, periodValues[5], nominalCalibrationPeriod)
    ).toEqual(amplitude / normalizedAmplitude);
  });
});

/**
 * Tests the ability calculate an Amplitude measurement
 */
describe('calculateAmplitudeMeasurementValue', () => {
  const peakAmplitude = 4;
  const troughAmplitude = 2;
  const peakTime = 4;
  const troughTime = 2;
  const expectedResult: SignalDetectionTypes.AmplitudeMeasurementValue = {
    amplitude: 1,
    units: CommonTypes.Units.UNITLESS,
    period: 4,
    clipped: false,
    measurementTime: Math.min(troughTime, peakTime),
    measurementWindowDuration: 0, // TODO: change this once we actually have measurement window duration
    measurementWindowStart: 0 // TODO: change this once we actually have measurement window start
  };
  it('expect calculation to set samples to return correct result', () => {
    const result: SignalDetectionTypes.AmplitudeMeasurementValue =
      calculateAmplitudeMeasurementValue(peakAmplitude, troughAmplitude, peakTime, troughTime);

    expect(result).toEqual(expectedResult);
  });

  it('should recalculate with the expected results', () => {
    const expectedResults: SignalDetectionTypes.AmplitudeMeasurementValue = {
      amplitude: 1,
      units: CommonTypes.Units.UNITLESS,
      period: 2,
      clipped: false,
      measurementTime: 1553022096,
      measurementWindowDuration: 0, // TODO: update this when measurement window duration is plumbed through
      measurementWindowStart: 0 // TODO: update this when measurement window duration is plumbed through
    };
    const input = {
      startTime: 1553022096,
      peakAmplitude: 2,
      troughAmplitude: 0,
      peakTime: 1553022096,
      troughTime: 1553022097
    };
    const result = calculateAmplitudeMeasurementValue(
      input.peakAmplitude,
      input.troughAmplitude,
      input.peakTime,
      input.troughTime
    );
    expect(result).toBeDefined();

    expect(result).toEqual(expectedResults);
  });
});

/**
 * Tests the ability to get the waveform value for the given waveform data
 */
describe('getWaveformValueForTime', () => {
  const timeSecs = 0;

  it('expect calculation to return undefined when no waveforms are given', () => {
    expect(getWaveformValueForTime(undefined, timeSecs)).toBeUndefined();
  });

  describe('find FeatureMeasurement', () => {
    it('undefined feature measurement type', () => {
      const result = SignalDetectionTypes.Util.findFeatureMeasurementByType([], null);
      expect(result).toBeUndefined();
    });

    it('undefined feature measurement list', () => {
      const result = SignalDetectionTypes.Util.findFeatureMeasurementByType(null, null);
      expect(result).toBeUndefined();
    });

    it('find each feature measurement type', () => {
      Object.values(FeatureMeasurementType).forEach((value: FeatureMeasurementType) => {
        const fm: FeatureMeasurement = {
          channel: null,
          featureMeasurementType: value,
          measuredChannelSegment: null,
          snr: null,
          measurementValue: null
        };
        const result = SignalDetectionTypes.Util.findFeatureMeasurementByType([fm], value);
        expect(result.featureMeasurementType).toEqual(fm.featureMeasurementType);
      });
    });
  });

  /**
   * Test the ability to get the current hypothesis from a set of hypotheses.
   */
  describe('SignalDetectionTypes.Util.getCurrentHypothesis', () => {
    it('correct hypothesis returned', () => {
      const hypotheses = [];

      const hypothesis1: SignalDetectionHypothesis = {
        id: {
          id: 'TEST1',
          signalDetectionId: null
        },
        featureMeasurements: [],
        monitoringOrganization: 'GMS',
        parentSignalDetectionHypothesis: null,
        deleted: false,
        station: {
          name: 'TEST',
          effectiveAt: null
        }
      };

      const hypothesis2: SignalDetectionHypothesis = {
        id: {
          id: 'TEST2',
          signalDetectionId: null
        },
        featureMeasurements: [],
        monitoringOrganization: 'GMS',
        parentSignalDetectionHypothesis: null,
        deleted: false,
        station: {
          name: 'TEST',
          effectiveAt: null
        }
      };

      hypotheses.push(hypothesis1, hypothesis2);

      const result = SignalDetectionTypes.Util.getCurrentHypothesis(hypotheses);
      expect(result.id.id).toEqual('TEST2');
    });
  });
});

describe('can get use signal detection utils and get expected results', () => {
  test('getSignalDetectionChannelName', () => {
    const sd = cloneDeep(signalDetectionsData[0]);
    expect(getSignalDetectionChannelName(sd)).toMatchSnapshot();

    // Set arrival time feature measurement to undefined
    const index = sd.signalDetectionHypotheses[0].featureMeasurements.findIndex(
      fm => fm.featureMeasurementType === FeatureMeasurementType.ARRIVAL_TIME
    );
    sd.signalDetectionHypotheses[0].featureMeasurements[index] = undefined;
    expect(() => {
      getSignalDetectionChannelName(sd);
    }).toThrow();

    // Test when there are no feature measurements
    sd.signalDetectionHypotheses[0] = {
      ...sd.signalDetectionHypotheses[0],
      featureMeasurements: undefined
    };
    expect(() => {
      getSignalDetectionChannelName(sd);
    }).toThrow();
    // set the sd hyp to undefined
    sd.signalDetectionHypotheses.splice(0, sd.signalDetectionHypotheses.length);
    expect(getSignalDetectionChannelName(sd)).toBeUndefined();

    // Add feature measurements to get a real value
    expect(getSignalDetectionChannelName(signalDetectionsData[0])).toBeDefined();
  });

  test('getSignalDetectionAnalysisWaveformChannelName', () => {
    const sd = cloneDeep(signalDetectionsData[0]);
    expect(getSignalDetectionAnalysisWaveformChannelName(sd)).toMatchSnapshot();

    // Set arrival time feature measurement to undefined
    const index = sd.signalDetectionHypotheses[0].featureMeasurements.findIndex(
      fm => fm.featureMeasurementType === FeatureMeasurementType.ARRIVAL_TIME
    );
    sd.signalDetectionHypotheses[0].featureMeasurements[index] = undefined;
    expect(() => {
      getSignalDetectionAnalysisWaveformChannelName(sd);
    }).toThrow();

    // Test when there are no feature measurements
    sd.signalDetectionHypotheses[0] = {
      ...sd.signalDetectionHypotheses[0],
      featureMeasurements: undefined
    };
    expect(() => {
      getSignalDetectionAnalysisWaveformChannelName(sd);
    }).toThrow();
    // set the sd hyp to undefined
    sd.signalDetectionHypotheses.splice(0, sd.signalDetectionHypotheses.length);
    expect(getSignalDetectionAnalysisWaveformChannelName(sd)).toBeUndefined();

    // Add feature measurements to get a real value
    expect(getSignalDetectionAnalysisWaveformChannelName(signalDetectionsData[0])).toBeDefined();
  });

  test('getChannelSegmentStringForCurrentHypothesis', () => {
    const sd = cloneDeep(signalDetectionsData[0]);
    expect(getChannelSegmentStringForCurrentHypothesis(sd)).toMatchSnapshot();

    // Set arrival time feature measurement to undefined
    const index = sd.signalDetectionHypotheses[0].featureMeasurements.findIndex(
      fm => fm.featureMeasurementType === FeatureMeasurementType.ARRIVAL_TIME
    );
    sd.signalDetectionHypotheses[0].featureMeasurements[index] = undefined;
    expect(() => {
      getChannelSegmentStringForCurrentHypothesis(sd);
    }).toThrow();

    // Test when there are no feature measurements
    sd.signalDetectionHypotheses[0] = {
      ...sd.signalDetectionHypotheses[0],
      featureMeasurements: undefined
    };
    expect(() => {
      getChannelSegmentStringForCurrentHypothesis(sd);
    }).toThrow();
    // set the sd hyp to undefined
    sd.signalDetectionHypotheses.splice(0, sd.signalDetectionHypotheses.length);
    expect(getChannelSegmentStringForCurrentHypothesis(sd)).toBeUndefined();

    // Add feature measurements to get a real value
    expect(getChannelSegmentStringForCurrentHypothesis(signalDetectionsData[0])).toBeDefined();
  });
});

describe('Sort and order signal detections', () => {
  test('Sort by distance, empty distances', () => {
    const distances = [];
    const result = sortAndOrderSignalDetections(
      signalDetectionsData,
      AnalystWorkspaceTypes.WaveformSortType.distance,
      distances
    );
    const sdIds = result.map(sd => sd.id);
    expect(sdIds).toMatchInlineSnapshot(`
      [
        "012de1b9-8ae3-3fd4-800d-58665c3152cc",
        "012de1b9-8ae3-3fd4-800d-58165c3152cc",
        "012de1b9-8ae3-3fd4-800d-58665c3152dd",
        "012de1b9-8ae3-3fd4-800d-58123c3152cc",
      ]
    `);
  });
  test('Sort by station name, empty distances', () => {
    const distances = [];
    const result = sortAndOrderSignalDetections(
      signalDetectionsData,
      AnalystWorkspaceTypes.WaveformSortType.stationNameZA,
      distances
    );
    const sdIds = result.map(sd => sd.id);
    expect(sdIds).toMatchInlineSnapshot(`
      [
        "012de1b9-8ae3-3fd4-800d-58665c3152cc",
        "012de1b9-8ae3-3fd4-800d-58165c3152cc",
        "012de1b9-8ae3-3fd4-800d-58123c3152cc",
        "012de1b9-8ae3-3fd4-800d-58665c3152dd",
      ]
    `);
  });
});

describe('export data', () => {
  describe('exportChannelSegmentsBySelectedStations', () => {
    const stationList = [
      'ASAR.A',
      'ASAR.B',
      'ASAR.C',
      'BSAR.A',
      'BSAR.B',
      'BSAR.C',
      'CSAR.A',
      'CSAR.B',
      'CSAR.C'
    ];

    const channelFilters: Record<string, FilterTypes.Filter> = {
      ASAR: {
        withinHotKeyCycle: false,
        filterDefinition: linearFilterDefinition
      }
    };

    it('exists', () => {
      expect(exportChannelSegmentsBySelectedStations).toBeDefined();
    });

    it('attempts to export the data given via file download', async () => {
      const mockedCreateElement = {
        click: jest.fn(),
        href: '',
        setAttribute: jest.fn(),
        remove: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockImplementation(() => mockedCreateElement as never);
      // Unfiltered
      const customUiChannelSegmentRecord = buildUiChannelSegmentRecordFromList(stationList);

      await exportChannelSegmentsBySelectedStations(
        'ASAR',
        ['ASAR', 'BSAR'],
        channelFilters,
        customUiChannelSegmentRecord
      );
      expect(mockedCreateElement.click).toHaveBeenCalledTimes(1);
    });

    it('does not fail with empty data', () => {
      const result = getUIChannelSegmentsBySelectedStations('', [], {}, channelFilters);
      expect(result).toMatchObject([]);
    });

    it('returns all UIChannelSegments if no filter is given', () => {
      const customUiChannelSegmentRecord = buildUiChannelSegmentRecordFromList(stationList);
      const result = getUIChannelSegmentsBySelectedStations(
        '',
        [],
        customUiChannelSegmentRecord,
        channelFilters
      );
      expect(result).toHaveLength(9);
    });

    it('returns only the filtered UIChannelSegments', () => {
      const customUiChannelSegmentRecord = buildUiChannelSegmentRecordFromList(stationList);
      const result = getUIChannelSegmentsBySelectedStations(
        'ASAR',
        ['ASAR'],
        customUiChannelSegmentRecord,
        channelFilters
      );
      expect(result).toHaveLength(3);
      expect(result[0].channelSegment.id.channel.name).toMatch(/ASAR.+/);
      expect(result[1].channelSegment.id.channel.name).toMatch(/ASAR.+/);
      expect(result[2].channelSegment.id.channel.name).toMatch(/ASAR.+/);
    });

    it('returns channel Segments when filter is unknown', () => {
      const customUiChannelSegmentRecord = buildUiChannelSegmentRecordFromList(stationList);
      const result = getUIChannelSegmentsBySelectedStations(
        '',
        [],
        customUiChannelSegmentRecord,
        {}
      );
      expect(result).toHaveLength(9);
      expect(result[0].channelSegment.id.channel.name).toMatch(/ASAR.+/);
      expect(result[1].channelSegment.id.channel.name).toMatch(/ASAR.+/);
      expect(result[2].channelSegment.id.channel.name).toMatch(/ASAR.+/);
    });

    it('attempts to export with exportChannelSegmentsBySelectedSignalDetections data given via file download', async () => {
      const mockedCreateElement = {
        click: jest.fn(),
        href: '',
        setAttribute: jest.fn(),
        remove: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockImplementation(() => mockedCreateElement as never);
      const customUiChannelSegmentRecord = buildUiChannelSegmentRecordFromList(stationList);

      await exportChannelSegmentsBySelectedSignalDetections(
        signalDetectionsData,
        customUiChannelSegmentRecord,
        {}
      );
      expect(mockedCreateElement.click).toHaveBeenCalledTimes(1);
    });

    it('get exported channel segments file name', () => {
      const customUiChannelSegmentRecord = buildUiChannelSegmentRecordFromList(stationList);
      const filterChannelSegmentRecord = customUiChannelSegmentRecord.ASAR;
      const stationChannelSegments = filterChannelSegmentRecord.Unfiltered;
      const result = getExportedChannelSegmentsFileName({
        channelSegments: stationChannelSegments,
        filterAssociations: []
      });
      expect(result).toMatch(
        'waveform-2021-11-10T00:16:44.000Z-to-2021-11-10T00:21:44.000Z-ASAR.A.json'
      );
    });

    it('by Signal Selection exists', () => {
      expect(exportChannelSegmentsBySelectedSignalDetections).toBeDefined();
    });
  });
});

describe('getSignalDetectionStatusColor', () => {
  it('is defined', () => {
    expect(getSignalDetectionStatusColor).toBeDefined();
  });

  it('returns associated to open event', () => {
    expect(
      getSignalDetectionStatusColor(
        SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED,
        defaultTheme
      )
    ).toBe(defaultTheme.colors.openEventSDColor);
  });

  it('returns associated to completed event', () => {
    expect(
      getSignalDetectionStatusColor(
        SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED,
        defaultTheme
      )
    ).toBe(defaultTheme.colors.completeEventSDColor);
  });

  it('returns associated to other event', () => {
    expect(
      getSignalDetectionStatusColor(
        SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED,
        defaultTheme
      )
    ).toBe(defaultTheme.colors.otherEventSDColor);
  });
});

describe('getSignalDetectionStatusString', () => {
  it('is defined', () => {
    expect(getSignalDetectionStatusString).toBeDefined();
  });

  it('returns associated to open event', () => {
    expect(
      getSignalDetectionStatusString(SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED)
    ).toBe('Associated to open event');
  });

  it('returns associated to completed event', () => {
    expect(
      getSignalDetectionStatusString(SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED)
    ).toBe('Associated to completed event');
  });

  it('returns associated to other event', () => {
    expect(
      getSignalDetectionStatusString(SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED)
    ).toBe('Associated to other event');
  });

  it('returns deleted', () => {
    expect(getSignalDetectionStatusString(SignalDetectionTypes.SignalDetectionStatus.DELETED)).toBe(
      'Deleted'
    );
  });

  it('returns unknown', () => {
    expect(getSignalDetectionStatusString(undefined)).toBe('Unknown');
  });
});
