import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { decimalPrecisionValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the confidence semi major column definition
 *
 * @returns the column definition
 */
export const confidenceSemiMajorColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.confidenceSemiMajorAxis),
  field: EventsColumn.confidenceSemiMajorAxis,
  headerTooltip: 'Confidence semi-major axis in kilometers',
  width: 130,
  valueFormatter: params =>
    decimalPrecisionValueFormatter<EventRow>(params, EventsColumn.confidenceSemiMajorAxis, 2),
  filterValueGetter: params =>
    decimalPrecisionValueFormatter<EventRow>(
      { value: '', ...params },
      EventsColumn.confidenceSemiMajorAxis,
      2
    )
};
