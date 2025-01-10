import { setDecimalPrecision } from '@gms/common-util';
import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the latitude column definition
 *
 * @returns the column definition
 */
export const latitudeColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.latitudeDegrees),
  field: EventsColumn.latitudeDegrees,
  headerTooltip: 'Latitude in degrees',
  valueFormatter: params => setDecimalPrecision(params.data.latitudeDegrees, 3),
  filterValueGetter: params => setDecimalPrecision(params.data.latitudeDegrees, 3)
};
