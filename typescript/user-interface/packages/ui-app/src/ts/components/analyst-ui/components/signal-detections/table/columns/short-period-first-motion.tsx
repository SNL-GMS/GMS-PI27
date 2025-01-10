import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { medCellWidthPx } from '~common-ui/common/table-types';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection short period first motion definition
 */
export const shortPeriodFirstMotionColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.shortPeriodFirstMotion),
  field: SignalDetectionColumn.shortPeriodFirstMotion,
  headerTooltip: signalDetectionColumnDisplayStrings.get(
    SignalDetectionColumn.shortPeriodFirstMotion
  ),
  width: medCellWidthPx
};
