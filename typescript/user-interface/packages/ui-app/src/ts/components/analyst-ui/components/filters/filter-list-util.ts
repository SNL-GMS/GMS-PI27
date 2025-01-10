import type { FilterTypes } from '@gms/common-model';
import { getDuplicates, isUnique } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';

const logger = UILogger.create('FILTER_LIST_LOGGER', process.env.GMS_FILTER_LIST_LOGGER);

/**
 * Checks filter lists for uniqueness, and @throws if filters with duplicate names are found
 */
export const checkForUniqueness = (filterLists: FilterTypes.FilterList[]): boolean => {
  if (filterLists && !isUnique(filterLists?.map(fl => fl.name))) {
    const duplicates = getDuplicates(filterLists.map(fl => fl.name)).reduce(
      (str: string, n: string) => (str.length > 0 ? `${str}, ${n}` : n),
      ''
    );
    logger.error(`Filter list names must be unique. Duplicate name(s) found: ${duplicates}`);
    return false;
  }
  return true;
};

/**
 * Sets focus to filters display
 */
export function setFocusToFiltersDisplay(): void {
  const filtersListContainer = document.getElementsByClassName(
    'filter-list__container filter-list__container--scrollable'
  );
  const filtersListContainerElement = filtersListContainer[0] as HTMLElement;
  filtersListContainerElement?.focus();
}
