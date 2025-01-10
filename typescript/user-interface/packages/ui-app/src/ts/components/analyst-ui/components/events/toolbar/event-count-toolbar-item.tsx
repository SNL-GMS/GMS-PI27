import type { ToolbarTypes } from '@gms/ui-core-components';
import { Counter, CustomToolbarItem } from '@gms/ui-core-components';
import React from 'react';

/**
 * Possible event count keys
 */
export type CountFilterOptions =
  | 'Total'
  | 'Complete'
  | 'Remaining'
  | 'Conflicts'
  | 'Deleted'
  | 'Rejected';

export interface EventCountEntry {
  count: number;
  color: string;
  isShown: boolean;
  tooltip: string;
}

export interface EventsCountToolbarItemProps {
  key: string | number;
  eventCountEntryRecord: Record<CountFilterOptions, EventCountEntry>;
}

/**
 * Custom toolbar component that displays the number of Events that are Open,
 * Completed, Rejected, Deleted, etc
 */
export function useEventsCountToolbarItem(
  key: string | number,
  eventCountEntryRecord: Record<CountFilterOptions, EventCountEntry>
): ToolbarTypes.ToolbarItemElement {
  return (
    <CustomToolbarItem
      key={key}
      tooltip="Events count"
      label="Events Count"
      element={
        <Counter
          entries={Object.keys(eventCountEntryRecord).map(eventType => ({
            name: eventType,
            color: eventCountEntryRecord[eventType].color,
            isShown: eventCountEntryRecord[eventType].isShown,
            numberOfDigitsToDisplay: 3,
            value: eventCountEntryRecord[eventType].count,
            tooltip: eventCountEntryRecord[eventType].tooltip
          }))}
        />
      }
    />
  );
}
