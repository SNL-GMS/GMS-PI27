import { Button, MenuItem } from '@blueprintjs/core';
import type { ItemPredicate, ItemRenderer } from '@blueprintjs/select';
import { Select } from '@blueprintjs/select';
import type { FilterTypes } from '@gms/common-model';
import { getFilterName } from '@gms/common-model/lib/filter/filter-util';
import { useSelectedFilterList } from '@gms/ui-state';
import React from 'react';

const filterPredicate: ItemPredicate<FilterTypes.Filter> = (query, filter, _index, exactMatch) => {
  const normalizedTitle = getFilterName(filter).toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  }
  return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
};

const renderFilter: ItemRenderer<FilterTypes.Filter> = (
  filter,
  { handleClick, handleFocus, modifiers }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={getFilterName(filter)}
      onClick={handleClick}
      onFocus={handleFocus}
      roleStructure="listoption"
      text={getFilterName(filter)}
    />
  );
};

/**
 * The type of the props for the {@link ComponentName} component
 */
export interface FilterSelectorProps {
  selectedFilter: FilterTypes.Filter;
  setSelectedFilter: (filter: FilterTypes.Filter) => void;
  disabled?: boolean;
  fill?: boolean;
  matchTargetWidth?: boolean;
}

/**
 * A dropdown for selecting a filter
 */
export function FilterSelector({
  disabled,
  selectedFilter,
  setSelectedFilter,
  fill = true,
  matchTargetWidth = true
}: FilterSelectorProps) {
  const filterList = useSelectedFilterList();

  return (
    <Select<FilterTypes.Filter>
      items={filterList?.filters}
      itemPredicate={filterPredicate}
      itemRenderer={renderFilter}
      disabled={disabled}
      noResults={<MenuItem disabled text="No results." roleStructure="listoption" />}
      onItemSelect={setSelectedFilter}
      fill={fill}
      popoverProps={{ matchTargetWidth }}
    >
      <Button
        text={getFilterName(selectedFilter)}
        disabled={disabled}
        rightIcon="double-caret-vertical"
        placeholder="Select a prefilter"
        alignText="left"
        fill
      />
    </Select>
  );
}
