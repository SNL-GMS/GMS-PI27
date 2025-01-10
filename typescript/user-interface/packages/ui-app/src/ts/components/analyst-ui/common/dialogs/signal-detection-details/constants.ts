import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  isNumber,
  secondsToString
} from '@gms/common-util';
import type { ColumnDefinition } from '@gms/ui-core-components';

import type { SignalDetectionHistoryRow } from './types';

/**
 * Reusable formatter for time uncertainty
 *
 * @param unc the uncertainty value in seconds
 *
 * @returns a string with two trailing digits and 's' to indicate the unit.
 * @example 12s
 */
export function formatUncertainty(unc: number): string {
  if (unc === undefined || !isNumber(unc)) {
    return '';
  }
  return `${unc.toFixed(3)}s`;
}

/**
 * Column definitions for the history table.
 */
export const SIGNAL_DETECTION_HISTORY_COLUMN_DEFINITIONS: ColumnDefinition<
  SignalDetectionHistoryRow,
  unknown,
  unknown,
  unknown,
  unknown
>[] = [
  {
    headerName: 'Creation time',
    field: 'creationTimestamp',
    cellStyle: { textAlign: 'left' },
    width: 165,
    cellClass: 'monospace',
    valueFormatter: e =>
      e.data.creationTimestamp === -1
        ? 'TBD'
        : secondsToString(
            e.data.creationTimestamp,
            DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
          )
  },
  {
    headerName: 'Phase',
    field: 'phase',
    cellStyle: { textAlign: 'left' },
    width: 70
  },
  {
    headerName: 'Detection time',
    field: 'arrivalTimeMeasurementTimestamp',
    cellClass: 'monospace',
    cellStyle: { textAlign: 'left' },
    width: 165,
    valueFormatter: e =>
      secondsToString(
        e.data.arrivalTimeMeasurementTimestamp,
        DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
      )
  },
  {
    headerName: 'Time uncertainty',
    field: 'arrivalTimeMeasurementUncertaintySec',
    cellClass: 'monospace',
    cellStyle: { textAlign: 'left' },
    width: 125,
    valueFormatter: e => formatUncertainty(e.data.arrivalTimeMeasurementUncertaintySec)
  },
  {
    headerName: 'Channel segment type',
    field: 'channelSegmentType',
    cellStyle: { textAlign: 'left' },
    width: 160,
    valueFormatter: e => e.data.channelSegmentType
  },
  {
    headerName: 'Author',
    field: 'authorName',
    cellStyle: { textAlign: 'left' },
    width: 125,
    valueFormatter: e => e.data.authorName
  },
  {
    headerName: 'Deleted',
    field: 'deleted',
    cellStyle: { textAlign: 'left' },
    width: 75,
    valueFormatter: e => e.data.deleted
  }
];
