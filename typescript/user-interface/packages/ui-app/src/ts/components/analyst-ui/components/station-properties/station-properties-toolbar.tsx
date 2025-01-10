import { IconNames } from '@blueprintjs/icons';
import { formatTimeForDisplay } from '@gms/common-util';
import {
  CheckboxDropdownToolbarItem,
  DropdownToolbarItem,
  LabelValueToolbarItem,
  Toolbar
} from '@gms/ui-core-components';
import React from 'react';

import { stationTypeToFriendlyNameMap } from '~analyst-ui/components/map/map-utils';
import { messageConfig } from '~analyst-ui/config/message-config';
import { formatNumberForDisplayFixedThreeDecimalPlaces } from '~common-ui/common/table-utils';
import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';

import { systemConfig } from '../../config/system-config';
import type { StationPropertiesToolbarProps } from './types';
import {
  ChannelColumn,
  channelColumnDisplayStrings,
  SiteColumn,
  siteColumnDisplayStrings
} from './types';

export function StationPropertiesToolbar({
  stationName,
  selectedStation,
  effectiveAtTimes,
  selectedEffectiveAt,
  onEffectiveTimeChange,
  channelColumnsToDisplay,
  siteColumnsToDisplay,
  setSelectedSiteColumnsToDisplay,
  setSelectedChannelColumnsToDisplay
}: StationPropertiesToolbarProps) {
  const [displayWidthPx] = useBaseDisplaySize();

  const dropDownText: string[] = React.useMemo(
    () => effectiveAtTimes.map(time => formatTimeForDisplay(time)),
    [effectiveAtTimes]
  );

  const leftToolbarItems: JSX.Element[] = React.useMemo(
    () => [
      <DropdownToolbarItem<string[]>
        key="effectiveat"
        widthPx={220}
        tooltip="Select effective time to display"
        itemSide="LEFT"
        label="Effective At"
        displayLabel
        dropDownItems={effectiveAtTimes}
        dropDownText={dropDownText}
        value={selectedEffectiveAt ?? effectiveAtTimes[0]}
        onChange={onEffectiveTimeChange}
      />,
      <CheckboxDropdownToolbarItem
        key="cgcolumns"
        label="Channel Group Columns"
        widthPx={220}
        tooltip="Select columns to be shown in the channel group table below"
        cyData="station-properties-channel-group-column-picker"
        itemSide="LEFT"
        onChange={setSelectedSiteColumnsToDisplay}
        enumToCheckedMap={siteColumnsToDisplay}
        checkboxEnum={SiteColumn}
        enumKeysToDisplayStrings={siteColumnDisplayStrings}
      />,
      <CheckboxDropdownToolbarItem
        key="channel"
        label="Channel Columns"
        widthPx={220}
        tooltip="Select columns to be shown in the channel table below"
        cyData="station-properties-channel-column-picker"
        itemSide="LEFT"
        onChange={setSelectedChannelColumnsToDisplay}
        enumToCheckedMap={channelColumnsToDisplay}
        checkboxEnum={ChannelColumn}
        enumKeysToDisplayStrings={channelColumnDisplayStrings}
      />
    ],
    [
      channelColumnsToDisplay,
      dropDownText,
      effectiveAtTimes,
      onEffectiveTimeChange,
      selectedEffectiveAt,
      setSelectedChannelColumnsToDisplay,
      setSelectedSiteColumnsToDisplay,
      siteColumnsToDisplay
    ]
  );

  const rightToolbarItems: JSX.Element[] = React.useMemo(
    () => [
      <LabelValueToolbarItem
        key="selected"
        customStylePrefix="ian"
        label="Station"
        tooltip="Currently selected station"
        widthPx={400}
        labelValue={selectedStation?.name ?? stationName}
      />,
      <LabelValueToolbarItem
        key="lat"
        customStylePrefix="ian"
        label="Lat"
        tooltip="Station latitude"
        widthPx={400}
        labelValue={`${formatNumberForDisplayFixedThreeDecimalPlaces(
          selectedStation?.location?.latitudeDegrees
        )}°`}
      />,

      <LabelValueToolbarItem
        key="lon"
        customStylePrefix="ian"
        label="Lon"
        tooltip="Station longitude"
        widthPx={400}
        labelValue={`${formatNumberForDisplayFixedThreeDecimalPlaces(
          selectedStation?.location?.longitudeDegrees
        )}°`}
      />,
      <LabelValueToolbarItem
        key="depth"
        customStylePrefix="ian"
        label="Depth"
        tooltip="Depth (km)"
        widthPx={400}
        labelValue={
          `${formatNumberForDisplayFixedThreeDecimalPlaces(selectedStation?.location?.depthKm)}` ===
          messageConfig.invalidCellText
            ? messageConfig.invalidCellText
            : `${formatNumberForDisplayFixedThreeDecimalPlaces(
                selectedStation?.location?.depthKm
              )} km`
        }
      />,
      <LabelValueToolbarItem
        key="elev"
        customStylePrefix="ian"
        label="Elev"
        tooltip="Station elevation"
        labelValue={
          `${formatNumberForDisplayFixedThreeDecimalPlaces(
            selectedStation?.location?.elevationKm
          )}` === messageConfig.invalidCellText
            ? messageConfig.invalidCellText
            : `${formatNumberForDisplayFixedThreeDecimalPlaces(
                selectedStation?.location?.elevationKm
              )} km`
        }
      />,
      <LabelValueToolbarItem
        key="type"
        customStylePrefix="ian"
        label="Type"
        tooltip="Single station or array"
        widthPx={400}
        labelValue={
          stationTypeToFriendlyNameMap.get(selectedStation?.type) ?? messageConfig.invalidCellText
        }
      />,
      <LabelValueToolbarItem
        key="description"
        customStylePrefix="ian"
        label="Description"
        tooltip="Station description"
        widthPx={400}
        labelValue={
          selectedStation?.description
            ? selectedStation.description.replace(/_/g, ' ')
            : messageConfig.invalidCellText
        }
      />
    ],
    [
      selectedStation?.description,
      selectedStation?.location?.depthKm,
      selectedStation?.location?.elevationKm,
      selectedStation?.location?.latitudeDegrees,
      selectedStation?.location?.longitudeDegrees,
      selectedStation?.name,
      selectedStation?.type,
      stationName
    ]
  );

  return (
    <>
      <Toolbar
        toolbarWidthPx={displayWidthPx}
        parentContainerPaddingPx={systemConfig.marginForToolbarPx}
        itemsLeft={leftToolbarItems}
      />
      <Toolbar
        toolbarWidthPx={displayWidthPx}
        parentContainerPaddingPx={systemConfig.marginForToolbarPx}
        overflowIcon={IconNames.INFO_SIGN}
        itemsLeft={rightToolbarItems}
      />
    </>
  );
}
