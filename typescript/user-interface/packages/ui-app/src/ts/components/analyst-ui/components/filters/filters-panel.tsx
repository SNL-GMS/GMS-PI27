import type { FilterTypes } from '@gms/common-model';
import { nonIdealStateWithError, nonIdealStateWithNoSpinner } from '@gms/ui-core-components';
import { useGetFilterListsDefinitionQuery, useSelectedFilterList, useUiTheme } from '@gms/ui-state';
import type { SerializedError } from '@reduxjs/toolkit';
import * as React from 'react';

import { FilterListOrNonIdealState } from './filter-list';
import { FilterListPicker } from './filter-list-picker';
import { checkForUniqueness } from './filter-list-util';

export interface FilterListNonIdealStateProps extends React.PropsWithChildren<unknown> {
  error: string | SerializedError | undefined;
  filterLists: FilterTypes.FilterList[] | undefined;
}

/**
 * Either renders the children, or a non ideal state. If an error is provided, or if there
 * is not a current interval, renders the non ideal state.
 */
export const FilterListNonIdealState: React.FC<FilterListNonIdealStateProps> = ({
  children,
  error,
  filterLists
}: FilterListNonIdealStateProps) => {
  if (error) {
    return nonIdealStateWithError('Error', 'Problem loading filter lists');
  }
  if (filterLists == null || !filterLists || filterLists.length === 0) {
    return nonIdealStateWithNoSpinner(
      'No Filter List Data',
      'There is no filter list data available for this interval',
      'exclude-row'
    );
  }
  if (!checkForUniqueness(filterLists)) {
    return nonIdealStateWithError('Error', 'Duplicate filter list names found');
  }
  return children;
};

/**
 * Renders the filter list and filter list picker, or non ideal states.
 */
export function FiltersPanel() {
  const filterListQuery = useGetFilterListsDefinitionQuery();
  const selectedFilterList = useSelectedFilterList();
  const [uiTheme] = useUiTheme();

  return (
    <FilterListNonIdealState
      error={filterListQuery.error}
      filterLists={filterListQuery.data?.filterLists}
    >
      <FilterListPicker
        filterLists={filterListQuery.data?.filterLists}
        isLoading={filterListQuery.isLoading}
        selectedFilterList={selectedFilterList}
      />
      <FilterListOrNonIdealState
        // key controlled to rebuild if the theme or filter list changes
        key={`${selectedFilterList?.name}-${uiTheme.name}`}
        filterList={selectedFilterList}
      />
    </FilterListNonIdealState>
  );
}
