/**
 * Get the actual computed width of an element, in pixels, as a number.
 *
 * @param element an HTML element from which to get the computed size
 * @returns the computed width, as a number
 */
export function getComputedWidthPx(element: HTMLElement) {
  const widthUsedValue = window.getComputedStyle(element).width;
  return Number.parseFloat(widthUsedValue.slice(0, widthUsedValue.length - 2)); // the last two characters are always `px`
}

/**
 * Get the actual computed height of an element, in pixels, as a number.
 *
 * @param element an HTML element from which to get the computed size
 * @returns the computed height, as a number
 */
export function getComputedHeightPx(element: HTMLElement) {
  const widthUsedValue = window.getComputedStyle(element).width;
  return Number.parseFloat(widthUsedValue.slice(0, widthUsedValue.length - 2)); // the last two characters are always `px`
}
