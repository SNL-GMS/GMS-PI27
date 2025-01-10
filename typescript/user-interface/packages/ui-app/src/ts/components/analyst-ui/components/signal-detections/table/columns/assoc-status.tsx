import { SignalDetectionTypes } from '@gms/common-model';
import type { AgGridCommunity, ColumnDefinition } from '@gms/ui-core-components';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { getSignalDetectionStatusString } from '~analyst-ui/common/utils/signal-detection-util';
import { messageConfig } from '~analyst-ui/config/message-config';

import type { SignalDetectionRow } from '../../types';
import { signalDetectionColumnDisplayStrings } from '../../types';

/* applies classes to table cells conditionally based on content, used in this case for styling event association cells */
const eventAssociationCellClassRules: AgGridCommunity.CellClassRules = {
  'sd-cell--open-associated': params =>
    params.value === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED,
  'sd-cell--complete-associated': params =>
    params.value === SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED,
  'sd-cell--other-associated': params =>
    params.value === SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED,
  'sd-cell--unassociated': params =>
    params.value === SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED,
  'sd-cell--deleted-sd': params =>
    params.value === SignalDetectionTypes.SignalDetectionStatus.DELETED
};

function SDAssociationStatusTooltipValueGetter(params) {
  const tooltip = getSignalDetectionStatusString(params.value);
  if (tooltip === messageConfig.invalidCellText) return params.value;
  return tooltip;
}

/**
 * Signal Detection associationStatus column definition
 */
export const assocStatusColumnDef: ColumnDefinition<
  SignalDetectionRow,
  unknown,
  SignalDetectionTypes.SignalDetectionStatus,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.assocStatus),
  field: SignalDetectionColumn.assocStatus,
  headerTooltip: 'Event association status',
  cellClassRules: eventAssociationCellClassRules,
  tooltipValueGetter: params => SDAssociationStatusTooltipValueGetter(params),
  width: 83
};
