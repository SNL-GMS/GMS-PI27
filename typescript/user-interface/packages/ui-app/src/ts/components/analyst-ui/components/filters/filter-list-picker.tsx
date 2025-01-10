import { Alignment, Button, H6, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import type { FilterTypes } from '@gms/common-model';
import { useSetFilterList } from '@gms/ui-state';
import React from 'react';

import { FilterListPickerEntry } from './filter-list-picker-entry';

interface FilterListPickerProps {
  filterLists: FilterTypes.FilterList[];
  isLoading: boolean;
  selectedFilterList: FilterTypes.FilterList;
}

const FilterListSelect = Select.ofType<FilterTypes.FilterList>();

/**
 * A component that lets the user choose the filter list to use.
 */
export function FilterListPicker({
  filterLists,
  isLoading,
  selectedFilterList
}: FilterListPickerProps) {
  const setFilterList = useSetFilterList();
  const filterListRenderer = (item: FilterTypes.FilterList, itemRenderer) => (
    <FilterListPickerEntry
      key={item.name}
      filterList={item}
      modifiers={itemRenderer.modifiers}
      handleClick={itemRenderer.handleClick}
      handleFocus={itemRenderer.handleFocus}
    />
  );
  return (
    <section className="filter-list__container filter-list-picker__container">
      <H6 className="filter-list__header">Filter List</H6>
      <FilterListSelect
        fill
        items={filterLists}
        itemPredicate={(query: string, item: FilterTypes.FilterList) =>
          item.name.toLowerCase().includes(query.toLowerCase())
        }
        itemRenderer={filterListRenderer}
        noResults={<MenuItem disabled text="No results." />}
        onItemSelect={(item: FilterTypes.FilterList) => {
          setFilterList(item);
        }}
        inputProps={{ placeholder: 'Search...' }}
        popoverProps={{ matchTargetWidth: true, minimal: true }}
        resetOnClose
        resetOnQuery
        resetOnSelect
      >
        <Button
          alignText={Alignment.LEFT}
          large
          fill
          rightIcon="double-caret-vertical"
          tabIndex={-1}
          loading={isLoading}
          disabled={filterLists == null}
          text={selectedFilterList?.name ?? 'Select a filter list'}
        />
      </FilterListSelect>
    </section>
  );
}
