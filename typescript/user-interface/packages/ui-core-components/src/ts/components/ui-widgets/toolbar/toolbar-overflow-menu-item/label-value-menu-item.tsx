import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import { isLabelValueToolbarItem } from '../toolbar-item/label-value-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a LabelValue specifically in the overflow menu.
 */
export function LabelValueOverflowMenuToolbarItem({ item, menuKey }: ToolbarOverflowMenuItemProps) {
  if (isLabelValueToolbarItem(item)) {
    const labelText = item.label && item.label.length > 0 ? `${item.label}: ` : '';
    const menuLabelText =
      typeof item.labelValue === 'string' ? (
        `${labelText} ${item.labelValue}`
      ) : (
        <>
          <span>{labelText}</span>
          {item.labelValue}
        </>
      );
    return (
      <MenuItem
        className={item.hasIssue ? 'toolbar-item--issue' : ''}
        title={item.hasIssue && item.tooltipForIssue ? item.tooltipForIssue : item.tooltip}
        key={menuKey}
        text={menuLabelText}
        disabled={item.disabled}
      />
    );
  }
  return null;
}
