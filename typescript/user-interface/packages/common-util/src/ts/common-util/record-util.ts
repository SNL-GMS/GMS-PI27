import every from 'lodash/every';
import isEmpty from 'lodash/isEmpty';
import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';

/**
 * Return number of entries in the Record if undefined returns 0
 *
 * @param record Record
 * @returns number of entries
 */
export function recordLength(
  record: Record<string | number | symbol, unknown> | null | undefined
): number {
  if (
    !record ||
    record === null ||
    isUndefined(isEmpty(record)) ||
    isNull(isEmpty(record)) ||
    isEmpty(record)
  ) {
    return 0;
  }
  return Object.keys(record).length;
}

/**
 * Type-guard that checks an object to see if it has only string or number keys (serializable).
 * Note that a record can have Symbols as keys, too. If they were present here,
 * this would return false.
 *
 * @param obj an object to check
 * @returns true if the record has only string/number keys
 */
export function recordHasStringOrNumberKeys<T extends 'string' | 'number'>(
  obj: any
): obj is Record<T, unknown> {
  return (
    typeof obj === 'object' &&
    every(Object.keys(obj), k => typeof k === 'string' || typeof k === 'number')
  );
}

/**
 * Object string params are ordered according to insertion order. This function ensures that
 * they will be ordered alphabetically, which can be useful in cases such as when the user
 * is expecting a specific order, such as in JSON that is desired in a specific order.
 *
 * @param record a record with string keys, to be sorted
 * @returns a matching record with the params added in alphabetical order by key
 */
export function sortRecordByKeys<T extends Record<string | number, unknown>>(record: T): T {
  const paramNames = Object.keys(record).sort();
  if (!recordHasStringOrNumberKeys(record)) {
    throw new Error(
      'Invalid input: sortRecordByKeys requires an object that only contains strings or numbers as keys'
    );
  }
  return (paramNames as (keyof T)[]).reduce<T>((sortedRecord: T, k: keyof T): T => {
    let val = record[k];

    if (typeof val === 'object' && !Array.isArray(val) && recordHasStringOrNumberKeys(val)) {
      val = sortRecordByKeys(val);
    }
    // Since we're building the record with the new object, this is safe.
    // eslint-disable-next-line no-param-reassign
    sortedRecord[k] = val;
    return sortedRecord;
  }, {} as T);
}
