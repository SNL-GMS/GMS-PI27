import { ChannelSegmentTypes, FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';

import {
  calculateStartTimeForFk,
  createComputeFkInput
} from '../../../../../src/ts/app/api/data/fk/fk-utils';
import { defaultSpectraTemplate, getTestFkChannelSegment } from '../../../../__data__';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const azFm = SignalDetectionTypes.Util.findAzimuthFeatureMeasurement(
  signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements
);
const fkChannelSegment = getTestFkChannelSegment(signalDetectionsData[0]);

/**
 * Tests the ability to check if the peak trough is in warning
 */
describe('frequencyBandToString', () => {
  test('correctly creates frequency band string', () => {
    const band: FkTypes.FkFrequencyRange = {
      highFrequencyHz: 5,
      lowFrequencyHz: 1
    };
    const testString = '1 - 5 Hz';
    expect(FkTypes.Util.frequencyBandToString(band)).toEqual(testString);
  });
});

describe('Can retrieve FkData', () => {
  test('cs string', () => {
    const csString = azFm?.measuredChannelSegment?.id
      ? ChannelSegmentTypes.Util.createChannelSegmentString(azFm.measuredChannelSegment.id)
      : '';
    expect(csString).toBeDefined();
  });

  test('createComputeFkInput', () => {
    expect(
      createComputeFkInput(
        signalDetectionsData[3],
        fkChannelSegment.timeseries[0],
        defaultSpectraTemplate,
        false
      )
    ).toMatchSnapshot();
  });

  test('calculateStartTimeForFk', () => {
    let startTime = 130;
    const arrivalTime = 120;
    const leadTime = 1;
    const stepSize = 2;
    expect(() => {
      calculateStartTimeForFk(startTime, arrivalTime, leadTime, stepSize);
    }).toThrow();
    startTime = 100;
    expect(
      calculateStartTimeForFk(startTime, arrivalTime, leadTime, stepSize)
    ).toMatchInlineSnapshot(`101`);
  });
});
