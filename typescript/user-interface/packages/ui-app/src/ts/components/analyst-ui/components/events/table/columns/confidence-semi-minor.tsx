import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { decimalPrecisionValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the confidence semi minor column definition
 *
 * @returns the column definition
 */
export const confidenceSemiMinorColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.confidenceSemiMinorAxis),
  field: EventsColumn.confidenceSemiMinorAxis,
  headerTooltip: 'Confidence semi-minor axis in kilometers',
  width: 130,
  valueFormatter: params =>
    decimalPrecisionValueFormatter<EventRow>(params, EventsColumn.confidenceSemiMinorAxis, 2),
  filterValueGetter: params =>
    decimalPrecisionValueFormatter<EventRow>(
      { value: '', ...params },
      EventsColumn.confidenceSemiMinorAxis,
      2
    )
};
