import type { ToolbarTypes } from '@gms/ui-core-components';
import { Counter, CustomToolbarItem } from '@gms/ui-core-components';
import React from 'react';

/**
 * Possible signal detection count keys
 */
export type SignalDetectionCountFilterOptions =
  | 'Total'
  | 'Open'
  | 'Completed'
  | 'Other'
  | 'Conflicts'
  | 'Deleted'
  | 'Unassociated';

export interface SignalDetectionCountEntry {
  count: number;
  color: string;
  isShown: boolean;
  tooltip: string;
}

export interface SignalDetectionsCountToolbarItemProps {
  key: string | number;
  signalDetectionCountEntryRecord: Record<
    SignalDetectionCountFilterOptions,
    SignalDetectionCountEntry
  >;
}

/**
 * Custom toolbar component that displays the number of signal detections
 */
export function useSignalDetectionsCountToolbarItem(
  key: string | number,
  signalDetectionCountEntryRecord: Record<
    SignalDetectionCountFilterOptions,
    SignalDetectionCountEntry
  >
): ToolbarTypes.ToolbarItemElement {
  return (
    <CustomToolbarItem
      key={key}
      tooltip="Signal detections count"
      label="Signal Detections Count"
      element={
        <Counter
          entries={Object.keys(signalDetectionCountEntryRecord).map(signalDetectionType => ({
            name: signalDetectionType,
            color: signalDetectionCountEntryRecord[signalDetectionType].color,
            isShown: signalDetectionCountEntryRecord[signalDetectionType].isShown,
            numberOfDigitsToDisplay: 3,
            value: signalDetectionCountEntryRecord[signalDetectionType].count,
            tooltip: signalDetectionCountEntryRecord[signalDetectionType].tooltip
          }))}
        />
      }
    />
  );
}
