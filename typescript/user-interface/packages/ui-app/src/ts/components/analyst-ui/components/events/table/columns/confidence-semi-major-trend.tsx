import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { decimalPrecisionValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the confidence semi major trend column definition
 *
 * @returns the column definition
 */
export const confidenceSemiMajorTrendColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.confidenceSemiMajorTrend),
  field: EventsColumn.confidenceSemiMajorTrend,
  headerTooltip: 'Confidence semi-major trend in degrees',
  width: 170,
  valueFormatter: params =>
    decimalPrecisionValueFormatter<EventRow>(params, EventsColumn.confidenceSemiMajorTrend, 2),
  filterValueGetter: params =>
    decimalPrecisionValueFormatter<EventRow>(
      { value: '', ...params },
      EventsColumn.confidenceSemiMajorTrend,
      2
    )
};
