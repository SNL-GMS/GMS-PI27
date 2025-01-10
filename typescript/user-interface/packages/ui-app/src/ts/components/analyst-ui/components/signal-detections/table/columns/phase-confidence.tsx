import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection phase confidence column definition
 */
export const phaseConfidenceColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.phaseConfidence),
  field: SignalDetectionColumn.phaseConfidence,
  headerTooltip: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.phaseConfidence)
};
