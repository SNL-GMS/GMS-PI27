import { formatTimeForDisplay } from '@gms/common-util';
import type {
  CellRendererParams,
  ColumnDefinition,
  ValueFormatterParams,
  ValueGetterParams
} from '@gms/ui-core-components';
import type { ArrivalTime } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import type { TimeRow } from './types';

/**
 * @returns Formatted date string
 */
function timeValueFormatter(
  params: ValueFormatterParams<
    TimeRow,
    unknown,
    string,
    CellRendererParams<TimeRow, unknown, ArrivalTime, ICellRendererParams, IHeaderParams>,
    IHeaderParams
  >
): string {
  return formatTimeForDisplay(params.data.time.value);
}

/**
 * Custom valueGetter so that this column can be sorted on time only.
 *
 * @returns time as a number
 */
function timeValueGetter(
  params: ValueGetterParams<
    TimeRow,
    unknown,
    string,
    CellRendererParams<TimeRow, unknown, ArrivalTime, ICellRendererParams, IHeaderParams>,
    IHeaderParams
  >
) {
  return formatTimeForDisplay(params.data.time.value);
}

/**
 * @returns time column definition
 */
export function getTimeColumnDef<T extends TimeRow>(
  /**
   * The name to render in the column header. If not specified and field is
   * specified, the field name will be used as the header name.
   */
  headerName: string | undefined,
  /**
   * The field of the row object to get the cell's data from.
   * Deep references into a row object is supported via dot notation, i.e `address.firstLine`.
   */
  field: string,
  /** Optional tooltip for the column header */
  headerTooltip: string | undefined
): ColumnDefinition<T, unknown, ArrivalTime, ICellRendererParams, IHeaderParams> {
  return {
    headerName,
    field,
    headerTooltip,
    width: 300,
    valueFormatter: timeValueFormatter,
    valueGetter: timeValueGetter,
    filterValueGetter: timeValueGetter,
    sort: 'asc'
  };
}
