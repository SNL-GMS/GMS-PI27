/**
 * Custom cell comparator for sorting
 */
export function dirtyDotCellComparator(valueA: boolean, valueB: boolean) {
  if (!valueA && valueB) return 1;
  if (valueA && !valueB) return -1;
  return 0;
}
