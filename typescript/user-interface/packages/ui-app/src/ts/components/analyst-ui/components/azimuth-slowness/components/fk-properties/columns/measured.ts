import type { ColumnDefinition } from '@gms/ui-core-components';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { dataCellComparator, DIGIT_PRECISION, formatTooltip } from '../fk-properties-table-utils';
import type { DataCell, FkPropertiesCellValueFormatterParams, FkPropertiesRow } from './types';
import { FkPropertiesColumn, FkPropertiesColumnDisplayStrings } from './types';

/**
 * Custom value formatter for {@link measuredColumnDef}
 */
function measuredCellValueFormatter(params: FkPropertiesCellValueFormatterParams) {
  // No measurement value
  if (params.value?.value === undefined) return '-';

  // Has value
  return params.value.value.toFixed(DIGIT_PRECISION);
}

/**
 * Defines the measured column definition
 *
 * @returns ColumnDefinition object
 */
export const measuredColumnDef: ColumnDefinition<
  FkPropertiesRow,
  unknown,
  DataCell,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: FkPropertiesColumnDisplayStrings.get(FkPropertiesColumn.measured),
  field: FkPropertiesColumn.measured,
  width: 85,
  cellStyle: { textAlign: 'right' },
  resizable: true,
  sortable: true,
  filter: false,
  tooltipValueGetter: formatTooltip,
  valueFormatter: measuredCellValueFormatter,
  comparator: dataCellComparator
};
