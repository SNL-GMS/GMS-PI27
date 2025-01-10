import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import {
  isNumericInputToolbarItem,
  NumericInputToolbarItem
} from '../toolbar-item/numeric-input-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a NumericInput specifically in the overflow menu.
 */
export function NumericOverflowMenuToolbarItem({ item, menuKey }: ToolbarOverflowMenuItemProps) {
  return isNumericInputToolbarItem(item) ? (
    <MenuItem
      text={item.menuLabel ?? item.label}
      icon={item.icon}
      key={menuKey}
      disabled={item.disabled}
    >
      <NumericInputToolbarItem
        key={menuKey}
        numericValue={item.numericValue}
        minMax={item.minMax}
        onChange={val => item.onChange(val)}
        isInOverflowMenu
      />
    </MenuItem>
  ) : null;
}
