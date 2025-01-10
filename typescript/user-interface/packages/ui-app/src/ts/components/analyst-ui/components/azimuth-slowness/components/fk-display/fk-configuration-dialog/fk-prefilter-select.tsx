import { Button, MenuItem } from '@blueprintjs/core';
import type { ItemPredicate, ItemRenderer } from '@blueprintjs/select';
import { Select } from '@blueprintjs/select';
import type { FilterTypes } from '@gms/common-model';
import React from 'react';

/**
 * The type of the props for the {@link ComponentName} component
 */
export interface FkPrefilterSelectorProps {
  options: FilterTypes.Filter[];
  selectedFilter: FilterTypes.Filter | undefined;
  setSelectedFilter: (filter: FilterTypes.Filter) => void;
  disabled?: boolean;
  fill?: boolean;
  matchTargetWidth?: boolean;
}

const filterPredicate: ItemPredicate<FilterTypes.Filter> = (query, filter, _index, exactMatch) => {
  const normalizedTitle = filter?.filterDefinition?.name.toLowerCase();
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
      key={filter?.filterDefinition?.name}
      onClick={handleClick}
      onFocus={handleFocus}
      roleStructure="listoption"
      text={filter?.filterDefinition?.name}
    />
  );
};

/**
 * A dropdown for selecting a filter
 */
export function FkPrefilterSelector({
  disabled,
  options,
  selectedFilter,
  setSelectedFilter,
  fill = true,
  matchTargetWidth = true
}: FkPrefilterSelectorProps) {
  return (
    <Select<FilterTypes.Filter>
      items={options}
      itemPredicate={filterPredicate}
      itemRenderer={renderFilter}
      disabled={disabled}
      noResults={<MenuItem disabled text="No results." roleStructure="listoption" />}
      onItemSelect={setSelectedFilter}
      fill={fill}
      popoverProps={{ matchTargetWidth }}
    >
      <Button
        text={selectedFilter ? selectedFilter.filterDefinition?.name : 'Custom'}
        disabled={disabled}
        rightIcon="double-caret-vertical"
        placeholder="Select a prefilter"
        alignText="left"
        fill
      />
    </Select>
  );
}
