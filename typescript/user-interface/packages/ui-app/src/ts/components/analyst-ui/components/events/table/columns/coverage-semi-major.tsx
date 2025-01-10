import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { decimalPrecisionValueFormatter } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the coverage semi major column definition
 *
 * @returns the column definition
 */
export const coverageSemiMajorColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.coverageSemiMajorAxis),
  field: EventsColumn.coverageSemiMajorAxis,
  headerTooltip: 'Coverage semi-major axis in kilometers',
  width: 130,
  valueFormatter: params =>
    decimalPrecisionValueFormatter<EventRow>(params, EventsColumn.coverageSemiMajorAxis, 2),
  filterValueGetter: params =>
    decimalPrecisionValueFormatter<EventRow>(
      { value: '', ...params },
      EventsColumn.coverageSemiMajorAxis,
      2
    )
};
