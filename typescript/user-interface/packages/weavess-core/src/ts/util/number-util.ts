/**
 * calculate the number of digits (base 10)
 *
 * @param n the number for which to calculate the number of digits
 * @returns the number of digits in n
 */
// eslint-disable-next-line no-bitwise
export const calcNumDigits = (n: number) => (Math.log(Math.round(n)) * Math.LOG10E + 1) | 0;
