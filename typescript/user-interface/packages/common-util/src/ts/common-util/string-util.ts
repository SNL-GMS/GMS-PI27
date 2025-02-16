import isEqual from 'lodash/isEqual';
import join from 'lodash/join';
import sortBy from 'lodash/sortBy';
import sortedUniq from 'lodash/sortedUniq';

import { setDecimalPrecision } from './formatting-util';

export const uniqueNumberFromString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    /* eslint-disable no-bitwise */
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // to 32bit integer
    /* eslint-enable no-bitwise */
  }
  return Math.abs(hash);
};

/**
 * Returns a new string that has been converted to sentence case
 *
 * @param s the string on which to operate
 */
export const toSentenceCase = (s: string): string => {
  if (s.length <= 0) return '';
  if (s.length === 1) return s.charAt(0).toUpperCase();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

/**
 * Convert string like enums to human readable (example HI_ALL => Hi All)
 *
 * @param input
 * @returns readable string
 */
export const humanReadable = (input: string): string => {
  const breakItUp: string[] = input.split('_');
  return join(
    breakItUp.map(entry => {
      const lowerCase = entry.toLowerCase();
      return `${lowerCase[0].toUpperCase()}${lowerCase.substring(1, lowerCase.length)}`;
    }),
    ' '
  );
};

/**
 * Creates an array containing each substring, split along any matched whitespace.
 *
 * @param input the string on which to operate
 * @param pattern the string or RegExp to split the input by. Defaults to split on whitespace.
 * @returns an array of strings
 */
export const splitStringByPattern = (input: string, pattern: string | RegExp = /(\s+)/): string[] =>
  input
    .split(pattern)
    .map(w => w.trim())
    .filter(w => w.length > 0);

/**
 * Checks if at least one tag from a list is matched by a word
 *
 * @param tags A list of tags to search
 * @param searchWord a word to search for in the tags
 */
export const oneTagMatches = (tags: string[], searchWord: string): boolean =>
  tags.reduce<boolean>(
    (tagMatches: boolean, tag: string) => tagMatches || tag?.toLowerCase().includes(searchWord),
    false
  );

/**
 * Checks if all of the words in the search string match one or more tags
 *
 * @param tags the list of tags
 * @param term the search string (including spaces)
 */
export const doTagsMatch = (tags: string[] | undefined, term: string): boolean => {
  if (tags == null) {
    return false;
  }
  const words = splitStringByPattern(term);
  return words.reduce<boolean>(
    (matches: boolean, word: string) => matches && oneTagMatches(tags, word),
    true
  );
};

/**
 * Compare two lists of string (this could be slow for large list and may need optimization)
 *
 * @param firstStrings first set of strings to compare
 * @param secondStrings second set of strings to compare
 * @returns whether they are the same, irrespective of order
 */
export const areListsSame = (firstStrings: string[], secondStrings: string[]): boolean => {
  const sortedNewStrings = sortBy(firstStrings);
  const sortedOldStrings = sortBy(secondStrings);
  return isEqual(sortedNewStrings, sortedOldStrings);
};

/**
 * This function determines if the string passed in contains a value that should be treated as a
 * right-aligned numeric cell on the station properties table
 * EX: "2534"                 true
 * EX: "2007-12-23"           false
 * EX: "2007-12-23 09:23:23"  false
 * EX: "-123.93"              true
 * EX: "obviously false"      false
 *
 * @param testSubject: the string or cell data to be evaluated
 */
export function isNumeric(testSubject: string): boolean {
  if (!testSubject) return false;
  return !Number.isNaN(Number(testSubject)); // parseFloat returns NaN if it cannot parse the string into a number
}

/**
 * This function determines if the string passed in contains a value that should be treated as a
 * date string.
 *
 * @param str a string to test
 * @returns whether the string can be parsed into a date
 */
export function isDate(str: string | undefined): boolean {
  if (!str) {
    return false;
  }
  return !Number.isNaN(Date.parse(str));
}

/**
 * If the input string @param value is undefined, empty, or null, returns @param defaultValue
 * If no defaultValue is passed, defaults to 'Unknown'
 */
export function defaultTo(value: string | undefined | null, defaultValue = 'Unknown'): string {
  if (value === undefined || value === null || value.length === 0) {
    return defaultValue;
  }
  return value;
}

/**
 * Appends and shows uncertainty with ± if exists
 *
 * @param value value in desired string format
 * @param uncertainty value of uncertainty
 * @returns string
 */
export const appendUncertainty = (value: string, uncertainty: number | undefined) => {
  if (uncertainty) {
    return `${value} ± ${setDecimalPrecision(uncertainty, 3)}`;
  }
  return value;
};

/**
 * Appends and shows uncertainty with ± if exists
 *
 * @param value value in desired string format
 * @param uncertainty value of uncertainty
 * @returns string
 */
export const appendUncertaintyForTime = (value: string, uncertainty: number | undefined) => {
  if (uncertainty) {
    return `${value} ± ${setDecimalPrecision(uncertainty, 3)}s`;
  }
  return value;
};

/**
 * Sorts and ensures uniqueness for a collection of strings
 *
 * @return returns the new sorted collection with unique entires
 */
export const uniqSortStrings = (value: string[]) => sortedUniq(sortBy(value));

/**
 * Formats a list of strings to a human readable comma separated list
 * Ex. ['apple', 'orange', 'grape'] becomes 'apple, orange, and grape'
 * @param strArray
 * @returns
 */
export const stringArrayToFormattedString = (strArray: string[]) => {
  if (strArray.length > 2) {
    return `${strArray.slice(0, -1).join(', ')}, and ${strArray[strArray.length - 1]}`;
  }
  if (strArray.length === 2) {
    return strArray.join(' and ');
  }
  return strArray.join('');
};
