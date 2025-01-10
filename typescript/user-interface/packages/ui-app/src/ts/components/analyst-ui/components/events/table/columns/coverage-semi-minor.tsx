import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { decimalPrecisionValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the coverage semi minor column definition
 *
 * @returns the column definition
 */
export const coverageSemiMinorColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.coverageSemiMinorAxis),
  field: EventsColumn.coverageSemiMinorAxis,
  headerTooltip: 'Coverage semi-minor axis in kilometers',
  width: 130,
  valueFormatter: params =>
    decimalPrecisionValueFormatter<EventRow>(params, EventsColumn.coverageSemiMinorAxis, 2),
  filterValueGetter: params =>
    decimalPrecisionValueFormatter<EventRow>(
      { value: '', ...params },
      EventsColumn.coverageSemiMinorAxis,
      2
    )
};
