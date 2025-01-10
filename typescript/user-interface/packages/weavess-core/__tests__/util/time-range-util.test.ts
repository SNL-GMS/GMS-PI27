import type { TimeRange } from '../../src/ts/types/types';
import { doTimeRangesOverlap } from '../../src/ts/util';

const baseRange: TimeRange = {
  startTimeSecs: 10,
  endTimeSecs: 200
};

describe('Test time util', () => {
  test('doTimeRangesOverlap truthy', () => {
    expect(
      doTimeRangesOverlap(baseRange, {
        startTimeSecs: 20,
        endTimeSecs: 30
      })
    ).toBeTruthy();

    expect(
      doTimeRangesOverlap(baseRange, {
        startTimeSecs: 0,
        endTimeSecs: 300
      })
    ).toBeTruthy();

    expect(
      doTimeRangesOverlap(baseRange, {
        startTimeSecs: 150,
        endTimeSecs: 300
      })
    ).toBeTruthy();

    expect(
      doTimeRangesOverlap(baseRange, {
        startTimeSecs: 0,
        endTimeSecs: 200
      })
    ).toBeTruthy();
  });

  test('doTimeRangesOverlap falsy', () => {
    expect(
      doTimeRangesOverlap(baseRange, {
        startTimeSecs: 210,
        endTimeSecs: 211
      })
    ).toBeFalsy();

    expect(
      doTimeRangesOverlap(baseRange, {
        startTimeSecs: 0,
        endTimeSecs: 9
      })
    ).toBeFalsy();
  });
});
