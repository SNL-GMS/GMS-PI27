import { MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { UIChannelSegmentRecord } from '@gms/ui-state';
import { AnalystWaveformSelectors, useAppSelector } from '@gms/ui-state';
import React from 'react';

import { exportChannelSegmentsBySelectedStations } from '../utils/signal-detection-util';

/**
 * The type of the props for the {@link WaveformChannelExportMenuItem} component
 */
export interface WaveformChannelExportMenuItemProps {
  /** Can be a station or channel name. */
  channelId: string;
  /** Used if more than one station/channel is selected. */
  selectedStationIds: string[];
  /**
   * Contains all UI channel segments, where the top-level key is a channel/station name
   * and the sub-key is the name of the filter used for each {@link UIChannelSegmentRecord}s array
   */
  channelSegmentsRecord: UIChannelSegmentRecord;
  disabled: boolean;
}

/**
 * Creates an export menu option bound to redux for access to filterDefinitions
 */
export function WaveformChannelExportMenuItem({
  channelId,
  selectedStationIds,
  channelSegmentsRecord,
  disabled
}: WaveformChannelExportMenuItemProps) {
  const channelFilters = useAppSelector(AnalystWaveformSelectors.selectChannelFilters);
  return (
    <MenuItem
      text="Export"
      icon={IconNames.EXPORT}
      disabled={disabled}
      onClick={async () => {
        await exportChannelSegmentsBySelectedStations(
          channelId,
          selectedStationIds,
          channelFilters,
          channelSegmentsRecord
        );
      }}
      data-cy="menu-item-export"
    />
  );
}
