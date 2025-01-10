import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { numericStringComparator } from '~common-ui/common/table-utils';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection amplitude definition
 */
export const amplitudeColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.amplitude),
  field: SignalDetectionColumn.amplitude,
  headerTooltip: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.amplitude),
  comparator: numericStringComparator
};
