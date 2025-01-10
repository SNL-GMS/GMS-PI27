import { Menu, MenuItem } from '@blueprintjs/core';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import {
  selectSelectedStationsAndChannelIds,
  showImperativeReduxContextMenu,
  useAppSelector,
  useKeyboardShortcutConfigurations
} from '@gms/ui-state';
import type * as Cesium from 'cesium';
import React from 'react';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import { CreateEventMenuItem } from '~analyst-ui/common/menus/create-event-menu-item';
import { HideStationMenuItem } from '~analyst-ui/common/menus/hide-station-menu-item';
import {
  formatHotkeyString,
  getKeyboardShortcutCombos
} from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import { getMapElement, isSiteOrStation } from './map-utils';
import { showStationDetails } from './station-details';

const hideSingleStationMenuItemKey = 'Hide single station menu item';
const hideMultipleStationsMenuItemKey = 'Hide multiple stations menu item';

/**
 * Props which are passed to the {@link StationMenu} externally
 * (via an imperative callback function)
 */
export interface StationMenuProps {
  readonly target: Cesium.Entity;
  readonly canShowContextMenu: boolean;
  /** In degrees */
  readonly latitude: number;
  /** In degrees */
  readonly longitude: number;
  /** set the create event menu state (visibility, latitude, longitude) */
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
  readonly setStationVisibility: (stationName: string, visible: boolean) => void;
  readonly isStationVisible: (stationName: string) => boolean;
}

/**
 * Displays the Map Station Context Menu.
 * Component that renders the map station context menu
 */
export const StationMenu = React.memo(function MapStationContextMenuContent(
  props: StationMenuProps
): JSX.Element {
  const {
    target,
    canShowContextMenu,
    latitude,
    longitude,
    setCreateEventMenuState,
    isStationVisible,
    setStationVisibility
  } = props;

  const entityType = target?.properties?.type?.getValue();
  const keyboardShortcutConfigs = useKeyboardShortcutConfigurations();
  const selectedStationIds = useAppSelector(selectSelectedStationsAndChannelIds);
  if (isSiteOrStation(entityType)) {
    const stationName = target.id;
    const channelShouldBeVisible = !isStationVisible(stationName);
    const dynamicMenuItemText = entityType === 'Station' ? 'station' : 'site';
    const menuItemText = `Open ${dynamicMenuItemText} details`;
    const showText = `Show ${stationName} on Waveform Display`;
    const hideText = `Hide ${stationName} on Waveform Display`;
    const menuString = channelShouldBeVisible ? showText : hideText;
    const hideMenuItem = (
      <HideStationMenuItem
        key={hideSingleStationMenuItemKey}
        disabled={!canShowContextMenu}
        stationName={stationName}
        hideStationCallback={() => {
          setStationVisibility(stationName, channelShouldBeVisible);
        }}
        showHideText={menuString}
      />
    );
    const targetChannels = selectedStationIds.includes(stationName)
      ? selectedStationIds
      : [stationName];
    const showHideMenuItem = (
      <HideStationMenuItem
        key={hideMultipleStationsMenuItemKey}
        stationName={stationName}
        showHideText={
          channelShouldBeVisible
            ? 'Show selected stations on Waveform Display'
            : 'Hide selected stations on Waveform Display'
        }
        hideStationCallback={() => {
          targetChannels.forEach(channel => {
            setStationVisibility(channel, channelShouldBeVisible);
          });
        }}
      />
    );

    return (
      <Menu>
        <CreateEventMenuItem
          latitude={latitude}
          longitude={longitude}
          setCreateEventMenuState={setCreateEventMenuState}
        />
        <MenuItem
          className="menu-item-station-details"
          text={menuItemText}
          label={
            keyboardShortcutConfigs?.clickEvents?.showStationDetails
              ? formatHotkeyString(
                  getKeyboardShortcutCombos(
                    keyboardShortcutConfigs?.clickEvents?.showStationDetails,
                    keyboardShortcutConfigs
                  )[0]
                )
              : ''
          }
          onClick={event => {
            showStationDetails(
              event,
              {
                stationName: target.properties.name.getValue(),
                latitude: target.properties.coordinates.getValue().latitude,
                longitude: target.properties.coordinates.getValue().longitude,
                elevation: target.properties.coordinates.getValue().elevation,
                entityType: target.properties.type.getValue(),
                detailedType: target?.properties?.statype?.getValue() // Used for station details but not site details thus the null checks
              },
              { activeElementOnClose: getMapElement() }
            );
          }}
        />
        {entityType === 'Station' ? [hideMenuItem, showHideMenuItem] : null}
      </Menu>
    );
  }
  return undefined;
});

/**
 * Shows the {@link StationMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link StationMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showStationMenu = (
  event: React.MouseEvent | MouseEvent,
  props: StationMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const {
    canShowContextMenu,
    isStationVisible,
    latitude,
    longitude,
    setCreateEventMenuState,
    setStationVisibility,
    target
  } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <StationMenu
        canShowContextMenu={canShowContextMenu}
        isStationVisible={isStationVisible}
        latitude={latitude}
        longitude={longitude}
        setCreateEventMenuState={setCreateEventMenuState}
        setStationVisibility={setStationVisibility}
        target={target}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
