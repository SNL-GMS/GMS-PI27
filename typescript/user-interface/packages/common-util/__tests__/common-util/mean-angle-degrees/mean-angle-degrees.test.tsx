/* eslint-disable @typescript-eslint/no-magic-numbers */
import { meanAngleDegrees } from '../../../src/ts/common-util';

describe('Mean angle degrees', () => {
  it('Computes the mean without wrapping', () => {
    expect(meanAngleDegrees([-1, -2, -3])).toBe(358);
    expect(meanAngleDegrees([1, 2, 3])).toBe(2);
    expect(meanAngleDegrees([1, 2])).toBe(1.5);
    expect(meanAngleDegrees([1, 1.5])).toBe(1.25);
  });
  it('Computes the mean over 180', () => {
    expect(meanAngleDegrees([180, 190, 200])).toBe(190);
  });
  it('Computes the mean angle with wrapping', () => {
    // expect "close to" because trig functions are not perfect in floating point arithmetic
    expect(meanAngleDegrees([359, 1])).toBeCloseTo(0);
    expect(meanAngleDegrees([358, 0])).toBeCloseTo(359);
    expect(meanAngleDegrees([359, 0.5])).toBeCloseTo(359.75);
  });
});
