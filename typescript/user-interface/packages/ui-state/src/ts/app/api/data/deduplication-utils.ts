import type { FacetedTypes } from '@gms/common-model';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import { uniqSortEntityOrVersionReference } from '@gms/common-model/lib/faceted';
import { determineExcludedRanges, isArray, uniqSortStrings } from '@gms/common-util';
import difference from 'lodash/difference';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import sortedUniq from 'lodash/sortedUniq';

import type { AsyncFetchHistoryEntry } from '../../query';

type VersionReferenceOrEntityReferenceOrString =
  | FacetedTypes.VersionReference<'name'>
  | FacetedTypes.EntityReference<'name'>
  | string;

/**
 * Array Type guard for {@link VersionReferenceOrEntityReferenceOrString}
 */
function isStringArray(array: VersionReferenceOrEntityReferenceOrString[]): array is string[] {
  return !!array && Array.isArray(array) && array.every(element => typeof element === 'string');
}

/**
 * Type guard for {@link VersionReferenceOrEntityReferenceOrString}
 */
function isVersionOrEntityReference(
  object: VersionReferenceOrEntityReferenceOrString
): object is FacetedTypes.VersionReference<'name'> | FacetedTypes.EntityReference<'name'> {
  if (!object) return false;
  return typeof object !== 'string' && Object.hasOwn(object, 'name');
}

/**
 * Array Type guard for {@link VersionReferenceOrEntityReferenceOrString}
 */
function isVersionOrEntityReferenceArray(
  array: VersionReferenceOrEntityReferenceOrString[]
): array is (FacetedTypes.VersionReference<'name'> | FacetedTypes.EntityReference<'name'>)[] {
  return (
    !!array && Array.isArray(array) && array.every(element => isVersionOrEntityReference(element))
  );
}

/**
 * Helper function that accepts a type {@link T1} that is a {@link FacetedTypes.VersionReference},
 * {@link FacetedTypes.EntityReference}, or a string and returns the a string value.
 *
 * @param value the value to retrieve its string value representation
 */
function getStringValue<T1 extends VersionReferenceOrEntityReferenceOrString>(value: T1): string {
  return isVersionOrEntityReference(value) ? value.name : value;
}

/**
 * Utility function used to determine missing pairs (e.g. stations/phases or channels/phases pairs) have
 * not been queried for previously based on the history.
 *
 * @param args the query arguments which include the keys {@link key1} and {@link key2}
 * @param history the query history of type {@link Args}
 * @param key1 the unique key string for looking up the first collection
 * @param key2 the unique key string for looking up the second collection
 * @returns the missing pairs (not included in the history)
 */
export function determineMissingPairs<
  Args extends object,
  T1 extends VersionReferenceOrEntityReferenceOrString = string
>(
  args: Args,
  history: AsyncFetchHistoryEntry<Args>[],
  key1: keyof Args & string,
  key2: keyof Args & string
): [T1[], string[]] {
  if (key1 == null || key2 == null) {
    throw new Error(`Invalid keys provided, both must be defined (${key1} ${key2})`);
  }

  if (args == null || !Object.hasOwn(args, key1) || !Object.hasOwn(args, key2)) {
    throw new Error(
      `Invalid args provided, must be defined and contain the keys (${key1} ${key2})`
    );
  }

  if (!isArray(args[key1]) || !isArray(args[key2])) {
    throw new Error(`Invalid args provided, the keys (${key1} ${key2}) must reference collections`);
  }

  const entries1: T1[] = [];
  const entries2: string[] = [];

  // flatten the possible faceted objects for an easier compare
  const requests = history.map(request => ({
    [key1]: (request.arg[key1] as T1[]).map<string>(s => getStringValue(s)),
    [key2]: request.arg[key2] as string[]
  }));

  const collection1: T1[] = args[String(key1)];
  const collection2: string[] = args[String(key2)];

  // filter out the arguments based on the history to avoid over fetching data
  collection1.forEach(entry => {
    const existingEntryPairs = flatMap(
      requests.map(request => (includes(request[key1], getStringValue(entry)) ? request[key2] : []))
    );

    const missingEntryPairs = difference(collection2, existingEntryPairs);
    if (!isEmpty(missingEntryPairs)) {
      entries1.push(entry);
      entries2.push(...missingEntryPairs);
    }
  });

  if (isStringArray(entries1)) {
    return [uniqSortStrings(entries1) as T1[], uniqSortStrings(entries2)];
  }

  if (isVersionOrEntityReferenceArray(entries1)) {
    return [uniqSortEntityOrVersionReference(entries1) as T1[], uniqSortStrings(entries2)];
  }

  return [sortedUniq(sortBy(entries1)), uniqSortStrings(entries2)];
}

/**
 * Utility function used to determine what time range and channels have
 * not been queried for previously based on the history.
 *
 * @param args a query arg object containing channels, startTime, and endTime
 * @param history the query history of type {@link Args}
 * @returns the channels that have missing data and appropriate new start and end time
 */
export function determineChannelsTimeRangeRequest<
  Args extends {
    channels: VersionReference<'name'>[];
    startTime: number;
    endTime: number;
  }
>(args: Args, entries: AsyncFetchHistoryEntry<Args>[]): Args {
  const channels: VersionReference<'name'>[] = [];
  let startTime = -Infinity;
  let endTime = Infinity;

  args.channels.forEach(channel => {
    const ranges = determineExcludedRanges(
      entries
        .filter(
          h =>
            h.arg.channels.findIndex(
              c => c.name === channel.name && c.effectiveAt === channel.effectiveAt
            ) !== -1
        )
        .map(v => ({
          start: v.arg.startTime,
          end: v.arg.endTime
        })),
      { start: args.startTime, end: args.endTime }
    );

    if (ranges.length > 0) {
      const newStartTime = Math.min(...ranges.map(r => r.start));
      if (startTime === undefined || startTime === -Infinity || newStartTime < startTime)
        startTime = newStartTime;
      const newEndTime = Math.max(...ranges.map(r => r.end));
      if (endTime === undefined || endTime === Infinity || newEndTime > endTime)
        endTime = newEndTime;
      channels.push(channel);
    }
  });

  return {
    ...args,
    startTime,
    endTime,
    channels
  };
}
