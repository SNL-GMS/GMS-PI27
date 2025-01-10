import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';

import {
  getWorkingSignalDetectionHypothesis,
  hasWorkingSignalDetectionHypothesis
} from '../../../../../src/ts/app/api/data/signal-detection/get-working-signal-detection-hypothesis';

describe('get working signal detection hypothesis', () => {
  it('exists', () => {
    expect(hasWorkingSignalDetectionHypothesis).toBeDefined();
    expect(getWorkingSignalDetectionHypothesis).toBeDefined();
  });

  it('has working signal detection hypothesis', () => {
    expect(hasWorkingSignalDetectionHypothesis(signalDetectionsData[0])).toBeFalsy();
    expect(
      hasWorkingSignalDetectionHypothesis({
        ...signalDetectionsData[0],
        _uiHasUnsavedChanges: 1
      })
    ).toBeTruthy();
  });

  it('get working event hypothesis', () => {
    expect(() => {
      getWorkingSignalDetectionHypothesis(signalDetectionsData[0]);
    }).toThrow();

    expect(() => {
      getWorkingSignalDetectionHypothesis({
        ...signalDetectionsData[0],
        signalDetectionHypotheses: [],
        _uiHasUnsavedChanges: 1
      });
    }).toThrow();

    expect(() => {
      getWorkingSignalDetectionHypothesis({
        ...signalDetectionsData[0],
        _uiHasUnsavedChanges: 1
      });
    }).not.toThrow();

    expect(
      getWorkingSignalDetectionHypothesis({
        ...signalDetectionsData[0],
        _uiHasUnsavedChanges: 1
      })
    ).toEqual(signalDetectionsData[0].signalDetectionHypotheses[0]);
  });
});
