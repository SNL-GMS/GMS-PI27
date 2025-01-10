import type { ColumnDefinition } from '@gms/ui-core-components';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { dataCellComparator, DIGIT_PRECISION, formatTooltip } from '../fk-properties-table-utils';
import type { DataCell, FkPropertiesCellValueFormatterParams, FkPropertiesRow } from './types';
import { FkPropertiesColumn, FkPropertiesColumnDisplayStrings } from './types';

/**
 * Custom value formatter for {@link peakColumnDef}
 */
function peakCellValueFormatter(params: FkPropertiesCellValueFormatterParams) {
  if (!params.value?.value) return 'Unknown';
  return params.value.value.toFixed(DIGIT_PRECISION);
}

/**
 * Defines the peak column definition
 *
 * @returns ColumnDefinition object
 */
export const peakColumnDef: ColumnDefinition<
  FkPropertiesRow,
  unknown,
  DataCell,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: FkPropertiesColumnDisplayStrings.get(FkPropertiesColumn.peak),
  field: FkPropertiesColumn.peak,
  width: 85,
  cellStyle: { textAlign: 'right' },
  resizable: true,
  sortable: true,
  filter: false,
  tooltipValueGetter: formatTooltip,
  valueFormatter: peakCellValueFormatter,
  comparator: dataCellComparator
};
