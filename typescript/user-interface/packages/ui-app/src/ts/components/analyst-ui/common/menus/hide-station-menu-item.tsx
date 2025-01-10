import { MenuItem } from '@blueprintjs/core';
import React from 'react';

export interface HideStationMenuItemProps {
  stationName: string;
  hideStationCallback: (stationName: any) => void;
  showHideText?: string;
  disabled?: boolean;
}

/**
 * Menu item intended to be used with the waveform display to show/hide stations
 *
 * @param props
 * @constructor
 */
export function HideStationMenuItem(props: HideStationMenuItemProps) {
  const { stationName, hideStationCallback, showHideText, disabled } = props;
  return (
    <MenuItem
      disabled={disabled}
      data-cy={`hide-${stationName}`}
      className="hide-station-menu-item"
      onClick={hideStationCallback}
      text={showHideText ?? `Hide ${stationName}`}
      title={disabled ? 'Waveform display and an interval must be open to show or hide' : ''}
    />
  );
}
