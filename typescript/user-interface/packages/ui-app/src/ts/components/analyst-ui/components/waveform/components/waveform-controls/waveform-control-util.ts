/** Allow arbitrary decimal precision */
export const isValidNumberRegex = /^-?((\d+(\.\d{0,12})?)|(\.\d+))$/;

export const isInvalidNumberInput = (val: string) => {
  return !isValidNumberRegex.test(val);
};
