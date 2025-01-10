import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { numericStringComparator } from '~common-ui/common/table-utils';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/**
 * Signal Detection azimuth definition
 */
export const azimuthColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.azimuth),
  field: SignalDetectionColumn.azimuth,
  headerTooltip: 'Observed receiver-to-source azimuth',
  comparator: numericStringComparator
};
