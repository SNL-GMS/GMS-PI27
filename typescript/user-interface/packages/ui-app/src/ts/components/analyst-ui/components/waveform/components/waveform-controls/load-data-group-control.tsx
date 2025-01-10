import { IconNames } from '@blueprintjs/icons';
import type { CommonTypes } from '@gms/common-model';
import { WaveformTypes } from '@gms/common-model';
import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonGroupToolbarItem } from '@gms/ui-core-components';
import { useProcessingAnalystConfiguration } from '@gms/ui-state';
import * as React from 'react';

const buildLoadingDataGroup = (
  loadData: (loadType: WaveformTypes.LoadType) => void,
  canLoadEarlierData: boolean,
  canLoadLaterData: boolean,
  key: string | number
): ToolbarTypes.ToolbarItemElement => (
  <ButtonGroupToolbarItem
    key={key}
    buttons={[
      {
        buttonKey: `${key}loadleft`,
        cyData: 'btn-load-waveform-left',
        disabled: !canLoadEarlierData,
        label: 'Load Data Before',
        tooltip: 'Load more data before open time range',
        icon: IconNames.ARROW_LEFT,
        onlyShowIcon: true,
        onButtonClick: () => loadData(WaveformTypes.LoadType.Earlier)
      },
      {
        buttonKey: `${key}loadright`,
        cyData: 'btn-load-waveform-right',
        disabled: !canLoadLaterData,
        label: 'Load Data After',
        tooltip: 'Load more data after open time range',
        icon: IconNames.ARROW_RIGHT,
        onlyShowIcon: true,
        onButtonClick: () => loadData(WaveformTypes.LoadType.Later)
      }
    ]}
    label="Load Additional Data"
  />
);

/**
 * Creates a group of two buttons that load additional data, or returns the previously created
 * buttons if none of the parameters have changed since last called.
 *
 * @param loadData a function that loads additional data. Must be referentially stable.
 * @param key must be unique
 * @returns a group of two buttons that load earlier or later data.
 */
export const useLoadingDataGroupControl = (
  loadData: (loadType: WaveformTypes.LoadType) => void,
  currentTimeInterval: CommonTypes.TimeRange,
  viewableTimeInterval: CommonTypes.TimeRange,
  key: string | number
): ToolbarTypes.ToolbarItemElement => {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const earliestLoadableTime =
    currentTimeInterval.startTimeSecs -
    processingAnalystConfiguration.waveform.panningBoundaryDuration;
  const latestLoadableTime =
    currentTimeInterval.endTimeSecs +
    processingAnalystConfiguration.waveform.panningBoundaryDuration;

  const canLoadEarlierData = viewableTimeInterval.startTimeSecs > earliestLoadableTime;
  const canLoadLaterData = viewableTimeInterval.endTimeSecs < latestLoadableTime;

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () => buildLoadingDataGroup(loadData, canLoadEarlierData, canLoadLaterData, key),
    [canLoadEarlierData, canLoadLaterData, key, loadData]
  );
};
