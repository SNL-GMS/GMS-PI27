import { Menu, MenuItem } from '@blueprintjs/core';
import type { ProcessingMask } from '@gms/common-model/lib/channel-segment/types';
import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu, useProcessingAnalystConfiguration } from '@gms/ui-state';
import React from 'react';

import { formatHotkeyString } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import { showProcessingMaskDetails } from './processing-mask-details-menu';
import { showQcSegmentEditMenu } from './qc-segment-edit-menu';
import { showQcSegmentsSelectionTableMenu } from './qc-segment-selection-table-menu';

export interface QcSegmentMenuProps {
  qcSegments?: QcSegment[];
  processingMask?: ProcessingMask;
}

export const QcSegmentMenu = React.memo(function QcSegmentMenu(
  props: QcSegmentMenuProps
): JSX.Element {
  const { qcSegments, processingMask } = props;

  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const hotkeys =
    processingAnalystConfiguration.keyboardShortcuts.clickEvents.viewQcSegmentDetails.combos;

  if (qcSegments?.length > 0 || processingMask) {
    const qcSegmentText =
      qcSegments?.length === 1 ? 'Open QC segment details' : 'Select QC segment';
    const labelElement = formatHotkeyString(hotkeys[0]);

    const qcOnClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (qcSegments?.length === 1) {
        showQcSegmentEditMenu(event, { qcSegment: qcSegments[0] });
      } else {
        showQcSegmentsSelectionTableMenu(event, { qcSegments });
      }
    };
    const pmOnClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      showProcessingMaskDetails(event, { qcSegments, processingMask });
    };
    return (
      <Menu>
        {qcSegments ? (
          <MenuItem
            title={qcSegmentText}
            text={qcSegmentText}
            labelElement={labelElement}
            onClick={qcOnClick}
          />
        ) : undefined}
        {processingMask ? (
          <MenuItem
            title="Open processing mask details"
            text="Open processing mask details"
            onClick={pmOnClick}
          />
        ) : undefined}
      </Menu>
    );
  }
  return undefined;
});

/**
 * Shows the {@link QcSegmentMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link QcSegmentMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showQcSegmentMenu = (
  event: React.MouseEvent | MouseEvent,
  props: QcSegmentMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { processingMask, qcSegments } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: <QcSegmentMenu processingMask={processingMask} qcSegments={qcSegments} />,
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
