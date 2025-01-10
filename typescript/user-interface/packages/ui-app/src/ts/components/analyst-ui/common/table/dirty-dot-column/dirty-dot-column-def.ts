import type { ColumnDefinition } from '@gms/ui-core-components';
import type { IHeaderParams } from 'ag-grid-community';

import type { DirtyDotCellRendererParams, UnsavedChangesRow } from './dirty-dot-cell-renderer';
import { DirtyDotCellRenderer } from './dirty-dot-cell-renderer';
import { DirtyDotHeaderComponent } from './dirty-dot-header';
import { dirtyDotCellComparator } from './dirty-dot-util';

/**
 * @returns dirty dot/unsaved changes column definition
 */
export function getDirtyDotColumnDef<T extends UnsavedChangesRow>(
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
): ColumnDefinition<T, unknown, boolean, DirtyDotCellRendererParams, IHeaderParams> {
  return {
    headerClass: 'ag-grid__unsaved-changes',
    headerName,
    headerComponent: DirtyDotHeaderComponent,
    field,
    headerTooltip,
    cellRenderer: DirtyDotCellRenderer,
    comparator: dirtyDotCellComparator,
    width: 55
  };
}
