import type { HotkeyConfig } from '@blueprintjs/core';
import { useHotkeys } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import {
  buildHotkeyConfigArray,
  selectOpenEventId,
  selectSelectedSdIds,
  useAppSelector,
  useAssociateSignalDetections,
  useDeleteSignalDetection,
  useKeyboardShortcutConfigurations,
  useSetSignalDetectionActionTargets,
  useUnassociateSignalDetections,
  useUpdateSignalDetectionPhase
} from '@gms/ui-state';
import React from 'react';

import type { CreateEventMenuState } from '../menus/create-event-menu-item';
import { useCreateNewEventHotkeyConfig } from './event-hotkey-configs';

export interface SignalDetectionsHotkeysProps {
  selectedSignalDetectionsIds: string[];
  setPhaseMenuVisibility: (value: boolean) => void;
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
}

/**
 * @returns the HotkeyConfiguration for signal detections
 */
export const useGetSignalDetectionKeyboardShortcut = (): {
  associateSelectedSignalDetections: ConfigurationTypes.HotkeyConfiguration | undefined;
  unassociateSelectedSignalDetections: ConfigurationTypes.HotkeyConfiguration | undefined;
  currentPhaseLabel: ConfigurationTypes.HotkeyConfiguration | undefined;
  defaultPhaseLabel: ConfigurationTypes.HotkeyConfiguration | undefined;
  deleteSignalDetection: ConfigurationTypes.HotkeyConfiguration | undefined;
} => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  return React.useMemo(
    () => ({
      associateSelectedSignalDetections:
        keyboardShortcutConfigurations?.hotkeys?.associateSelectedSignalDetections,
      currentPhaseLabel: keyboardShortcutConfigurations?.hotkeys?.currentPhaseLabel,
      toggleSetPhaseMenu: keyboardShortcutConfigurations?.hotkeys?.toggleSetPhaseMenu,
      unassociateSelectedSignalDetections:
        keyboardShortcutConfigurations?.hotkeys?.unassociateSelectedSignalDetections,
      defaultPhaseLabel: keyboardShortcutConfigurations?.hotkeys?.defaultPhaseLabel,
      deleteSignalDetection: keyboardShortcutConfigurations?.hotkeys?.deleteSignalDetection
    }),
    [
      keyboardShortcutConfigurations?.hotkeys?.associateSelectedSignalDetections,
      keyboardShortcutConfigurations?.hotkeys?.currentPhaseLabel,
      keyboardShortcutConfigurations?.hotkeys?.toggleSetPhaseMenu,
      keyboardShortcutConfigurations?.hotkeys?.unassociateSelectedSignalDetections,
      keyboardShortcutConfigurations?.hotkeys?.defaultPhaseLabel,
      keyboardShortcutConfigurations?.hotkeys?.deleteSignalDetection
    ]
  );
};

/**
 * Returns the hotkey config for unassociate selected signal detections to open event,
 *
 * @param currentOpenEventId
 * @param selectedSignalDetectionsIds
 * @param unassociateSelectedSignalDetections a function that unassociates selected sds to open event
 * @returns a keydown config for handling associating selected sds to open event
 */
export const useUnassociateSignalDetectionHotkeyConfig = (
  currentOpenEventId,
  selectedSignalDetectionsIds: string[]
) => {
  const canAssociate = React.useMemo(
    () =>
      !(
        currentOpenEventId === '' ||
        currentOpenEventId == null ||
        currentOpenEventId === undefined ||
        selectedSignalDetectionsIds == null ||
        selectedSignalDetectionsIds === undefined ||
        selectedSignalDetectionsIds.length === 0
      ),
    [currentOpenEventId, selectedSignalDetectionsIds]
  );

  const hotkeyCombo = useGetSignalDetectionKeyboardShortcut();
  const unassociateSelectedSignalDetections = useUnassociateSignalDetections();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      hotkeyCombo.unassociateSelectedSignalDetections,
      () => unassociateSelectedSignalDetections(selectedSdIds, false),
      undefined,
      !canAssociate
    );
  }, [hotkeyCombo, canAssociate, unassociateSelectedSignalDetections, selectedSdIds]);
};

/**
 * Returns the hotkey config for deleting signal detections
 *
 * @param selectedSignalDetectionsIds selected sds to be deleted
 * @returns a keydown config for handling deleting signal detections
 */
export const useDeleteSignalDetectionHotkeyConfig = (selectedSignalDetectionsIds: string[]) => {
  const canDelete = React.useMemo(
    () =>
      !(
        selectedSignalDetectionsIds == null ||
        selectedSignalDetectionsIds === undefined ||
        selectedSignalDetectionsIds.length === 0
      ),
    [selectedSignalDetectionsIds]
  );
  const hotkeyCombo = useGetSignalDetectionKeyboardShortcut();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const deleteSignalDetection = useDeleteSignalDetection();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      hotkeyCombo.deleteSignalDetection,
      () =>
        deleteSignalDetection({
          signalDetectionIds: selectedSdIds
        }),
      undefined,
      !canDelete
    );
  }, [canDelete, deleteSignalDetection, hotkeyCombo?.deleteSignalDetection, selectedSdIds]);
};

/**
 * Returns the hotkey config for toggling the set phase menu
 *
 * @param callBack function called by onKeyDown for blueprint keyboard shortcut
 * @returns a keydown config for handling toggling set phase menu
 */
export const useSetPhaseMenuHotkeyConfig = (
  callBack: () => void,
  selectedSignalDetectionsIds: string[]
) => {
  const canToggle = React.useMemo(
    () =>
      !(
        selectedSignalDetectionsIds != null &&
        selectedSignalDetectionsIds !== undefined &&
        selectedSignalDetectionsIds.length > 0
      ),
    [selectedSignalDetectionsIds]
  );

  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      keyboardShortcutConfigurations?.hotkeys?.toggleSetPhaseMenu,
      callBack,
      undefined,
      canToggle
    );
  }, [callBack, canToggle, keyboardShortcutConfigurations]);
};

/**
 * Returns the hotkey config for associate selected signal detections to open event,
 *
 * @param currentOpenEventId
 * @param selectedSignalDetectionsIds
 * @param associateSelectedSignalDetections a function that associates selected sds to open event
 * @returns a keydown config for handling associating selected sds to open event
 */
export const useAssociateSignalDetectionHotkeyConfig = (
  currentOpenEventId,
  selectedSignalDetectionsIds: string[]
) => {
  const canAssociate = React.useMemo(
    () =>
      !(
        currentOpenEventId === '' ||
        currentOpenEventId == null ||
        currentOpenEventId === undefined ||
        selectedSignalDetectionsIds == null ||
        selectedSignalDetectionsIds === undefined ||
        selectedSignalDetectionsIds.length === 0
      ),
    [currentOpenEventId, selectedSignalDetectionsIds]
  );

  const hotkeyCombo = useGetSignalDetectionKeyboardShortcut();
  const associateSelectedSignalDetections = useAssociateSignalDetections();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      hotkeyCombo.associateSelectedSignalDetections,
      () => associateSelectedSignalDetections(selectedSdIds),
      undefined,
      !canAssociate
    );
  }, [associateSelectedSignalDetections, canAssociate, hotkeyCombo, selectedSdIds]);
};

/**
 * Returns the hotkey config to update phase label to current phase
 *
 * @returns a keydown config for handling phase label update
 */
export const useCurrentPhaseSignalDetectionHotkeyConfig = (
  selectedSignalDetectionsIds: string[]
) => {
  const hotkeyCombo = useGetSignalDetectionKeyboardShortcut();
  const signalDetectionPhaseUpdate = useUpdateSignalDetectionPhase();
  const currentPhase = useAppSelector(state => state.app.analyst.currentPhase);
  const sdIdsSelected = React.useMemo(
    () =>
      !(
        selectedSignalDetectionsIds == null ||
        selectedSignalDetectionsIds === undefined ||
        selectedSignalDetectionsIds.length === 0
      ),
    [selectedSignalDetectionsIds]
  );
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      hotkeyCombo.currentPhaseLabel,
      async () => signalDetectionPhaseUpdate(selectedSignalDetectionsIds, currentPhase),
      undefined,
      !sdIdsSelected
    );
  }, [
    hotkeyCombo.currentPhaseLabel,
    sdIdsSelected,
    signalDetectionPhaseUpdate,
    selectedSignalDetectionsIds,
    currentPhase
  ]);
};

/**
 * Returns the hotkey config to update phase label to default phase
 *
 * @returns a keydown config for handling phase label update
 */
export const useDefaultPhaseSignalDetectionHotkeyConfig = (
  selectedSignalDetectionsIds: string[]
) => {
  const hotkeyCombo = useGetSignalDetectionKeyboardShortcut();
  const signalDetectionPhaseUpdate = useUpdateSignalDetectionPhase();
  const defaultPhase = useAppSelector(state => state.app.analyst.defaultSignalDetectionPhase);
  const sdIdsSelected = React.useMemo(
    () =>
      !(
        selectedSignalDetectionsIds == null ||
        selectedSignalDetectionsIds === undefined ||
        selectedSignalDetectionsIds.length === 0
      ),
    [selectedSignalDetectionsIds]
  );
  return React.useMemo(() => {
    return buildHotkeyConfigArray(
      hotkeyCombo.defaultPhaseLabel,
      async () => signalDetectionPhaseUpdate(selectedSignalDetectionsIds, defaultPhase),
      undefined,
      !sdIdsSelected
    );
  }, [
    hotkeyCombo.defaultPhaseLabel,
    sdIdsSelected,
    signalDetectionPhaseUpdate,
    selectedSignalDetectionsIds,
    defaultPhase
  ]);
};

/**
 * Builds the hotkey configurations
 *
 * @param currentOpenEventId
 * @param selectedSignalDetectionsIds
 * @param setPhaseMenuVisibility function to show the phase selector menu for the Set Phase action
 * @returns HotkeyConfig list
 */
export const useSignalDetectionConfigs = (
  selectedSignalDetectionsIds: string[],
  setPhaseMenuVisibility: (value: boolean) => void,
  setCreateEventMenuState: (value: CreateEventMenuState) => void
): HotkeyConfig[] => {
  const openEventId = useAppSelector(selectOpenEventId);
  const associateHotkeyConfig = useAssociateSignalDetectionHotkeyConfig(
    openEventId,
    selectedSignalDetectionsIds
  );
  const unassociateHotkeyConfig = useUnassociateSignalDetectionHotkeyConfig(
    openEventId,
    selectedSignalDetectionsIds
  );
  const currentPhaseHotkeyConfig = useCurrentPhaseSignalDetectionHotkeyConfig(
    selectedSignalDetectionsIds
  );
  const defaultPhaseHotkeyConfig = useDefaultPhaseSignalDetectionHotkeyConfig(
    selectedSignalDetectionsIds
  );
  const createNewEventHotKeyConfig = useCreateNewEventHotkeyConfig(setCreateEventMenuState);

  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();

  const toggleSetPhaseMenuCallback = React.useCallback(() => {
    // set the actionable targets
    setSignalDetectionActionTargets(selectedSignalDetectionsIds);
    setPhaseMenuVisibility(true);
  }, [selectedSignalDetectionsIds, setPhaseMenuVisibility, setSignalDetectionActionTargets]);

  const setPhaseMenuHotkeyConfig = useSetPhaseMenuHotkeyConfig(
    toggleSetPhaseMenuCallback,
    selectedSignalDetectionsIds
  );

  const deleteSignalDetectionMenuHotkeyConfig = useDeleteSignalDetectionHotkeyConfig(
    selectedSignalDetectionsIds
  );

  return React.useMemo(() => {
    // combine hotkey configurations
    return [
      ...associateHotkeyConfig,
      ...createNewEventHotKeyConfig,
      ...currentPhaseHotkeyConfig,
      ...defaultPhaseHotkeyConfig,
      ...setPhaseMenuHotkeyConfig,
      ...unassociateHotkeyConfig,
      ...deleteSignalDetectionMenuHotkeyConfig
    ];
  }, [
    associateHotkeyConfig,
    createNewEventHotKeyConfig,
    currentPhaseHotkeyConfig,
    defaultPhaseHotkeyConfig,
    setPhaseMenuHotkeyConfig,
    unassociateHotkeyConfig,
    deleteSignalDetectionMenuHotkeyConfig
  ]);
};

/**
 * Builds the keydown handler for blue print hotkeys
 *
 * @param currentOpenEventId
 * @param selectedSignalDetectionsIds
 * @param setPhaseMenuVisibility function to show the phase selector menu for the Set Phase action
 * @returns
 */
export const useSignalDetectionConfigKeyDown = (
  selectedSignalDetectionsIds: string[],
  setPhaseMenuVisibility: (value: boolean) => void,
  setCreateEventMenuState: (value: CreateEventMenuState) => void
): React.KeyboardEventHandler<HTMLElement> => {
  const signalDetectionConfigs = useSignalDetectionConfigs(
    selectedSignalDetectionsIds,
    setPhaseMenuVisibility,
    setCreateEventMenuState
  );

  const { handleKeyDown } = useHotkeys(signalDetectionConfigs);
  return handleKeyDown;
};

/**
 * Wrapper component to handle hotkeys for signal detection actions
 *
 * @param currentOpenEventId
 * @param selectedSignalDetectionsIds
 * @param setPhaseMenuVisibility function to show the phase selector menu for the Set Phase action
 * @returns wrapper component to handle hotkey actions when triggered
 */
export const SignalDetectionsHotkeys = React.memo(function SignalDetectionsHotkeys({
  selectedSignalDetectionsIds,
  setPhaseMenuVisibility,
  setCreateEventMenuState,
  children
}: React.PropsWithChildren<SignalDetectionsHotkeysProps>) {
  const handleKeyDown = useSignalDetectionConfigKeyDown(
    selectedSignalDetectionsIds,
    setPhaseMenuVisibility,
    setCreateEventMenuState
  );

  return (
    <div onKeyDown={handleKeyDown} style={{ height: '100%' }} role="tab" tabIndex={-1}>
      {children}
    </div>
  );
});
