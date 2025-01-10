import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu } from '@gms/ui-state';
import React from 'react';

import { QcSegmentEditContent } from './qc-segment-edit-content';

interface QcSegmentEditMenuProps {
  qcSegment: QcSegment;
}

export const QcSegmentEditMenu = React.memo(function QcSegmentEditMenu(
  props: QcSegmentEditMenuProps
): JSX.Element {
  const { qcSegment } = props;
  if (qcSegment) {
    return <QcSegmentEditContent qcSegment={qcSegment} />;
  }
  return undefined;
});

/**
 * Shows the {@link QcSegmentEditMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link QcSegmentEditMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showQcSegmentEditMenu = (
  event: React.MouseEvent | MouseEvent,
  props: QcSegmentEditMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { qcSegment } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: <QcSegmentEditMenu qcSegment={qcSegment} />,
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
