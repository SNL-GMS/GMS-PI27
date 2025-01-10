import type { CommonTypes } from '@gms/common-model';
import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonToolbarItem } from '@gms/ui-core-components';
import * as React from 'react';

import { showQcCreationMenu } from '../../quality-control';

const handleCreateQcSegmentClick = (
  event: React.MouseEvent<HTMLElement, MouseEvent>,
  selectedStationIds: string[],
  viewableTimeInterval: CommonTypes.TimeRange
): void => {
  const { startTimeSecs, endTimeSecs } = viewableTimeInterval;
  showQcCreationMenu(event, {
    startTime: startTimeSecs,
    endTime: endTimeSecs,
    selectedStationIds
  });
};

const buildCreateQcSegmentControl = (
  disableCreateQcSegment: boolean,
  key: string | number,
  selectedStationIds: string[],
  viewableTimeInterval: CommonTypes.TimeRange
): ToolbarTypes.ToolbarItemElement => (
  <ButtonToolbarItem
    key={key}
    disabled={disableCreateQcSegment}
    onButtonClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) =>
      handleCreateQcSegmentClick(event, selectedStationIds, viewableTimeInterval)
    }
    label="Create QC Segment"
    tooltip="Create QC segment for open time range. Select one or more raw channels to enable."
  />
);

/**
 * Create QC segment button for waveform display toolbar
 * Disabled if no raw channels are selected
 *
 * @param selectedStationIds Array of station IDs
 * @returns
 */
export const useCreateQcSegmentControl = (
  selectedStationIds: string[],
  viewableTimeInterval: CommonTypes.TimeRange,
  key: string | number
): ToolbarTypes.ToolbarItemElement => {
  const disableCreateQcSegment = selectedStationIds.filter(id => id.includes('.')).length === 0;
  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () =>
      buildCreateQcSegmentControl(
        disableCreateQcSegment,
        key,
        selectedStationIds,
        viewableTimeInterval
      ),
    [disableCreateQcSegment, key, selectedStationIds, viewableTimeInterval]
  );
};
