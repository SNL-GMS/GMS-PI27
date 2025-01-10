import type { AgGridCommunity, ColumnDefinition } from '@gms/ui-core-components';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import {
  dataCellComparator,
  DIGIT_PRECISION,
  formatTooltip,
  isFstatOrPowerCell
} from '../fk-properties-table-utils';
import type { DataCell, FkPropertiesCellValueFormatterParams, FkPropertiesRow } from './types';
import { FkPropertiesColumn, FkPropertiesColumnDisplayStrings } from './types';

/**
 * Custom value formatter for {@link residualColumnDef}
 */
function residualCellValueFormatter(params: FkPropertiesCellValueFormatterParams) {
  // No measurement
  if (!params.data.hasAnalystMeasurement) return '-';

  // Invalid phase, no open event, or Fstat/Power cell
  if (params.data.phaseIsInvalid || !params.data.eventIsOpen || isFstatOrPowerCell(params))
    return 'N/A';

  // No value, this should never happen
  if (!params.value?.value) return 'Unknown';

  return params.value.value.toFixed(DIGIT_PRECISION);
}

/* applies classes to table cells conditionally based on if the displayed sd's feature detections are extrapolated */
const extrapolatedCellClassRules: AgGridCommunity.CellClassRules = {
  'fk-properties__cell--extrapolated': params => params.data.extrapolated
};

/**
 * Defines the residual column definition
 *
 * @returns ColumnDefinition object
 */
export const residualColumnDef: ColumnDefinition<
  FkPropertiesRow,
  unknown,
  DataCell,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: FkPropertiesColumnDisplayStrings.get(FkPropertiesColumn.residual),
  field: FkPropertiesColumn.residual,
  width: 85,
  cellStyle: { textAlign: 'right' },
  resizable: true,
  sortable: true,
  filter: false,
  tooltipValueGetter: formatTooltip,
  valueFormatter: residualCellValueFormatter,
  comparator: dataCellComparator,
  cellClassRules: extrapolatedCellClassRules
};
