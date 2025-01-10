import type { TagProps } from '@blueprintjs/core';
import { Intent, MenuItem } from '@blueprintjs/core';
import type { ItemPredicate, ItemRenderer } from '@blueprintjs/select';
import { MultiSelect } from '@blueprintjs/select';
import React from 'react';

const stringPredicate: ItemPredicate<string> = (query, value, _index, exactMatch) => {
  const normalizedTitle = value.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  }
  return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
};

/**
 * The type of the props for the {@link StringMultiSelectProps} component
 */
export interface StringMultiSelectProps {
  values: string[];
  intent?: Intent | ((value: string, index: number) => Intent);
  selected: string[];
  placeholder?: string;
  disabled?: boolean;
  onChange?: (values: string[]) => void;
}

/**
 * A multi select component to choose a set of strings
 */
export function StringMultiSelect({
  values,
  intent,
  placeholder,
  disabled,
  onChange,
  selected
}: StringMultiSelectProps) {
  const setSelected = React.useCallback(
    v => {
      if (onChange) onChange(v);
    },
    [onChange]
  );

  const handleClear = React.useCallback(() => {
    setSelected([]);
  }, [setSelected]);

  const handleSelect = React.useCallback(
    chan => {
      const index = selected.indexOf(chan);
      if (index !== -1) {
        const updatedSelection = [...selected];
        updatedSelection.splice(index, 1);
        setSelected(updatedSelection);
      } else setSelected(Array.from(new Set([...selected, chan])));
    },
    [selected, setSelected]
  );

  const deselect = React.useCallback(
    (index: number) => {
      setSelected(selected.slice(0, index).concat(selected.slice(index + 1)));
    },
    [selected, setSelected]
  );

  const renderTag = React.useCallback(val => <span className="multiselect-tag">{val}</span>, []);

  const handleRemove = React.useCallback(
    (value: string, index: number) => {
      deselect(index);
    },
    [deselect]
  );

  const getTagProps = React.useCallback(
    (_value: React.ReactNode, index: number): TagProps => {
      return {
        minimal: true,
        intent:
          typeof intent === 'function' ? intent(selected[index], index) : intent ?? Intent.NONE
      };
    },
    [intent, selected]
  );

  const isValueSelected = React.useCallback(
    (value: string) => {
      return selected.includes(value);
    },
    [selected]
  );

  const renderValue: ItemRenderer<string> = React.useCallback(
    function RenderMenuItem(value, { handleClick, handleFocus, modifiers }) {
      if (!modifiers.matchesPredicate) {
        return null;
      }
      return (
        <MenuItem
          active={modifiers.active}
          disabled={modifiers.disabled}
          key={value}
          onClick={handleClick}
          onFocus={handleFocus}
          roleStructure="listoption"
          selected={isValueSelected(value)}
          text={value}
        />
      );
    },
    [isValueSelected]
  );

  return (
    <MultiSelect<string>
      disabled={disabled}
      itemPredicate={stringPredicate}
      itemRenderer={renderValue}
      items={values}
      placeholder={placeholder}
      noResults={<MenuItem disabled text="No results." roleStructure="listoption" />}
      onClear={handleClear}
      onRemove={handleRemove}
      onItemSelect={handleSelect}
      selectedItems={selected}
      tagRenderer={renderTag}
      tagInputProps={React.useMemo(
        () =>
          ({
            disabled,
            tagProps: getTagProps
          }) as any,
        [disabled, getTagProps]
      )}
      popoverProps={{ matchTargetWidth: true, minimal: true }}
    />
  );
}
