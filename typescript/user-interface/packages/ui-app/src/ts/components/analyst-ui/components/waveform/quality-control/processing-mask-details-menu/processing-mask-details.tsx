import type { ProcessingMask } from '@gms/common-model/lib/channel-segment/types';
import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu } from '@gms/ui-state';
import React from 'react';

import { ProcessingMaskDetailsDialog } from './processing-mask-details-dialog';

interface ProcessingMaskDetailsProps {
  processingMask: ProcessingMask;
  qcSegments: QcSegment[];
}

export const ProcessingMaskDetails = React.memo(function ProcessingMaskDetails(
  props: ProcessingMaskDetailsProps
): JSX.Element {
  const { processingMask, qcSegments } = props;
  if (processingMask) {
    return <ProcessingMaskDetailsDialog processingMask={processingMask} qcSegments={qcSegments} />;
  }
  return undefined;
});

/**
 * Shows the {@link ProcessingMaskDetails} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link ProcessingMaskDetailsProps} props
 * @param options (optional) imperative context menu options
 */
export const showProcessingMaskDetails = (
  event: React.MouseEvent | MouseEvent,
  props: ProcessingMaskDetailsProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { processingMask, qcSegments } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: <ProcessingMaskDetails processingMask={processingMask} qcSegments={qcSegments} />,
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
