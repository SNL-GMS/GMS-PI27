/**
 * Permission is granted to copy, distribute and/or modify this document
 * under the terms of the GNU Free Documentation License, Version 1.3
 * or any later version published by the Free Software Foundation;
 * with no Invariant Sections, no Front-Cover Texts, and no Back-Cover Texts.
 * A copy of the license is included in the file entitled "gnu-fdl-1.3.txt".
 */

import { FULL_CIRCLE_DEGREES, HALF_CIRCLE_DEGREES, toRadians } from '../unit-util';

/**
 * Calculate an average (mean) angle, in degrees
 *
 * @param anglesInDegrees An array of angles in degrees for which to calculate the mean
 * @returns the mean angle of the set of angles given, in degrees
 */
export function meanAngleDegrees(anglesInDegrees: number[]) {
  return (
    ((HALF_CIRCLE_DEGREES / Math.PI) *
      Math.atan2(
        anglesInDegrees
          .map(toRadians)
          .map(Math.sin)
          .reduce((sum, val) => sum + val, 0) / anglesInDegrees.length,
        anglesInDegrees
          .map(toRadians)
          .map(Math.cos)
          .reduce((sum, val) => sum + val, 0) / anglesInDegrees.length
      ) +
      FULL_CIRCLE_DEGREES) %
    FULL_CIRCLE_DEGREES
  );
}
