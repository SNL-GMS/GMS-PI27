import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { medCellWidthPx } from '~common-ui/common/table-types';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection channel column definition
 */
export const channelColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.channel),
  field: SignalDetectionColumn.channel,
  cellClass: 'monospace',
  headerTooltip: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.channel),
  width: medCellWidthPx
};
