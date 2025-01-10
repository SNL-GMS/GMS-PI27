import { setDecimalPrecision } from '@gms/common-util';
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
 * @returns Formatted string for timeUncertainty when it exists
 */
function timeUncertaintyValueFormatter(
  params: ValueFormatterParams<
    TimeRow,
    unknown,
    string,
    CellRendererParams<TimeRow, unknown, ArrivalTime, ICellRendererParams, IHeaderParams>,
    IHeaderParams
  >
): string {
  return params.data.time.uncertainty ? setDecimalPrecision(params.data.time.uncertainty, 3) : '';
}

/**
 * Custom valueGetter so that this column can be sorted on time only.
 *
 * @returns time as a number
 */
function timeUncertaintyValueGetter(
  params: ValueGetterParams<
    TimeRow,
    unknown,
    string,
    CellRendererParams<TimeRow, unknown, ArrivalTime, ICellRendererParams, IHeaderParams>,
    IHeaderParams
  >
): number {
  return params.data.time.uncertainty || 0;
}

/**
 * @returns column definition for time uncertainty
 */
export function getTimeUncertaintyColumnDef<T extends TimeRow>(
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
    width: 150,
    valueFormatter: timeUncertaintyValueFormatter,
    valueGetter: timeUncertaintyValueGetter
  };
}
