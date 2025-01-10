import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonToolbarItem } from '@gms/ui-core-components';
import { useKeyboardShortcutConfigurations } from '@gms/ui-state';
import * as React from 'react';

/**
 * Gets the hotkey for ZAS from the Config
 *
 * @returns a string defining the ZAS hotkey
 */
const useGetZASHotkey = (): string => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  // Used for display.  Only display first hotkey
  return React.useMemo(
    () => keyboardShortcutConfigurations?.hotkeys?.zas?.combos[0],
    [keyboardShortcutConfigurations?.hotkeys?.zas]
  );
};

const buildZASControl = (
  zoomAlignSort: () => void,
  canZAS: boolean,
  key: string | number,
  hotkeyCombo: string
): ToolbarTypes.ToolbarItemElement => (
  <ButtonToolbarItem
    key={key}
    cyData="btn-waveform-zas"
    disabled={!canZAS}
    label="ZAS"
    tooltip={`Zoom-align-sort (ZAS) when an event is open (hotkey: ${hotkeyCombo})`}
    onButtonClick={() => zoomAlignSort()}
  />
);

/**
 * Creates a group of one button that zooms, aligns, and sorts the display,
 * or returns the previously created buttons if none of the parameters have
 * changed since last called.
 *
 * @param zoomAlignSort a function that zooms, aligns, sorts the waveform display. Must be referentially stable.
 * @param key must be unique
 */
export const useZASControl = (
  zoomAlignSort: () => void,
  currentOpenEventId: string,
  featurePredictionQueryDataUnavailable: boolean,
  key: string | number
): ToolbarTypes.ToolbarItemElement => {
  const canZAS = !(
    currentOpenEventId === null ||
    currentOpenEventId === undefined ||
    featurePredictionQueryDataUnavailable
  );

  const hotkeyCombo = useGetZASHotkey();

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () => buildZASControl(zoomAlignSort, canZAS, key, hotkeyCombo),
    [zoomAlignSort, canZAS, key, hotkeyCombo]
  );
};
