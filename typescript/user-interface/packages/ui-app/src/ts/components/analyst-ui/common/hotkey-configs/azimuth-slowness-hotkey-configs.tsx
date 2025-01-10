import type { HotkeyConfig } from '@blueprintjs/core';
import { useHotkeys } from '@blueprintjs/core';
import { buildHotkeyConfigArray, useKeyboardShortcutConfigurations } from '@gms/ui-state';
import React from 'react';

import { useResetAllWaveformAmplitudeConfig } from './hooks';

export interface AzimuthSlownessHotkeysProps {
  /** Handler function to advance to the next FK */
  nextFk: () => void;
  /** Handler function reset waveform amplitude scaling */
  resetAllWaveformAmplitudeScaling: (force: boolean) => void;
}

/**
 * Hotkey handler for the Azimuth Slowness display. Hotkeys established here should apply
 * to a "GMS-specific" functionality.
 */
export const AzimuthSlownessHotkeys = React.memo(function AzimuthSlownessHotkeys({
  children,
  nextFk,
  resetAllWaveformAmplitudeScaling
}: React.PropsWithChildren<AzimuthSlownessHotkeysProps>) {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  const nextFkConfig = React.useMemo(
    () =>
      buildHotkeyConfigArray(keyboardShortcutConfigurations?.hotkeys?.nextFk, () => {
        nextFk();
      }),
    [keyboardShortcutConfigurations?.hotkeys?.nextFk, nextFk]
  );

  const resetAllAmplitudeScalingConfig = useResetAllWaveformAmplitudeConfig(
    resetAllWaveformAmplitudeScaling
  );

  const configs = React.useMemo<HotkeyConfig[]>(() => {
    // combine hotkey configurations
    return [...nextFkConfig, ...resetAllAmplitudeScalingConfig];
  }, [nextFkConfig, resetAllAmplitudeScalingConfig]);

  const { handleKeyDown } = useHotkeys(configs);

  return (
    <div onKeyDown={handleKeyDown} style={{ height: '100%' }} role="tab" tabIndex={-1}>
      {children}
    </div>
  );
});
