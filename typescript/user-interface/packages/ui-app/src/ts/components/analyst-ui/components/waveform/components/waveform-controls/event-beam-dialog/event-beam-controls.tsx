import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonToolbarItem } from '@gms/ui-core-components';
import React from 'react';

import { useGetWaveformsKeyboardShortcut } from '~analyst-ui/common/hotkey-configs/hooks';

const buildEventBeamControl = (
  setEventBeamDialogVisibility: () => void,
  key: React.Key,
  currentOpenEventId: string,
  hotkeyCombo: string
): ToolbarTypes.ToolbarItemElement => (
  <ButtonToolbarItem
    key={key}
    label="Event Beam"
    tooltip={`Event beam settings. Create event beams (hotkey: ${hotkeyCombo}). Open an event to enable`}
    disabled={currentOpenEventId === ''}
    onButtonClick={setEventBeamDialogVisibility}
  />
);

/**
 * Creates a button that opens the event beam dialog when clicked.
 *
 * @param setEventBeamDialogVisibility Function to set event beam dialog visibility
 * @param key must be unique
 */
export const useEventBeamControl = (
  setEventBeamDialogVisibility: (newValue: boolean) => void,
  currentOpenEventId: string,
  key: React.Key
): ToolbarTypes.ToolbarItemElement => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  const eventBeamKeyboardShortcut = waveformsKeyboardShortcuts?.createEventBeam;

  const stableSetEventBeamDialogVisibility = React.useCallback(
    () => setEventBeamDialogVisibility(true),
    [setEventBeamDialogVisibility]
  );

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () =>
      buildEventBeamControl(
        stableSetEventBeamDialogVisibility,
        key,
        currentOpenEventId,
        eventBeamKeyboardShortcut ? eventBeamKeyboardShortcut.combos[0] : ''
      ),
    [stableSetEventBeamDialogVisibility, key, currentOpenEventId, eventBeamKeyboardShortcut]
  );
};
