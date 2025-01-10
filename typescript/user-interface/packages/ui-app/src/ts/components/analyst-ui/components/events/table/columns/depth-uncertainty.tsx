import type { Depth } from '@gms/common-model/lib/event';
import { setDecimalPrecision } from '@gms/common-util';
import type {
  CellRendererParams,
  ColumnDefinition,
  ValueFormatterParams,
  ValueGetterParams
} from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * @returns Formatted string, for depthUncertainty when it exists
 */
function depthUncertaintyValueFormatter(
  params: ValueFormatterParams<
    EventRow,
    unknown,
    string,
    CellRendererParams<EventRow, unknown, Depth, ICellRendererParams, IHeaderParams>,
    IHeaderParams
  >
): string {
  return setDecimalPrecision(params.data.depthKm.uncertainty, 3);
}

/**
 * Custom valueGetter so that this column can be sorted on depthKm only.
 *
 * @returns depthKm as a number
 */
function timeUncertaintyValueGetter(
  params: ValueGetterParams<
    EventRow,
    unknown,
    string,
    CellRendererParams<EventRow, unknown, Depth, ICellRendererParams, IHeaderParams>,
    IHeaderParams
  >
): number {
  return params.data.depthKm.value;
}

/**
 * Defines the depth column definition
 *
 * @returns the column definition
 */
export const depthUncertaintyColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.depthUncertainty),
  field: EventsColumn.depthUncertainty,
  headerTooltip: 'Depth standard deviation',
  width: 150,
  valueFormatter: depthUncertaintyValueFormatter,
  filterValueGetter: params => setDecimalPrecision(params.data.depthKm.uncertainty, 3),
  valueGetter: timeUncertaintyValueGetter
};
