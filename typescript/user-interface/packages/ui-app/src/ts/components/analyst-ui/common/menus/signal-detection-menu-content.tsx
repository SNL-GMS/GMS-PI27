import { Menu, MenuItem } from '@blueprintjs/core';
import { hideImperativeContextMenu } from '@gms/ui-core-components';
import {
  selectActionTargetSignalDetectionIds,
  selectAreSelectedSdsAllDeleted,
  selectCurrentPhase,
  selectDefaultPhase,
  selectSelectedPhasesForSignalDetectionsCurrentHypotheses,
  selectSelectedSignalDetectionIdsNotDeleted,
  useAppSelector,
  useDetermineActionTargetsByType,
  useKeyboardShortcutConfigurations,
  useSetActionType,
  useSetSignalDetectionActionTargets,
  useUpdateSignalDetectionPhase
} from '@gms/ui-state';
import React from 'react';

import type { CreateEventMenuItemProps } from '~analyst-ui/common/menus/create-event-menu-item';
import { CreateEventMenuItem } from '~analyst-ui/common/menus/create-event-menu-item';
import {
  formatHotkeyString,
  getKeyboardShortcutCombos
} from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import { EventAssociationMenuItem } from './event-association-menu-item';
import { SignalDetectionDeleteMenuItem } from './signal-detection-delete-menu-item';
import { SignalDetectionExportMenuItem } from './signal-detection-export-menu-item';
import { SignalDetectionWaveformRotationMenuItem } from './signal-detection-waveform-rotation-menu-item';

export interface SignalDetectionMenuContentProps {
  readonly signalDetectionDetailsOnClick: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
  readonly setSdIdsToShowFkOnClick: () => void;
  readonly setPhaseMenuVisibilityCb: (visibility: boolean) => void;
  readonly setMeasurementModeEntries?: (entries: Record<string, boolean>) => void;
  readonly createEventMenuProps?: CreateEventMenuItemProps;
  /**  Default is false. Shows/hides menu options specific to the Azimuth Slowness display */
  readonly isAzimuthSlownessContextMenu?: boolean;
}

/**
 * Provides context menu options for signal detection
 *
 * @returns the menu item options
 */
export function SignalDetectionMenuContent({
  signalDetectionDetailsOnClick,
  setSdIdsToShowFkOnClick,
  setPhaseMenuVisibilityCb,
  createEventMenuProps,
  isAzimuthSlownessContextMenu = false
}: SignalDetectionMenuContentProps): JSX.Element {
  const setActionType = useSetActionType();
  const determineActionTargetsByType = useDetermineActionTargetsByType();
  const signalDetectionPhaseUpdate = useUpdateSignalDetectionPhase();

  const keyboardShortcutConfigs = useKeyboardShortcutConfigurations();
  const areSelectedSdsAllDeleted = useAppSelector(selectAreSelectedSdsAllDeleted);
  const selectedSignalDetectionIdsNotDeleted = useAppSelector(
    selectSelectedSignalDetectionIdsNotDeleted
  );
  const defaultPhase = useAppSelector(selectDefaultPhase);
  const currentPhase = useAppSelector(selectCurrentPhase);
  const selectedPhases = useAppSelector(selectSelectedPhasesForSignalDetectionsCurrentHypotheses);

  const actionTargetSignalDetectionsIds = useAppSelector(selectActionTargetSignalDetectionIds);
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();

  const handleSetPhase = React.useCallback(
    async (phase: string) => {
      await signalDetectionPhaseUpdate(selectedSignalDetectionIdsNotDeleted, phase);
    },
    [selectedSignalDetectionIdsNotDeleted, signalDetectionPhaseUpdate]
  );

  // TODO: fix when SDs (in conflict) is implemented
  const anyInConflictAndNotAssociatedToOpenEvent = false;
  const menuOptionSignalDetectionDetails = (
    <MenuItem
      text="Open signal detection details"
      label={
        keyboardShortcutConfigs?.clickEvents?.showSignalDetectionDetails
          ? formatHotkeyString(
              getKeyboardShortcutCombos(
                keyboardShortcutConfigs?.clickEvents?.showSignalDetectionDetails,
                keyboardShortcutConfigs
              )[0]
            )
          : ''
      }
      disabled={determineActionTargetsByType('details').length !== 1}
      onClick={signalDetectionDetailsOnClick}
      onMouseEnter={() => setActionType('details')}
      onMouseLeave={() => setActionType(null)}
    />
  );
  const menuOptionSetPhase = (
    <MenuItem
      text={`Set ${determineActionTargetsByType('phase').length} phase${
        determineActionTargetsByType('phase').length === 1 ? '' : 's'
      }`}
      label={
        keyboardShortcutConfigs?.hotkeys?.toggleSetPhaseMenu
          ? formatHotkeyString(keyboardShortcutConfigs?.hotkeys?.toggleSetPhaseMenu?.combos[0])
          : ''
      }
      disabled={
        determineActionTargetsByType('phase').length === 0 ||
        anyInConflictAndNotAssociatedToOpenEvent ||
        areSelectedSdsAllDeleted
      }
      onClick={() => {
        hideImperativeContextMenu({
          callback: () => {
            setSignalDetectionActionTargets(actionTargetSignalDetectionsIds);
            setPhaseMenuVisibilityCb(true);
          }
        });
      }}
      onMouseEnter={() => setActionType('phase')}
      onMouseLeave={() => setActionType(null)}
    />
  );
  const menuOptionSetCurrentPhase = (
    <MenuItem
      text={`Set ${
        determineActionTargetsByType('current phase').length
      } to current phase: ${currentPhase}`}
      label={
        keyboardShortcutConfigs?.hotkeys?.currentPhaseLabel
          ? formatHotkeyString(keyboardShortcutConfigs.hotkeys?.currentPhaseLabel.combos[0])
          : ''
      }
      disabled={
        determineActionTargetsByType('current phase').length === 0 ||
        selectedPhases.every(phase => phase === currentPhase)
      }
      onClick={async () => handleSetPhase(currentPhase)}
      onMouseEnter={() => setActionType('current phase')}
      onMouseLeave={() => setActionType(null)}
    />
  );
  const menuOptionSetDefaultPhase = (
    <MenuItem
      text={`Set ${
        determineActionTargetsByType('default phase').length
      } to default phase: ${defaultPhase}`}
      label={
        keyboardShortcutConfigs?.hotkeys?.defaultPhaseLabel
          ? formatHotkeyString(keyboardShortcutConfigs.hotkeys?.defaultPhaseLabel.combos[0])
          : ''
      }
      disabled={
        determineActionTargetsByType('default phase').length === 0 ||
        selectedPhases.every(phase => phase === defaultPhase)
      }
      onClick={async () => handleSetPhase(defaultPhase)}
      onMouseEnter={() => setActionType('default phase')}
      onMouseLeave={() => setActionType(null)}
    />
  );
  const menuOptionShowFk = (
    <MenuItem
      text={`Show ${determineActionTargetsByType('fk').length} FK`}
      disabled={
        anyInConflictAndNotAssociatedToOpenEvent || determineActionTargetsByType('fk').length === 0
      }
      onClick={setSdIdsToShowFkOnClick}
      onMouseEnter={() => setActionType('fk')}
      onMouseLeave={() => setActionType(null)}
    />
  );
  return (
    <Menu className="signal-detection-table__context-menu">
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      {createEventMenuProps ? <CreateEventMenuItem {...createEventMenuProps} /> : undefined}
      {menuOptionSignalDetectionDetails}
      <EventAssociationMenuItem />
      {menuOptionSetPhase}
      {menuOptionSetCurrentPhase}
      {menuOptionSetDefaultPhase}
      {!isAzimuthSlownessContextMenu ? menuOptionShowFk : undefined}
      {/* LEGACY future work
      {setMeasurementModeEntries && (
        <MeasurementModeContextMenuItem
          currentOpenEvent={currentOpenEvent}
          openIntervalName={openIntervalName}
          measurementMode={undefined}
          signalDetections={Object.values(signalDetections)}
          selectedSds={selectedSignalDetections}
          setMeasurementModeEntries={setMeasurementModeEntries}
        />
      )} */}
      <SignalDetectionWaveformRotationMenuItem />
      <SignalDetectionDeleteMenuItem />
      <SignalDetectionExportMenuItem />
    </Menu>
  );
}
