import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { caseInsensitiveComparator } from '~common-ui/common/table-utils';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection phase column definition
 */
export const phaseColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.phase),
  field: SignalDetectionColumn.phase,
  headerTooltip: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.phase),
  comparator: caseInsensitiveComparator
};
