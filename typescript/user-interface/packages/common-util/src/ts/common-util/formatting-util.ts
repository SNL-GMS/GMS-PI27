import { ValueType } from '../types/value-type';

/**
 * Rounds a number to the nearest specified decimal place; defaults to the nearest integer.
 *
 * @param value - the value to round
 * @param decimal - number of decimal spaces to round to; default is 0 which means it
 * rounds to the nearest integer
 *
 */
export const roundNumber = (value: number, decimal = 0): number => {
  const roundingHelper = 10;
  if (decimal < 0) {
    throw new Error(`Invalid decimal place provided for rounding`);
  }
  return Math.round((value * roundingHelper ** decimal) / roundingHelper ** decimal);
};

/**
 * Takes a number and sets it to a fixed precision,
 * also adds commas to delineate thousands places e.g. 1000 => 1,000
 *
 * @param value a value to be fixed
 * @param precision optional precision, default is based on config
 *
 * @returns a string
 */
export function setDecimalPrecision(value: number | undefined, precision = 2): string {
  if (value === undefined || value === null) return '';
  if (value.toFixed === undefined) {
    return '';
  }
  if (value === 0) {
    return `0.${'0'.repeat(precision)}`;
  }
  return value.toLocaleString('en-US', {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision
  });
}

/**
 * Truncates a number to a certain decimal precision
 *
 * @param value
 * @param precision
 */
export const setDecimalPrecisionAsNumber = (
  value: number | undefined | null,
  precision = 2
): number | undefined => {
  if (value === undefined || value === null || value.toFixed === undefined) return undefined;
  return parseFloat(value.toFixed(precision));
};

/**
 * Capitalizes the first character of each word
 *
 * @param input string input
 */
export function capitalizeFirstLetters(input: string): string {
  const words = input.split(' ');
  let newString = '';
  words.forEach(word => {
    if (word.length > 0) {
      const newWord = word[0].toUpperCase() + word.slice(1);
      newString += `${newWord} `;
    }
  });
  return newString.trim();
}

/**
 * Nicely capitalizes and removes _ from enums
 *
 * @param enumAsString string to prettify
 * @param stripFirstPart strips first part of enum IE (ENV_CLOCK_SLOW would be Clock Slow)
 *
 * @returns prettified string of enum
 */
export const prettifyAllCapsEnumType = (
  enumAsString: string | undefined,
  stripFirstPart = false
): string | undefined => {
  if (enumAsString) {
    const asString: string = enumAsString;
    const regex = /_/g;
    const withoutUnderscores = asString.replace(regex, ' ');
    let stringArray: string[];
    if (stripFirstPart) {
      [, ...stringArray] = withoutUnderscores.toLowerCase().split(' ');
    } else {
      stringArray = withoutUnderscores.toLowerCase().split(' ');
    }
    return stringArray.map(s => String(s.charAt(0).toUpperCase()) + s.substring(1)).join(' ');
  }
  return undefined;
};

/**
 * Strips out everything up to the first occurrence of the `pattern` and removes first
 * occurrence of the pattern.
 *
 * @param str the string to strip
 * @param pattern the pattern to search for
 * @returns the stripped string
 */
export const stripOutFirstOccurrence = (str: string, pattern = '.'): string => {
  if (str && pattern) {
    if (str.includes(pattern)) {
      const [, ...channelNames] = str.split('.');
      return channelNames.join(pattern);
    }
  }
  return str;
};

/**
 * Determines Precision by type
 *
 * @param value the value
 * @param valueType value type
 * @param returnAsString determines return type
 * @returns a precision value as a string or number based on returnAsString
 */
export const determinePrecisionByType = (
  value: number | undefined,
  valueType: ValueType | undefined,
  returnAsString = false
): string | number | undefined => {
  if (!value) {
    return undefined;
  }
  switch (valueType) {
    case ValueType.PERCENTAGE:
      return returnAsString ? setDecimalPrecision(value, 2) : setDecimalPrecisionAsNumber(value, 2);
    case ValueType.INTEGER:
      return returnAsString ? setDecimalPrecision(value, 0) : setDecimalPrecisionAsNumber(value, 0);
    case ValueType.FLOAT:
      return returnAsString ? setDecimalPrecision(value, 2) : setDecimalPrecisionAsNumber(value, 2);
    default:
      return returnAsString ? setDecimalPrecision(value) : setDecimalPrecisionAsNumber(value);
  }
};
