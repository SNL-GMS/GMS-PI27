/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Units } from '../../../src/ts/common/types';
import type { ResponseTypes } from '../../../src/ts/common-model';
import { CommonTypes } from '../../../src/ts/common-model';

export const responseData: ResponseTypes.Response = {
  id: '5dc3dce4-ae3c-3fb0-84ba-2f83fb5a89d2',
  effectiveAt: 1619199932477,
  effectiveUntil: 1619199932477,
  fapResponse: {
    id: 'df1203d8-0039-4e36-ab2a-dbb436d8e9ab',
    frequencies: [0.001],
    amplitudeResponseUnits: [Units.NANOMETERS_PER_COUNT],
    amplitudeResponse: [0.000014254],
    amplitudeResponseStdDev: [0],
    phaseResponseUnits: [Units.DEGREES],
    phaseResponse: [350.140599],
    phaseResponseStdDev: [0]
  },
  calibration: {
    calibrationPeriodSec: 14.5,
    calibrationTimeShift: 'PT2S',
    calibrationFactor: {
      value: 1.2,
      standardDeviation: 0.112,
      units: CommonTypes.Units.SECONDS
    }
  }
};
