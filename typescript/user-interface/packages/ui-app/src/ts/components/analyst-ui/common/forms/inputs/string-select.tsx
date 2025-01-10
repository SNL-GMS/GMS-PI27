import { Button, MenuItem } from '@blueprintjs/core';
import type { ItemPredicate, ItemRenderer } from '@blueprintjs/select';
import { Select } from '@blueprintjs/select';
import React from 'react';

const filterString: ItemPredicate<string> = (query, str, _index, exactMatch) => {
  const normalizedStr = str.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedStr === normalizedQuery;
  }
  return `${str}`.indexOf(normalizedQuery) >= 0;
};

const renderString: ItemRenderer<string> = (str, { handleClick, handleFocus, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={str}
      onClick={handleClick}
      onFocus={handleFocus}
      roleStructure="listoption"
      text={str}
    />
  );
};

export interface StringSelectProps {
  /** List of items that can be selected. Must be referentially stable */
  readonly items: string[];
  selected: string;
  filterable?: boolean;
  placeholder?: string;
  setSelected: (val: string) => void;
  fill?: boolean;
  matchTargetWidth?: boolean;
}

/**
 * A dropdown select component for choosing from a list of strings
 */
export function StringSelect({
  items,
  setSelected,
  filterable = true,
  selected,
  placeholder = 'Select one',
  fill = true,
  matchTargetWidth = true
}: StringSelectProps) {
  return (
    <Select<string>
      items={items}
      itemPredicate={filterString}
      itemRenderer={renderString}
      noResults={<MenuItem disabled text="No results." roleStructure="listoption" />}
      onItemSelect={setSelected}
      popoverProps={{ matchTargetWidth }}
      filterable={filterable}
    >
      <Button
        text={selected}
        rightIcon="double-caret-vertical"
        placeholder={placeholder}
        fill={fill}
        alignText="left"
      />
    </Select>
  );
}
