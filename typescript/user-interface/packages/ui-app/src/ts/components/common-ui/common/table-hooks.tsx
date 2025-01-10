import type { AgGridReact } from 'ag-grid-react';
import React from 'react';

import type { EventRow } from '~analyst-ui/components/events/types';
import type { SignalDetectionRow } from '~analyst-ui/components/signal-detections/types';

import { updateRowSelection } from './table-utils';

/**
 * Keeps AG grid row selection in sync with GMS selection across the other displays. eg: If a signal detection
 * is selected (GMS) on the Map display then its corresponding AG grid row should also be selected on the
 * Signal Detections List display.
 *
 * If the table API is not defined due to a race condition on startup,
 * set a timeout and try again. And again. And again, up to ten times, or the provided max number of tries to attempt.
 */
export const useSyncDisplaySelection = (
  /** Ref to AG Grid table */
  tableRef: React.MutableRefObject<AgGridReact | null>,
  /** List of IDs to mark selected. Should match with AG Grid row ID. */
  selectedIds: string[],
  /** AG grid data, on change might require an to update SD selections */
  data: SignalDetectionRow[] | EventRow[],
  /** Maximum number of tries to attempt syncing. */
  maxTries = 10,
  /** Time in MS to wait before trying again */
  backOffIncrementMs = 16
): void => {
  const timeoutRef = React.useRef<NodeJS.Timeout | number>();
  const numTriesRef = React.useRef<number>(0);
  const maybeUpdateRowSelection = React.useCallback(() => {
    numTriesRef.current += 1;
    if (tableRef?.current?.api) {
      updateRowSelection(tableRef, selectedIds);
    } else if (numTriesRef.current < maxTries) {
      timeoutRef.current = setTimeout(
        maybeUpdateRowSelection,
        backOffIncrementMs * numTriesRef.current
      );
    }
  }, [backOffIncrementMs, maxTries, selectedIds, tableRef]);

  React.useEffect(() => {
    if (tableRef?.current != null) {
      maybeUpdateRowSelection();
    }
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [maybeUpdateRowSelection, selectedIds, tableRef, data]);
};
