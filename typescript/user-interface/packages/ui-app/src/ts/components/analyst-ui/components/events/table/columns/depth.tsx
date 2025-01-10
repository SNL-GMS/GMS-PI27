import type { Depth } from '@gms/common-model/lib/event';
import { setDecimalPrecision } from '@gms/common-util';
import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { medCellWidthPx } from '~common-ui/common/table-types';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the depth column definition
 *
 * @returns the column definition
 */
export const depthColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  Depth,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.depthKm),
  field: EventsColumn.depthKm,
  headerTooltip: 'Depth in kilometers',
  width: medCellWidthPx,
  valueFormatter: params => setDecimalPrecision(params.data.depthKm.value, 3),
  filterValueGetter: params => setDecimalPrecision(params.data.depthKm.value, 3),
  valueGetter: params => setDecimalPrecision(params.data.depthKm.value, 3)
};
