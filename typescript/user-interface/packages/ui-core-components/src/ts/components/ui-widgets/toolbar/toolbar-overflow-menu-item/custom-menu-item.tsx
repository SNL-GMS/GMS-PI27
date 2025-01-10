import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import { isCustomToolbarItem } from '../toolbar-item/custom-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a CustomItem specifically in the overflow menu.
 */
export function CustomOverflowMenuToolbarItem({ item, menuKey }: ToolbarOverflowMenuItemProps) {
  return isCustomToolbarItem(item) ? (
    <MenuItem
      key={menuKey}
      text={item.menuLabel ?? item.label}
      disabled={item.disabled}
      icon={item.icon}
    >
      {item.element}
    </MenuItem>
  ) : null;
}
