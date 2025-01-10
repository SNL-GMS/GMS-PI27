import { setDecimalPrecision } from '@gms/common-util';
import type { ColumnDefinition } from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { singleDecimalComparator } from '~common-ui/common/table-utils';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Defines the ms column definition
 *
 * @returns the column definition
 */
export const msColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  number,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.magnitudeMs),
  field: EventsColumn.magnitudeMs,
  headerTooltip: 'Surface wave magnitude',
  width: 60,
  valueFormatter: params => setDecimalPrecision(params.data.magnitudeMs, 1),
  filterValueGetter: params => setDecimalPrecision(params.data.magnitudeMs, 1),
  comparator: singleDecimalComparator
};
