import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { booleanValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the status column definition
 *
 * @returns the column definition
 */
export const rejectedColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  boolean,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.rejected),
  field: EventsColumn.rejected,
  headerTooltip: eventColumnDisplayStrings.get(EventsColumn.rejected),
  width: 110,
  valueFormatter: params => booleanValueFormatter<EventRow>(params, EventsColumn.rejected)
};
