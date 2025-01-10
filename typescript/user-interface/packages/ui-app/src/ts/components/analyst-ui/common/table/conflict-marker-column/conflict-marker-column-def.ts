import type { ColumnDefinition } from '@gms/ui-core-components';
import type { IHeaderParams } from 'ag-grid-community';

import type {
  ConflictMarkerCellRendererParams,
  ConflictRow
} from './conflict-marker-cell-renderer';
import { ConflictMarkerCellRenderer } from './conflict-marker-cell-renderer';

/**
 * @returns conflict marker column definition
 */
export function getConflictColumnDef<T extends ConflictRow>(
  /**
   * The name to render in the column header. If not specified and field is
   * specified, the field name will be used as the header name.
   */
  headerName: string | undefined,
  /**
   * The field of the row object to get the cell's data from.
   * Deep references into a row object is supported via dot notation, i.e `address.firstLine`.
   */
  field: string,
  /** Optional tooltip for the column header */
  headerTooltip: string | undefined
): ColumnDefinition<T, unknown, boolean, ConflictMarkerCellRendererParams, IHeaderParams> {
  return { headerName, field, headerTooltip, cellRenderer: ConflictMarkerCellRenderer };
}
