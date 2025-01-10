import sortBy from 'lodash/sortBy';
import sortedUniqBy from 'lodash/sortedUniqBy';

import type { EntityReference, Faceted, VersionReference } from './types';

/**
 * Sorts and ensures uniqueness for a collection of {@link EntityReference}s or {@link VersionReference}s.
 *
 * @return returns the new sorted collection with unique entires
 */
export function uniqSortEntityOrVersionReference<
  Type extends EntityReference<'name'> | VersionReference<'name'>
>(stations: Type[]): Type[] {
  return sortedUniqBy(
    sortBy(
      stations,
      s => s.name,
      s => ('effectiveAt' in s ? s.effectiveAt : undefined)
    ),
    s => s.name
  );
}

/**
 * Converts an objected that extends Faceted into a version reference
 *
 * @param value the object to be converted
 * @param key The faceting key of the object
 * @returns a version reference containing only the requested key and the effectiveAt field
 */
export function convertToVersionReference<
  K extends Exclude<keyof T, 'effectiveAt'>,
  T extends Faceted
>(value: T, key: K): VersionReference<K, T> {
  return { [key]: value[key], effectiveAt: value.effectiveAt } as VersionReference<K, T>;
}

/**
 * Converts an objected that extends Faceted into a entity reference
 *
 * @param value the object to be converted
 * @param key The faceting key of the object
 * @returns a entity reference containing only the requested key
 */
export function convertToEntityReference<K extends keyof T, T extends Faceted>(
  value: T,
  key: K
): EntityReference<K, T> {
  return { [key]: value[key] } as EntityReference<K, T>;
}

/**
 * Checks to see if an object is faceted by version (key and effective time),
 * which is true if and only if the object has the expected key and effective time,
 * and nothing else;
 *
 * @param value the object to check if it is faceted by reference
 * @param key the key to check for faceting on
 */
export const isVersionReference = <K extends Exclude<keyof T, 'effectiveAt'>, T extends Faceted>(
  value: T,
  key: K
): boolean =>
  Object.keys(value).length === 2 &&
  Object.keys(value).includes(key as string) &&
  Object.keys(value).includes('effectiveAt');

/**
 * Checks to see if an object is faceted by entity (key),
 * which is true if and only if the object has the expected key and nothing else;
 *
 * @param value the object to check if it is faceted by reference
 * @param key the key to check for faceting on
 */
export const isEntityReference = <K extends Exclude<keyof T, 'effectiveAt'>, T extends Faceted>(
  value: T,
  key: K
): boolean => Object.keys(value).length === 1 && Object.keys(value)[0] === key;

/**
 * helper function to check if a pair version references or object and version reference are the same reference
 *
 * @param value1
 * @param value2
 * @param key
 * @returns
 */
export const compareVersionReference = <
  K extends Exclude<keyof T, 'effectiveAt'>,
  T extends Faceted
>(
  value1: T,
  value2: T,
  key: K
): boolean => value1[key] === value2[key] && value1.effectiveAt === value2.effectiveAt;

/**
 * Check to see if an object is fully populated
 * which is true if the object has the expected faceting key, effectiveAt, and any other properties
 *
 * @param value the object to check if it is fully populated
 * @param key the key to check for faceting on
 * @returns whether the object is a fully populated object
 */
export const isFullyPopulated = <K extends Exclude<keyof T, 'effectiveAt'>, T extends Faceted>(
  value: T,
  key: K
): boolean =>
  Object.keys(value).length > 2 &&
  Object.keys(value).includes(key as string) &&
  Object.keys(value).includes('effectiveAt');
