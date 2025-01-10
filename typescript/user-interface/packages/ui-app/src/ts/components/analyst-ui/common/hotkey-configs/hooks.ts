import type { ConfigurationTypes } from '@gms/common-model';
import {
  buildHotkeyConfigArray,
  useKeyboardShortcutConfigurationsWithValidation
} from '@gms/ui-state';
import React from 'react';

/**
 * @returns the HotkeyConfiguration for waveforms
 */
export const useGetWaveformsKeyboardShortcut = (): {
  zas: ConfigurationTypes.HotkeyConfiguration;
  createEventBeam: ConfigurationTypes.HotkeyConfiguration;
  toggleAlignment: ConfigurationTypes.HotkeyConfiguration;
  hideMeasureWindow: ConfigurationTypes.HotkeyConfiguration;
  increaseVisibleWaveforms: ConfigurationTypes.HotkeyConfiguration;
  decreaseVisibleWaveforms: ConfigurationTypes.HotkeyConfiguration;
  scaleAllWaveformAmplitude: ConfigurationTypes.HotkeyConfiguration;
  toggleUncertainty: ConfigurationTypes.HotkeyConfiguration;
  resetSelectedWaveformAmplitudeScaling: ConfigurationTypes.HotkeyConfiguration;
  resetAllWaveformAmplitudeScaling: ConfigurationTypes.HotkeyConfiguration;
  rotate: ConfigurationTypes.HotkeyConfiguration;
} => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurationsWithValidation();

  return React.useMemo(
    () => ({
      zas: keyboardShortcutConfigurations.hotkeys.zas,
      createEventBeam: keyboardShortcutConfigurations.hotkeys.createEventBeam,
      toggleAlignment: keyboardShortcutConfigurations.hotkeys.toggleAlignment,
      hideMeasureWindow: keyboardShortcutConfigurations.hotkeys.hideMeasureWindow,
      increaseVisibleWaveforms: keyboardShortcutConfigurations.hotkeys.increaseVisibleWaveforms,
      decreaseVisibleWaveforms: keyboardShortcutConfigurations.hotkeys.decreaseVisibleWaveforms,
      scaleAllWaveformAmplitude: keyboardShortcutConfigurations.hotkeys.scaleAllWaveformAmplitude,
      toggleUncertainty: keyboardShortcutConfigurations.hotkeys.toggleUncertainty,
      resetSelectedWaveformAmplitudeScaling:
        keyboardShortcutConfigurations.hotkeys.resetSelectedWaveformAmplitudeScaling,
      resetAllWaveformAmplitudeScaling:
        keyboardShortcutConfigurations.hotkeys.resetAllWaveformAmplitudeScaling,
      rotate: keyboardShortcutConfigurations.hotkeys.rotate
    }),
    [
      keyboardShortcutConfigurations.hotkeys.zas,
      keyboardShortcutConfigurations.hotkeys.createEventBeam,
      keyboardShortcutConfigurations.hotkeys.toggleAlignment,
      keyboardShortcutConfigurations.hotkeys.hideMeasureWindow,
      keyboardShortcutConfigurations.hotkeys.increaseVisibleWaveforms,
      keyboardShortcutConfigurations.hotkeys.decreaseVisibleWaveforms,
      keyboardShortcutConfigurations.hotkeys.scaleAllWaveformAmplitude,
      keyboardShortcutConfigurations.hotkeys.toggleUncertainty,
      keyboardShortcutConfigurations.hotkeys.resetSelectedWaveformAmplitudeScaling,
      keyboardShortcutConfigurations.hotkeys.resetAllWaveformAmplitudeScaling,
      keyboardShortcutConfigurations.hotkeys.rotate
    ]
  );
};

/**
 * @returns HotkeyConfig list for resetting waveform amplitude scaling
 */
export const useResetAllWaveformAmplitudeConfig = (
  resetAllWaveformAmplitudeScaling: (force: boolean) => void
) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.resetAllWaveformAmplitudeScaling,
      () => resetAllWaveformAmplitudeScaling(true)
    );
  }, [
    resetAllWaveformAmplitudeScaling,
    waveformsKeyboardShortcuts?.resetAllWaveformAmplitudeScaling
  ]);
};
