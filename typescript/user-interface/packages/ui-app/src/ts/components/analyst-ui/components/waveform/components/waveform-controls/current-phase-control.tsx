import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonToolbarItem } from '@gms/ui-core-components';
import { analystSlice, useAppDispatch, useKeyboardShortcutConfigurations } from '@gms/ui-state';
import * as React from 'react';

/**
 * Gets the hotkey for toggleCurrentPhaseMenu from the Config
 *
 * @returns a string defining the toggleCurrentPhaseMenu hotkey
 */
const useGetCurrentPhaseHotkey = (): string => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  // Used for display.  Only display first hotkey
  return React.useMemo(
    () => keyboardShortcutConfigurations?.hotkeys?.toggleCurrentPhaseMenu?.combos[0],
    [keyboardShortcutConfigurations?.hotkeys?.toggleCurrentPhaseMenu]
  );
};

/**
 * creates and applies dispatch to a function for setting the current phase
 *
 * @returns a function sets the current phase in redux
 */
export const useSetCurrentPhase = () => {
  const dispatch = useAppDispatch();
  return React.useMemo<(phase: string[]) => void>(() => {
    return (phase: string[]) => {
      if (phase && phase.length > 0) {
        dispatch(analystSlice.actions.setCurrentPhase(phase[0]));
      }
    };
  }, [dispatch]);
};

const buildCurrentPhaseControl = (
  openCurrentPhaseMenu: (newValue: boolean) => void,
  key: React.Key,
  hotkeyCombo: string
): ToolbarTypes.ToolbarItemElement => (
  <ButtonToolbarItem
    key={key}
    cyData="btn-current-phase"
    label="Current Phase"
    tooltip={`Current phase menu (hotkey: ${hotkeyCombo})`}
    onButtonClick={() => openCurrentPhaseMenu(true)}
  />
);

/**
 * Creates a button that opens the Current Phase menu when clicked.
 *
 * @param openCurrentPhaseMenu Function to open the current phase menu
 * @param key must be unique
 */
export const useCurrentPhaseControl = (
  openCurrentPhaseMenu: (newValue: boolean) => void,
  key: React.Key
): ToolbarTypes.ToolbarItemElement => {
  const hotkeyCombo = useGetCurrentPhaseHotkey();

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () => buildCurrentPhaseControl(openCurrentPhaseMenu, key, hotkeyCombo),
    [openCurrentPhaseMenu, key, hotkeyCombo]
  );
};
