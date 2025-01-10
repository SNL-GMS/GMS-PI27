/**
 * Find first element in an array that matches the predicate or throws an error
 */
export const findOrThrow = <T>(arr: T[], predicate: (value: T) => boolean): T => {
  const result = arr.find(predicate);
  if (result === undefined) {
    throw new Error('No matching element found');
  }
  return result;
};

/**
 * Retrieve the element of an array at the given index, or throw an error if not found.
 * @param index The zero-based index of the desired code unit. A negative index will count back from the last item.
 */
export const atOrThrow = <T>(arr: T[], index: number): T => {
  const result = arr.at(index);
  if (result === undefined) {
    throw new Error('No element found');
  }
  return result;
};

/**
 * used for Array.filter to remove any nulls or undefined
 * @param value value to check
 * @returns true if value is not empty false if empty
 */
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
