import type { ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { numericStringComparator } from '~common-ui/common/table-utils';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

const standardDeviationHeaderWidthPx = 130;

/**
 * Signal Detection azimuth std deviation definition
 */
export const azimuthStdDevColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(
    SignalDetectionColumn.azimuthStandardDeviation
  ),
  field: SignalDetectionColumn.azimuthStandardDeviation,
  headerTooltip: 'Azimuth standard deviation',
  comparator: numericStringComparator,
  width: standardDeviationHeaderWidthPx
};
