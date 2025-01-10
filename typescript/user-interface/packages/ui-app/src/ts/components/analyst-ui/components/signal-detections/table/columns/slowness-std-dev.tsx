import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { numericStringComparator } from '~common-ui/common/table-utils';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

const standardDeviationHeaderWidthPx = 130;

/**
 * Signal Detection slowness std deviation definition
 */
export const slownessStandardDeviationColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(
    SignalDetectionColumn.slownessStandardDeviation
  ),
  field: SignalDetectionColumn.slownessStandardDeviation,
  headerTooltip: 'Slowness standard deviation',
  comparator: numericStringComparator,
  width: standardDeviationHeaderWidthPx
};
