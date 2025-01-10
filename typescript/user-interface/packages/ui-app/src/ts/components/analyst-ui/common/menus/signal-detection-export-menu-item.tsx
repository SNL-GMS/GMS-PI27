import { MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  AnalystWaveformSelectors,
  selectSelectedSignalDetections,
  useAppSelector,
  useGetChannelSegments,
  useViewableInterval
} from '@gms/ui-state';
import React from 'react';

import { exportChannelSegmentsBySelectedSignalDetections } from '../utils/signal-detection-util';

/**
 * Creates an export menu option bound to redux for access to signal detection UiChannelSegments
 */
export function SignalDetectionExportMenuItem() {
  const [viewableInterval] = useViewableInterval();
  const channelSegmentResults = useGetChannelSegments(viewableInterval);
  const uiChannelSegments = channelSegmentResults.data;
  const channelFilters = useAppSelector(AnalystWaveformSelectors.selectChannelFilters);
  const selectedSignalDetections = useAppSelector(selectSelectedSignalDetections);

  return (
    <MenuItem
      text="Export"
      icon={IconNames.EXPORT}
      onClick={async () => {
        await exportChannelSegmentsBySelectedSignalDetections(
          selectedSignalDetections,
          uiChannelSegments,
          channelFilters
        );
      }}
    />
  );
}
