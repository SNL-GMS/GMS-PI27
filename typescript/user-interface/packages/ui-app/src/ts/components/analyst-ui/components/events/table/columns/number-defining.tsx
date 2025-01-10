import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { shouldShowZero } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the status column definition
 *
 * @returns the column definition
 */
export const numberDefiningColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.numberDefining),
  field: EventsColumn.numberDefining,
  headerTooltip: 'Number of time defining signal detections',
  width: 125,
  valueFormatter: params => shouldShowZero<EventRow>(params, EventsColumn.numberDefining)
};
