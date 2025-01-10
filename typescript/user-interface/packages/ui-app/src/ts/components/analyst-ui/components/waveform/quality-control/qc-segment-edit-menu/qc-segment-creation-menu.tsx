import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import { QcSegmentCategory } from '@gms/common-model/lib/qc-segment';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu } from '@gms/ui-state';
import React from 'react';
import { toast } from 'react-toastify';

import { QcSegmentEditContent } from './qc-segment-edit-content';

export interface QcSegmentCreationMenuProps {
  startTime: number;
  endTime: number;
  selectedStationIds: string[];
  updateBrushStroke?: (start: number, end: number) => void;
}

export const QcSegmentCreationMenu = React.memo(function QcSegmentCreationContextMenuContent(
  props: QcSegmentCreationMenuProps
): JSX.Element {
  const { startTime, endTime, selectedStationIds, updateBrushStroke } = props;
  let qcSegment: QcSegment;
  let canCreateSegment = false;
  let channels: string[];
  // checking that selected raw channels belong to single station while ignoring station panels
  const selectedChannelForSubstr = selectedStationIds.find(id => id.includes('.'));
  if (selectedChannelForSubstr) {
    const channelSubstring = selectedChannelForSubstr.substring(
      0,
      selectedChannelForSubstr.indexOf('.')
    );
    channels = selectedStationIds.filter(id => id.includes('.'));
    canCreateSegment = !channels.some(channel => !channel.startsWith(channelSubstring));
  }
  if (canCreateSegment) {
    // default values to enable opening the edit dialog
    qcSegment = {
      id: undefined,
      channel: { name: undefined },
      versionHistory: [
        {
          id: { parentQcSegmentId: undefined, effectiveAt: startTime },
          startTime,
          endTime,
          createdBy: undefined,
          rejected: false,
          rationale: '',
          type: undefined,
          discoveredOn: undefined,
          stageId: { name: undefined },
          category: QcSegmentCategory.ANALYST_DEFINED,
          channels: channels.map(stationId => ({
            name: stationId,
            effectiveAt: undefined
          }))
        }
      ]
    };
    return <QcSegmentEditContent qcSegment={qcSegment} updateBrushStroke={updateBrushStroke} />;
  }
  toast.warn(`Cannot create QC segments: please select a single station's channels.`, {
    toastId: `toast-unable-to-create-qc-segments-select-single-station`
  });
  return undefined;
});

/**
 * Shows the {@link QcSegmentCreationMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link QcSegmentCreationMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showQcCreationMenu = (
  event: React.MouseEvent | MouseEvent,
  props: QcSegmentCreationMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { endTime, selectedStationIds, startTime, updateBrushStroke } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <QcSegmentCreationMenu
        endTime={endTime}
        selectedStationIds={selectedStationIds}
        startTime={startTime}
        updateBrushStroke={updateBrushStroke}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
