import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { booleanValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the preferred column definition
 *
 * @returns the column definition
 */
export const preferredColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.preferred),
  field: EventsColumn.preferred,
  headerTooltip: eventColumnDisplayStrings.get(EventsColumn.preferred),
  width: 115,
  valueFormatter: params => booleanValueFormatter<EventRow>(params, EventsColumn.preferred)
};
