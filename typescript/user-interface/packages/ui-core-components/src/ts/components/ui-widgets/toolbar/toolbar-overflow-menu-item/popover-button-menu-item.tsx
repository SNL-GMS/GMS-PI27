import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import { isPopoverButtonToolbarItem } from '../toolbar-item/popover-button-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a PopoverButton specifically in the overflow menu.
 */
export function PopoverButtonOverflowMenuToolbarItem({
  item,
  menuKey
}: ToolbarOverflowMenuItemProps) {
  return isPopoverButtonToolbarItem(item) ? (
    <MenuItem
      text={item.menuLabel ?? item.label}
      icon={item.icon}
      key={menuKey}
      disabled={item.disabled}
    >
      {item.popoverContent}
    </MenuItem>
  ) : null;
}
