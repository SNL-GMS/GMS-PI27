import React from 'react';

import type { DropDownProps } from '../../drop-down';
import { DropDown } from '../../drop-down';
import type { ToolbarItemBase, ToolbarItemElement } from '../types';

/**
 * Type guard, for use when rendering overflow menu items.
 */
export function isDropdownToolbarItem(
  maybeDropdown: unknown
): maybeDropdown is DropdownToolbarItemProps<object> {
  return (maybeDropdown as DropdownToolbarItemProps<object>).dropDownItems !== undefined;
}

/** Internal type to be used as the 2nd type argument for {@link Pick} */
type DropdownPropsForToolbarItem =
  | 'dropDownItems'
  | 'dropDownText'
  | 'disabledDropDownOptions'
  | 'displayLabel'
  | 'value'
  | 'custom'
  | 'onChange';

/**
 * Properties to pass to the {@link DropdownToolbarItem}
 *
 * @see {@link ToolbarItemBase} for base properties.
 */
export type DropdownToolbarItemProps<T extends object> = ToolbarItemBase &
  Pick<DropDownProps<T>, DropdownPropsForToolbarItem>;

/**
 * Represents a group of static items to display/select within a toolbar
 *
 * @param dropdownItem the dropdownItem to display {@link DropdownItem}
 */
export function DropdownToolbarItem<T extends object>({
  dropDownItems,
  dropDownText,
  disabledDropDownOptions,
  value,
  custom,
  displayLabel,
  onChange,
  style,
  disabled,
  widthPx,
  tooltip,
  label
}: DropdownToolbarItemProps<T>): ToolbarItemElement {
  return (
    <div style={style ?? {}}>
      <DropDown<T>
        onChange={onChange}
        value={value}
        custom={custom}
        dropDownItems={dropDownItems}
        dropDownText={dropDownText}
        disabledDropDownOptions={disabledDropDownOptions}
        disabled={disabled}
        widthPx={widthPx}
        title={tooltip}
        displayLabel={displayLabel}
        label={label}
      />
    </div>
  );
}
