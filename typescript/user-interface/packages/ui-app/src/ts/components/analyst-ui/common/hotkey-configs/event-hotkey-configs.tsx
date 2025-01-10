import type { HotkeyConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import { buildHotkeyConfigArray, useKeyboardShortcutConfigurations } from '@gms/ui-state';
import React from 'react';

import { useCreateEventInteractionHandler } from '../hooks/event-hooks';
import type { CreateEventMenuState } from '../menus/create-event-menu-item';

/**
 * @returns the HotkeyConfiguration for events
 */
export const useGetEventKeyboardShortcut = (): {
  createNewEvent: HotkeyConfiguration;
} => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  return React.useMemo(
    () => ({
      createNewEvent: keyboardShortcutConfigurations?.hotkeys.createNewEvent
    }),
    [keyboardShortcutConfigurations?.hotkeys.createNewEvent]
  );
};

/**
 * Returns the hotkey config for creating a new event,
 *
 * @returns a keydown config for handling creating a new event
 */
export const useCreateNewEventHotkeyConfig = (
  setCreateEventMenuState: (value: CreateEventMenuState) => void
) => {
  const hotkeyCombo = useGetEventKeyboardShortcut();
  const createEventOnHotkey = useCreateEventInteractionHandler(setCreateEventMenuState);
  return React.useMemo(() => {
    return buildHotkeyConfigArray(hotkeyCombo?.createNewEvent, createEventOnHotkey);
  }, [createEventOnHotkey, hotkeyCombo?.createNewEvent]);
};
