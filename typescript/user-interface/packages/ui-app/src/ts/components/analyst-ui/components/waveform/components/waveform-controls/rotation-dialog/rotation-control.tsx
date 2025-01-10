import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonToolbarItem } from '@gms/ui-core-components';
import React from 'react';

import { useGetWaveformsKeyboardShortcut } from '~analyst-ui/common/hotkey-configs/hooks';

const buildRotationControl = (
  setRotationDialogVisibility: () => void,
  key: React.Key,
  hotkeyCombo: string
): ToolbarTypes.ToolbarItemElement => (
  <ButtonToolbarItem
    key={key}
    label="Rotation"
    tooltip={`Rotation settings. Create rotated waveforms: (hotkey: ${hotkeyCombo})`}
    onButtonClick={setRotationDialogVisibility}
  />
);

/**
 * Creates a button that opens the rotation dialog when clicked.
 *
 * @param setRotationDialogVisibility Function to set rotation dialog visibility
 * @param key must be unique
 */
export const useRotationControl = (
  setRotationDialogVisibility: (newValue: boolean) => void,
  key: React.Key
): ToolbarTypes.ToolbarItemElement => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  const rotationKeyboardShortcut = waveformsKeyboardShortcuts?.rotate;

  const stableSetRotationDialogVisibility = React.useCallback(
    () => setRotationDialogVisibility(true),
    [setRotationDialogVisibility]
  );

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () =>
      buildRotationControl(
        stableSetRotationDialogVisibility,
        key,
        rotationKeyboardShortcut ? rotationKeyboardShortcut.combos[0] : ''
      ),
    [stableSetRotationDialogVisibility, key, rotationKeyboardShortcut]
  );
};
