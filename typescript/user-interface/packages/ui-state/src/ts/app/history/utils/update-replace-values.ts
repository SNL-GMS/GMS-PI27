import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isNull from 'lodash/isNull';
import isObject from 'lodash/isObject';
import isUndefined from 'lodash/isUndefined';
import mergeWith from 'lodash/mergeWith';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';

/**
 * Combines the keys from two objects.
 * Removes any duplicates and sorts.
 *
 * @param objs the objects use for combining keys
 * @returns a string list of all the unique non-empty keys
 */
export const combineKeys = <T extends object>(...objs: T[]): string[] => {
  return sortBy(
    uniq(
      flatMap(
        objs.map(obj =>
          Object.keys(obj != null ? obj : []).filter(
            k => !isEmpty(obj[k]) && !isNull(obj[k]) && !isUndefined(obj[k])
          )
        )
      )
    )
  );
};

/**
 * Removes any keys that no longer exist in the replacement object.
 * ! modifies original in place
 *
 * @param original the original object to update
 * @param replacement the the replacement object to use to replace the values of original
 */
const removeKeys = (original: unknown, replacement: unknown) => {
  if (
    (isObject(original) && isObject(replacement)) ||
    (isArray(original) && isArray(replacement))
  ) {
    const bKeys = combineKeys({}, replacement);
    const combinedKeys = combineKeys(original, replacement);
    if (!isEqual(bKeys, combinedKeys)) {
      combinedKeys.forEach(k => {
        if (!includes(bKeys, k)) {
          delete original[k];
        }
      });
    }
  }
};

/**
 * A custom replace function to work with lodash's mergeWith function.
 * ! modifies original in place
 *
 * Returns a callback with the following signature
 *
 * @param original the original object to update
 * @param replacement the the replacement object to use to replace the values of original
 * @returns the value to update with
 */
const replaceCustomizer = () => (original: unknown, replacement: unknown) => {
  if (isEmpty(replacement) || isNull(replacement) || isUndefined(replacement)) {
    return replacement;
  }

  if (isArray(original) && isArray(replacement)) {
    if (replacement.length < original.length) {
      return replacement;
    }
  }

  removeKeys(original, replacement);
  return undefined;
};

/**
 * Performs a deep replace; replacing original's values with replacement's values.
 * ! modifies original in place
 *
 * @param original the original object to update
 * @param replacement the the replacement object to use to replace the values of original
 */
export const updateReplaceValues = (original: unknown, replacement: unknown) => {
  if (!isEqual(original, replacement)) {
    removeKeys(original, replacement);
    mergeWith(original, replacement, replaceCustomizer());
  }
};
