import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { booleanValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the deleted column definition
 *
 * @returns the column definition
 */
export const deletedColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  boolean,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.deleted),
  field: EventsColumn.deleted,
  headerTooltip: 'Deleted',
  valueFormatter: params => booleanValueFormatter<EventRow>(params, EventsColumn.deleted)
};
