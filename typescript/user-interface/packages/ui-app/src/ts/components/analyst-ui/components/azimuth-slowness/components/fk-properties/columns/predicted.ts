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
 * Custom value formatter for {@link predictedColumnDef}
 */
function predictedCellValueFormatter(params: FkPropertiesCellValueFormatterParams) {
  // No event open, invalid phase, or fstat/power cell
  if (!params.data.eventIsOpen || params.data.phaseIsInvalid || isFstatOrPowerCell(params))
    return 'N/A';

  // Valid phase, no value
  if (!params.value?.value) return 'Unknown';

  // Valid phase, has value: Value
  return params.value.value.toFixed(DIGIT_PRECISION);
}

/* applies classes to table cells conditionally based on if the displayed sd's feature detections are extrapolated */
const extrapolatedCellClassRules: AgGridCommunity.CellClassRules = {
  'fk-properties__cell--extrapolated': params => params.data.extrapolated
};

/**
 * Defines the predicted column definition
 *
 * @returns ColumnDefinition object
 */
export const predictedColumnDef: ColumnDefinition<
  FkPropertiesRow,
  unknown,
  DataCell,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: FkPropertiesColumnDisplayStrings.get(FkPropertiesColumn.predicted),
  field: FkPropertiesColumn.predicted,
  width: 85,
  cellStyle: { textAlign: 'right' },
  resizable: true,
  sortable: true,
  filter: false,
  tooltipValueGetter: formatTooltip,
  valueFormatter: predictedCellValueFormatter,
  comparator: dataCellComparator,
  cellClassRules: extrapolatedCellClassRules
};
