import type { ColumnDefinition } from '@gms/ui-core-components';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import type { FkPropertiesRow } from './types';
import { FkPropertiesColumn, FkPropertiesColumnDisplayStrings } from './types';

/**
 * Defines the description column definition
 *
 * @returns ColumnDefinition object
 */
export const descriptionColumnDef: ColumnDefinition<
  FkPropertiesRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: FkPropertiesColumnDisplayStrings.get(FkPropertiesColumn.description),
  field: FkPropertiesColumn.description,
  width: 110,
  resizable: true,
  sortable: false,
  filter: false,
  cellRenderer: params => params.value
};
