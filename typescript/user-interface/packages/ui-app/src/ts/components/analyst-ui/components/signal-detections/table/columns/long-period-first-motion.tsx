import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { medCellWidthPx } from '~common-ui/common/table-types';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection long period first motion definition
 */
export const longPeriodFirstMotionColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.longPeriodFirstMotion),
  field: SignalDetectionColumn.longPeriodFirstMotion,
  headerTooltip: signalDetectionColumnDisplayStrings.get(
    SignalDetectionColumn.longPeriodFirstMotion
  ),
  width: medCellWidthPx
};
