import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import { CheckboxList } from '../../checkbox-list';
import { isCheckboxDropdownToolbarItem } from '../toolbar-item/checkbox-dropdown-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a CheckboxDropdown specifically in the overflow menu.
 */
export function CheckboxDropdownOverflowMenuToolbarItem({
  item,
  menuKey
}: ToolbarOverflowMenuItemProps) {
  return isCheckboxDropdownToolbarItem(item) ? (
    <MenuItem
      text={item.menuLabel ?? item.label}
      icon={item.icon}
      key={menuKey}
      disabled={item.disabled}
    >
      <CheckboxList
        enumToCheckedMap={item.enumToCheckedMap}
        enumToColorMap={item.enumToColorMap}
        enumKeysToDisplayStrings={item.enumKeysToDisplayStrings}
        checkboxEnum={item.checkboxEnum}
        onChange={value => item.onChange(value)}
      />
    </MenuItem>
  ) : null;
}
