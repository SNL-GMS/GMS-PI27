import { MenuItem } from '@blueprintjs/core';
import React from 'react';

import { hideImperativeContextMenu } from '../../../imperative-context-menu';
import { DateRangePicker } from '../../date-range-picker';
import { isDateRangePickerToolbarItem } from '../toolbar-item/date-range-picker-item';
import type { ToolbarOverflowMenuItemProps } from './types';

/**
 * ToolbarItem component for a DateRangePicker specifically in the overflow menu.
 */
export function DateRangePickerOverflowMenuToolbarItem({
  item,
  menuKey
}: ToolbarOverflowMenuItemProps) {
  return isDateRangePickerToolbarItem(item) ? (
    <MenuItem
      text={item.menuLabel ?? item.label}
      icon={item.icon}
      key={menuKey}
      disabled={item.disabled}
    >
      <div className="date-range-picker__menu-popover">
        <DateRangePicker
          startTimeMs={item.startTimeMs}
          endTimeMs={item.endTimeMs}
          format={item.format}
          durations={item.durations}
          minStartTimeMs={item.minStartTimeMs}
          maxEndTimeMs={item.maxEndTimeMs}
          onNewInterval={(startTimeMs: number, endTimeMs: number) =>
            item.onChange(startTimeMs, endTimeMs)
          }
          onApply={(startTimeMs: number, endTimeMs: number) => {
            item.onApplyButton(startTimeMs, endTimeMs);
            hideImperativeContextMenu();
          }}
        />
      </div>
    </MenuItem>
  ) : null;
}
