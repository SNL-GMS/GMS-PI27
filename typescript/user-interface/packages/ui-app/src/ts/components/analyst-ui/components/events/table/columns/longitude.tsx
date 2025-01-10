import { setDecimalPrecision } from '@gms/common-util';
import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the longitude column definition
 *
 * @returns the column definition
 */
export const longitudeColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.longitudeDegrees),
  field: EventsColumn.longitudeDegrees,
  headerTooltip: 'Longitude in degrees',
  valueFormatter: params => setDecimalPrecision(params.data.longitudeDegrees, 3),
  filterValueGetter: params => setDecimalPrecision(params.data.longitudeDegrees, 3)
};
