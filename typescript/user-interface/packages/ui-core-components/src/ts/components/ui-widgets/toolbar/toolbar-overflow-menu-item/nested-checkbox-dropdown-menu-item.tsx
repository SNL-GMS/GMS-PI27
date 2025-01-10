import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import { NestedCheckboxList } from '../toolbar-item/nested-check-box/nested-checkbox-list';
import { isNestedCheckboxDropdownToolbarItem } from '../toolbar-item/nested-check-box/nested-checkbox-toolbar-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a CheckboxDropdown specifically in the overflow menu.
 */
export function NestedCheckboxDropdownOverflowMenuToolbarItem({
  item,
  menuKey
}: ToolbarOverflowMenuItemProps) {
  return isNestedCheckboxDropdownToolbarItem(item) ? (
    <MenuItem
      text={item.menuLabel ?? item.label}
      icon={item.icon}
      key={menuKey}
      disabled={item.disabled}
    >
      <NestedCheckboxList
        checkBoxElements={item.checkBoxElements}
        keyToCheckedRecord={item.keyToCheckedRecord}
        keyToColorRecord={item.keyToColorRecord}
        keysToDividerMap={item.keysToDividerMap}
        onChange={value => item.onChange(value)}
      />
      <div className="nested-checkbox__footer_text">{item.children}</div>
    </MenuItem>
  ) : null;
}
