import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonToolbarItem } from '@gms/ui-core-components';
import {
  selectSelectedSignalDetectionsCurrentHypotheses,
  useAppSelector,
  useKeyboardShortcutConfigurations
} from '@gms/ui-state';
import React from 'react';

import { useCreateEventInteractionHandler } from '../hooks/event-hooks';
import type { CreateEventMenuState } from '../menus/create-event-menu-item';

/**
 * Gets the hotkey for createNewEvent from the analyst config
 *
 * @returns a string defining the createNewEvent hotkey
 */
const useGetCreateEventHotkey = (): string => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  // Used for display, so only display the first hotkey
  return React.useMemo(
    () => keyboardShortcutConfigurations?.hotkeys?.createNewEvent?.combos[0],
    [keyboardShortcutConfigurations?.hotkeys?.createNewEvent?.combos]
  );
};

const buildCreateEventControl = (
  handleEventCreate: () => void,
  key: React.Key,
  hotkeyCombo: string,
  isDisabled: boolean
): ToolbarTypes.ToolbarItemElement => {
  let tooltip;
  if (isDisabled) tooltip = `Cannot create event. All selected signal detections are deleted.`;
  else
    tooltip = `Create new event from selected signal detections or virtual event when no signal detections selected (hotkey: ${hotkeyCombo})`;
  return (
    <ButtonToolbarItem
      key={key}
      cyData="btn-create-event"
      label="Create Event"
      tooltip={tooltip}
      onButtonClick={handleEventCreate}
      disabled={isDisabled}
    />
  );
};

/**
 * Creates a button that will either A) create a new event based on the user's
 * selected signal detections or B) open a dialog that allows a user to create a
 * new virtual event.
 *
 * @param setCreateEventMenuState Setter function for create event dialog visibility
 * @param key must be unique
 */
export const useCreateEventControl = (
  setCreateEventMenuState: (value: CreateEventMenuState) => void,
  key: React.Key
) => {
  const selectedSDHypos = useAppSelector(selectSelectedSignalDetectionsCurrentHypotheses);

  const hotkeyCombo = useGetCreateEventHotkey();
  const createEventOnClick = useCreateEventInteractionHandler(setCreateEventMenuState);

  // disable button if all selected sd's are deleted
  const isDisabled: boolean =
    selectedSDHypos.length > 0 ? selectedSDHypos.filter(sd => !sd.deleted).length === 0 : false;

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () => buildCreateEventControl(createEventOnClick, key, hotkeyCombo, isDisabled),
    [createEventOnClick, key, hotkeyCombo, isDisabled]
  );
};
