import { MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import { isDropdownToolbarItem } from '../toolbar-item/dropdown-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a Dropdown specifically in the overflow menu.
 */
export function DropdownOverflowMenuToolbarItem({ item, menuKey }: ToolbarOverflowMenuItemProps) {
  if (isDropdownToolbarItem(item)) {
    return (
      <MenuItem
        text={item.menuLabel ?? item.label}
        icon={item.icon}
        key={menuKey}
        disabled={item.disabled}
      >
        {item.dropDownItems
          ? Object.keys(item.dropDownItems).map(ekey => (
              <MenuItem
                text={item.dropDownItems[ekey]}
                disabled={
                  item.disabledDropDownOptions
                    ? item.disabledDropDownOptions.indexOf(item.dropDownItems[ekey]) > -1
                    : false
                }
                key={ekey}
                onClick={() => item.onChange(item.dropDownItems[ekey])}
                icon={item.value === item.dropDownItems[ekey] ? IconNames.TICK : undefined}
              />
            ))
          : null}
      </MenuItem>
    );
  }
  return null;
}
