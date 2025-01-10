import { EventTypes } from '@gms/common-model';
import { humanReadable, toSentenceCase } from '@gms/common-util';
import type { CellRendererParams, ColumnDefinition } from '@gms/ui-core-components';
import { getColumnPosition, TableCellRenderer } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import * as React from 'react';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

export type StatusCellRendererParams = CellRendererParams<
  EventRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
>;

/**
 * Cell renderer to render the status column
 */
export function StatusCellRenderer(props: StatusCellRendererParams) {
  const { data } = props;
  const value = data.status
    ? toSentenceCase(humanReadable(data.status)) ??
      toSentenceCase(humanReadable(EventTypes.EventStatus.NOT_STARTED))
    : toSentenceCase(humanReadable(EventTypes.EventStatus.NOT_STARTED));
  return (
    <TableCellRenderer
      data-col-position={getColumnPosition<EventRow>(props)}
      value={value}
      isNumeric={false}
      tooltipMsg={value}
      cellValueClassName={
        data.status === EventTypes.EventStatus.COMPLETE ? 'table-cell__value--complete' : ''
      }
    />
  );
}

/**
 * Defines the status column definition
 *
 * @returns the column definition
 */
export const statusColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.status),
  field: EventsColumn.status,
  headerTooltip: eventColumnDisplayStrings.get(EventsColumn.status),
  width: 110,
  cellRenderer: StatusCellRenderer,
  filterValueGetter: params => humanReadable(params.data.status)
};
