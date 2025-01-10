import type { HotkeyConfig } from '@blueprintjs/core';
import { useHotkeys } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import {
  buildHotkeyConfigArray,
  selectOpenEventId,
  useAppSelector,
  useKeyboardShortcutConfigurations
} from '@gms/ui-state';
import debounce from 'lodash/debounce';
import React from 'react';

import { useToggleQcMaskVisibilityHotkeyConfig } from '~analyst-ui/components/waveform/components/waveform-controls/qc-mask-control';
import type { RotationDialogState } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/types';

import type { CreateEventMenuState } from '../menus/create-event-menu-item';
import { useGetWaveformsKeyboardShortcut, useResetAllWaveformAmplitudeConfig } from './hooks';
import { useSignalDetectionConfigs } from './signal-detection-hotkey-configs';

export const useCloseSplitChannelOverlayKeyboardShortcut = (): {
  closeCreateSignalDetectionOverlay: ConfigurationTypes.HotkeyConfiguration;
} => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  return React.useMemo(
    () => ({
      closeCreateSignalDetectionOverlay:
        keyboardShortcutConfigurations?.hotkeys?.closeCreateSignalDetectionOverlay
    }),
    [keyboardShortcutConfigurations?.hotkeys?.closeCreateSignalDetectionOverlay]
  );
};

/**
 * Returns the hotkey config for ZAS that zooms, aligns, and sorts the display,
 *
 * @param zoomAlignSort a function that zooms, aligns, sorts the waveform display. Must be referentially stable.
 * @param featurePredictionQueryDataUnavailable
 * @returns a keydown config for handling ZAS that zooms, aligns, sorts the display
 */
export const useZASHotkeyConfig = (
  featurePredictionQueryDataUnavailable: boolean,
  zoomAlignSort: () => void
) => {
  const openEventId = useAppSelector(selectOpenEventId);
  const canZAS = !(
    openEventId === '' ||
    openEventId === null ||
    openEventId === undefined ||
    featurePredictionQueryDataUnavailable
  );

  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.zas,
      zoomAlignSort,
      undefined,
      !canZAS
    );
  }, [canZAS, zoomAlignSort, waveformsKeyboardShortcuts]);
};

/**
 * Returns a hotkey config for create event beam
 *
 * @param createEventBeam a function that creates an event beam
 * @returns a keydown config for handling create event beam
 */
const useCreateEventBeamConfig = (createEventBeam: () => Promise<void>) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.createEventBeam,
      createEventBeam,
      undefined
    );
  }, [createEventBeam, waveformsKeyboardShortcuts]);
};

export const useToggleAlignmentHotkeyConfig = (toggleAlignment: () => void) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.toggleAlignment,
      toggleAlignment,
      undefined,
      false
    );
  }, [toggleAlignment, waveformsKeyboardShortcuts?.toggleAlignment]);
};

export const useHideMeasureWindowHotkeyConfig = (
  isMeasureWindowVisible: boolean,
  toggleMeasureWindowVisibility
) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  const canHideMeasureWindow = !!isMeasureWindowVisible;

  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.hideMeasureWindow,
      toggleMeasureWindowVisibility,
      undefined,
      !canHideMeasureWindow,
      false
    );
  }, [
    canHideMeasureWindow,
    toggleMeasureWindowVisibility,
    waveformsKeyboardShortcuts?.hideMeasureWindow
  ]);
};

export const useCurrentPhaseMenuHotkeyConfig = (
  setCurrentPhaseMenuVisibility: (value: boolean) => void
) => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  const toggleCurrentPhaseMenuVisibility = React.useCallback(
    () => setCurrentPhaseMenuVisibility(true),
    [setCurrentPhaseMenuVisibility]
  );

  return React.useMemo(
    () =>
      buildHotkeyConfigArray(
        keyboardShortcutConfigurations?.hotkeys?.toggleCurrentPhaseMenu,
        toggleCurrentPhaseMenuVisibility,
        undefined,
        false
      ),
    [
      keyboardShortcutConfigurations?.hotkeys?.toggleCurrentPhaseMenu,
      toggleCurrentPhaseMenuVisibility
    ]
  );
};

/**
 * Hook to build hotkeys to increase or reduce the number of waveforms displayed
 *
 * @param setAnalystNumberOfWaveforms
 * @param analystNumberOfWaveforms
 */
export const useWaveformNumberHotkeyConfig = (
  setAnalystNumberOfWaveforms: (value: number) => void,
  analystNumberOfWaveforms: number
) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    const decreaseHotkeys = buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.decreaseVisibleWaveforms,
      (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAnalystNumberOfWaveforms(analystNumberOfWaveforms - 1);
      }
    );

    const increaseHotkeys = buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.increaseVisibleWaveforms,
      (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAnalystNumberOfWaveforms(analystNumberOfWaveforms + 1);
      }
    );

    return [...decreaseHotkeys, ...increaseHotkeys];
  }, [
    waveformsKeyboardShortcuts?.decreaseVisibleWaveforms,
    waveformsKeyboardShortcuts?.increaseVisibleWaveforms,
    setAnalystNumberOfWaveforms,
    analystNumberOfWaveforms
  ]);
};

export const useCloseSplitChannelOverlayHotkeyConfig = (closeSplitWeavessChannels: () => void) => {
  const signalDetectionOverlayKeyboardShortcuts = useCloseSplitChannelOverlayKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      signalDetectionOverlayKeyboardShortcuts?.closeCreateSignalDetectionOverlay,
      (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        closeSplitWeavessChannels();
      }
    );
  }, [
    signalDetectionOverlayKeyboardShortcuts?.closeCreateSignalDetectionOverlay,
    closeSplitWeavessChannels
  ]);
};

export const useScaleAllWaveformAmplitudeConfig = (scaleAllWaveformAmplitude: () => void) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.scaleAllWaveformAmplitude,
      scaleAllWaveformAmplitude
    );
  }, [scaleAllWaveformAmplitude, waveformsKeyboardShortcuts?.scaleAllWaveformAmplitude]);
};

export const useToggleUncertaintyConfig = (
  shouldShowTimeUncertainty: boolean,
  toggleUncertainty: (value: boolean) => void
) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.toggleUncertainty,
      (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleUncertainty(!shouldShowTimeUncertainty);
      }
    );
  }, [shouldShowTimeUncertainty, toggleUncertainty, waveformsKeyboardShortcuts?.toggleUncertainty]);
};

export const useResetSelectedWaveformAmplitudeConfig = (
  selectedChannelIds: string[],
  resetSelectedWaveformAmplitudeScaling: (
    selectedChannelIds: string[],
    isMeasureWindow: boolean
  ) => void
) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      waveformsKeyboardShortcuts?.resetSelectedWaveformAmplitudeScaling,
      () => resetSelectedWaveformAmplitudeScaling(selectedChannelIds, false)
    );
  }, [
    resetSelectedWaveformAmplitudeScaling,
    selectedChannelIds,
    waveformsKeyboardShortcuts?.resetSelectedWaveformAmplitudeScaling
  ]);
};

/**
 * @param rotateWaveforms a function to call that rotates the waveforms. This function should handle any validation needed.
 * @returns a hotkey config array for use with blueprint hooks
 */
export const useRotateWaveformsConfig = (
  rotateWaveforms: (newState?: RotationDialogState) => void
) => {
  const waveformsKeyboardShortcuts = useGetWaveformsKeyboardShortcut();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(waveformsKeyboardShortcuts?.rotate, rotateWaveforms);
  }, [rotateWaveforms, waveformsKeyboardShortcuts?.rotate]);
};

export interface WaveformHotkeysProps {
  selectedSignalDetectionsIds: string[];
  featurePredictionQueryDataUnavailable: boolean;
  isMeasureWindowVisible: boolean;
  shouldShowTimeUncertainty: boolean;
  analystNumberOfWaveforms: number;
  selectedStationIds: string[];
  zoomAlignSort: () => void;
  createEventBeam: () => Promise<void>;
  setPhaseMenuVisibility: (value: boolean) => void;
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
  setCurrentPhaseMenuVisibility: (value: boolean) => void;
  toggleAlignment: () => void;
  toggleMeasureWindowVisibility: () => void;
  setAnalystNumberOfWaveforms: (value: number) => void;
  closeSplitChannelOverlayCallback: () => void;
  scaleAllWaveformAmplitude: () => void;
  toggleUncertainty: (value: boolean) => void;
  resetSelectedWaveformAmplitudeScaling: (channelIds: string[], isMeasureWindow: boolean) => void;
  resetAllWaveformAmplitudeScaling: (force: boolean) => void;
  rotate: (newState?: RotationDialogState) => void;
  isSplitChannelOverlayOpen: boolean;
}

/**
 * Hotkey handler for the Waveform display at a GMS-level. Hotkeys established here
 * should apply to a "GMS-specific" functionality.
 */
export const WaveformHotkeys = React.memo(function WaveformHotkeys({
  zoomAlignSort,
  createEventBeam,
  selectedSignalDetectionsIds,
  featurePredictionQueryDataUnavailable,
  children,
  selectedStationIds,
  isMeasureWindowVisible,
  analystNumberOfWaveforms,
  shouldShowTimeUncertainty,
  setPhaseMenuVisibility,
  setCreateEventMenuState,
  setCurrentPhaseMenuVisibility,
  toggleAlignment,
  toggleMeasureWindowVisibility,
  setAnalystNumberOfWaveforms,
  closeSplitChannelOverlayCallback,
  scaleAllWaveformAmplitude,
  toggleUncertainty,
  resetSelectedWaveformAmplitudeScaling,
  resetAllWaveformAmplitudeScaling,
  isSplitChannelOverlayOpen,
  rotate
}: React.PropsWithChildren<WaveformHotkeysProps>) {
  const zasHotkeyConfig = useZASHotkeyConfig(featurePredictionQueryDataUnavailable, zoomAlignSort);
  const createEventBeamConfig = useCreateEventBeamConfig(createEventBeam);

  const signalDetectionConfigs = useSignalDetectionConfigs(
    selectedSignalDetectionsIds,
    setPhaseMenuVisibility,
    setCreateEventMenuState
  );

  const toggleCurrentPhaseMenuConfig = useCurrentPhaseMenuHotkeyConfig(
    setCurrentPhaseMenuVisibility
  );

  const toggleQcMaskVisibilityConfig = useToggleQcMaskVisibilityHotkeyConfig();

  const toggleAlignmentConfig = useToggleAlignmentHotkeyConfig(toggleAlignment);

  const hideMeasureWindowConfig = useHideMeasureWindowHotkeyConfig(
    isMeasureWindowVisible,
    toggleMeasureWindowVisibility
  );

  const waveformNumberConfig = useWaveformNumberHotkeyConfig(
    setAnalystNumberOfWaveforms,
    analystNumberOfWaveforms
  );

  const closeSplitChannelOverlayConfig = useCloseSplitChannelOverlayHotkeyConfig(
    closeSplitChannelOverlayCallback
  );

  const scaleAllWaveformAmplitudeConfig =
    useScaleAllWaveformAmplitudeConfig(scaleAllWaveformAmplitude);

  const toggleUncertaintyConfig = useToggleUncertaintyConfig(
    shouldShowTimeUncertainty,
    toggleUncertainty
  );

  const resetAllAmplitudeScalingConfig = useResetAllWaveformAmplitudeConfig(
    resetAllWaveformAmplitudeScaling
  );

  const resetSelectedAmplitudeScalingConfig = useResetSelectedWaveformAmplitudeConfig(
    selectedStationIds,
    resetSelectedWaveformAmplitudeScaling
  );

  const rotateHotkeyConfig = useRotateWaveformsConfig(rotate);

  const configs = React.useMemo<HotkeyConfig[]>(() => {
    // combine hotkey configurations
    return isSplitChannelOverlayOpen
      ? [
          ...hideMeasureWindowConfig,
          ...scaleAllWaveformAmplitudeConfig,
          ...resetAllAmplitudeScalingConfig,
          ...resetSelectedAmplitudeScalingConfig,
          ...closeSplitChannelOverlayConfig
        ]
      : [
          ...signalDetectionConfigs,
          ...toggleCurrentPhaseMenuConfig,
          ...zasHotkeyConfig,
          ...toggleQcMaskVisibilityConfig,
          ...createEventBeamConfig,
          ...toggleAlignmentConfig,
          ...hideMeasureWindowConfig,
          ...waveformNumberConfig,
          ...closeSplitChannelOverlayConfig,
          ...scaleAllWaveformAmplitudeConfig,
          ...toggleUncertaintyConfig,
          ...resetAllAmplitudeScalingConfig,
          ...resetSelectedAmplitudeScalingConfig,
          ...rotateHotkeyConfig
        ];
  }, [
    isSplitChannelOverlayOpen,
    zasHotkeyConfig,
    createEventBeamConfig,
    toggleQcMaskVisibilityConfig,
    toggleAlignmentConfig,
    hideMeasureWindowConfig,
    scaleAllWaveformAmplitudeConfig,
    resetAllAmplitudeScalingConfig,
    resetSelectedAmplitudeScalingConfig,
    signalDetectionConfigs,
    toggleCurrentPhaseMenuConfig,
    waveformNumberConfig,
    closeSplitChannelOverlayConfig,
    toggleUncertaintyConfig,
    rotateHotkeyConfig
  ]);

  const { handleKeyDown } = useHotkeys(configs);
  const debounceMs = 300;
  return (
    <div
      onKeyDown={debounce(evt => handleKeyDown(evt), debounceMs, { leading: true, trailing: true })}
      style={{ height: '100%' }}
      role="tab"
      tabIndex={-1}
    >
      {children}
    </div>
  );
});
