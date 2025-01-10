import type { ToolbarTypes } from '@gms/ui-core-components';
import { DropdownToolbarItem } from '@gms/ui-core-components';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import * as React from 'react';

const buildStationSort = (
  currentSortType: AnalystWorkspaceTypes.WaveformSortType,
  currentOpenEventId: string,
  setSelectedSortType: (sortType: AnalystWorkspaceTypes.WaveformSortType) => void,
  widthPx: number,
  key: string | number
): ToolbarTypes.ToolbarItemElement => {
  const disabledDropDownOptions = [];
  if (!currentOpenEventId) {
    disabledDropDownOptions.push(AnalystWorkspaceTypes.WaveformSortType.distance);
  }
  return (
    <DropdownToolbarItem<typeof AnalystWorkspaceTypes.WaveformSortType>
      key={key}
      tooltip="Set the sort order of stations"
      label="Sort"
      displayLabel
      value={currentSortType}
      onChange={value => {
        setSelectedSortType(value as AnalystWorkspaceTypes.WaveformSortType);
      }}
      dropDownItems={AnalystWorkspaceTypes.WaveformSortType}
      disabledDropDownOptions={disabledDropDownOptions}
      widthPx={widthPx}
    />
  );
};

/**
 * Creates a sort control for the toolbar, or returns the previously created control if none of the
 * parameters have changed.
 *
 * @param currentSortType on what should we sort
 * @param currentOpenEventId the id of the currently open event
 * @param setSelectedSortType a function to set hte state of the sort. Must be referentially stable
 * @param key must be unique
 * @returns a sort control for the toolbar
 */
export const useStationSortControl = (
  currentSortType: AnalystWorkspaceTypes.WaveformSortType,
  currentOpenEventId: string,
  setSelectedSortType: (sortType: AnalystWorkspaceTypes.WaveformSortType) => void,
  key: string | number
): ToolbarTypes.ToolbarItemElement => {
  const widthPx = 130;
  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () => buildStationSort(currentSortType, currentOpenEventId, setSelectedSortType, widthPx, key),
    [currentSortType, currentOpenEventId, key, setSelectedSortType]
  );
};
