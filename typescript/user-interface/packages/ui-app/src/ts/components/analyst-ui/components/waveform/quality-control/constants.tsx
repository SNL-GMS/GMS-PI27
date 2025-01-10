import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  secondsToString
} from '@gms/common-util';
import type { ColumnDefinition } from '@gms/ui-core-components';

import type { QcMaskHistoryRow } from './types';

export const DEFAULT_MASK_HISTORY_COL_DEF: ColumnDefinition<
  QcMaskHistoryRow,
  unknown,
  unknown,
  unknown,
  unknown
> = {
  sortable: true,
  cellClass: 'monospace',
  cellStyle: { textAlign: 'left' }
};

/**
 * Column definitions for the overlapping mask table.
 */
export const MASK_HISTORY_COLUMN_DEFINITIONS: ColumnDefinition<
  QcMaskHistoryRow,
  unknown,
  unknown,
  unknown,
  unknown
>[] = [
  {
    headerName: 'Category',
    field: 'category',
    width: 130
  },
  {
    headerName: 'Type',
    field: 'type',
    width: 130
  },
  {
    headerName: 'Channel name',
    field: 'channelName',
    width: 130,
    valueFormatter: e =>
      e.data.channelName.reduce((str, cn, i) => {
        return `${str}${i > 0 ? ', ' : ''}${cn}`;
      }, '')
  },
  {
    headerName: 'Start time',
    field: 'startTime',
    width: 170,
    valueFormatter: e =>
      secondsToString(e.data.startTime, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  },
  {
    headerName: 'End time',
    field: 'endTime',
    width: 170,
    valueFormatter: e =>
      secondsToString(e.data.endTime, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  },
  {
    headerName: 'Stage',
    field: 'stage',
    width: 130
  },
  {
    headerName: 'Author',
    field: 'author',
    width: 130
  },
  {
    headerName: 'Effective at',
    field: 'effectiveAt',
    width: 170,
    sort: 'desc',
    valueFormatter: e =>
      secondsToString(e.data.effectiveAt, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  },
  {
    headerName: 'Rejected',
    field: 'rejected',
    width: 120
  },
  {
    headerName: 'Rationale',
    field: 'rationale',
    width: 300
  }
];
