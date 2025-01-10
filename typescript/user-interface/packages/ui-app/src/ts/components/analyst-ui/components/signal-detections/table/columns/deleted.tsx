import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection deleted definition
 */
export const deletedColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.deleted),
  field: SignalDetectionColumn.deleted,
  headerTooltip: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.deleted)
};
