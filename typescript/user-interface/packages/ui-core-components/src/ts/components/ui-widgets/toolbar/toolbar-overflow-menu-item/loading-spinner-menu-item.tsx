import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import { isLoadingSpinnerToolbarItem } from '../toolbar-item/loading-spinner-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a LoadingSpinner specifically in the overflow menu.
 */
export function LoadingSpinnerOverflowMenuToolbarItem({
  item,
  menuKey
}: ToolbarOverflowMenuItemProps) {
  return isLoadingSpinnerToolbarItem(item) ? (
    <MenuItem
      key={menuKey}
      text={`Loading ${item.itemsToLoad} ${item.menuLabel ?? item.label}`}
      disabled={item.disabled}
    />
  ) : null;
}
