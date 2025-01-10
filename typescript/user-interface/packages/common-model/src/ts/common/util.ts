import type { Nullable } from '../type-util/type-util';
import type { TimeRange } from './types';

/**
 * Assertion function that throws if value is nullish.
 *
 * @throws if value is nullish
 *
 * @param value a value to validate
 * @param errorMessage The error to throw if value is nullish
 * @param callback optional callback function to call before throwing the error. This may
 * be useful to toast, for example.
 */
export function validateNonNullish<T>(
  value: T | null | undefined,
  errorMessage: string,
  callback?: () => void
): asserts value is NonNullable<T> {
  if (value == null) {
    if (callback) callback();
    throw new Error(errorMessage);
  }
}

/**
 * Asserts that a {@link TimeRange} is NonNullable, and contains valid, numeric, non-null values
 *
 * @throws if timeRange is nullish
 * @throws if startTimeSecs or endTimeSecs are nullish
 * @throws if startTimeSecs or endTimeSecs are non numeric
 *
 * @param timeRange a TimeRange to check
 */
export function validateTimeRange(
  timeRange: Nullable<TimeRange> | null | undefined
): asserts timeRange is NonNullable<TimeRange> {
  validateNonNullish(
    timeRange,
    `Invalid TimeRange. TimeRange must be defined, but it is: ${timeRange}`
  );
  if (timeRange.startTimeSecs == null || timeRange.endTimeSecs == null) {
    throw new Error(`Invalid TimeRange: ${JSON.stringify(timeRange)}`);
  }
  if (typeof timeRange.startTimeSecs !== 'number' || typeof timeRange.endTimeSecs !== 'number') {
    throw new Error(`Invalid TimeRange. Values are not numeric: ${JSON.stringify(timeRange)}`);
  }
}
