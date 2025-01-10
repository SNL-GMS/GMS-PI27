import { MenuItem } from '@blueprintjs/core';
import type { EventTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import {
  selectActionTargetSignalDetectionIds,
  selectAreSelectedSdsAllDeleted,
  selectOpenEvent,
  selectOpenIntervalName,
  useAppSelector,
  useAssociateSignalDetections,
  useDetermineActionTargetsByType,
  useSetActionType,
  useUnassociateSignalDetections
} from '@gms/ui-state';
import React from 'react';

import { formatHotkeyString } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import { useGetSignalDetectionKeyboardShortcut } from '../hotkey-configs/signal-detection-hotkey-configs';

/**
 * Displays a blueprint context menu for event association.
 * This is a submenu for use in other menus
 *
 * @returns the event association context menu
 */

export function EventAssociationMenuItem(): JSX.Element {
  const hotkeyCombo = useGetSignalDetectionKeyboardShortcut();
  const setActionType = useSetActionType();
  const determineActionTargetsByType = useDetermineActionTargetsByType();

  // Only show the first hotkey in the menu
  const associateSelectedSignalDetectionsHotkey =
    hotkeyCombo.associateSelectedSignalDetections?.combos[0];

  const unassociateSelectedSignalDetectionsHotkey =
    hotkeyCombo.unassociateSelectedSignalDetections?.combos[0];

  const associateSignalDetections = useAssociateSignalDetections();
  const unassociateSignalDetections = useUnassociateSignalDetections();

  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const actionTargetSignalDetectionIds = useAppSelector(selectActionTargetSignalDetectionIds);

  const openIntervalName: string = useAppSelector(selectOpenIntervalName);
  const areSelectedSdsAllDeleted = useAppSelector(selectAreSelectedSdsAllDeleted);

  const currentOpenEventPreferredEventHypothesis: EventTypes.EventHypothesis =
    findPreferredEventHypothesisByOpenStageOrDefaultStage(currentOpenEvent, openIntervalName);

  /** Memoized handler for onMouseLeave */
  const clearActionType = React.useCallback(() => {
    setActionType(null);
  }, [setActionType]);

  /** Memoized onClick handler for associating a signalDetection */
  const associateOnClick = React.useCallback(() => {
    associateSignalDetections(actionTargetSignalDetectionIds);
  }, [actionTargetSignalDetectionIds, associateSignalDetections]);

  /** Memoized onClick handler for unassociating a signalDetection */
  const unassociateOnClick = React.useCallback(() => {
    unassociateSignalDetections(actionTargetSignalDetectionIds, false);
  }, [actionTargetSignalDetectionIds, unassociateSignalDetections]);

  /** Memoized onClick handler for rejecting a signalDetection association */
  const rejectOnClick = React.useCallback(() => {
    unassociateSignalDetections(actionTargetSignalDetectionIds, true);
  }, [actionTargetSignalDetectionIds, unassociateSignalDetections]);

  // array of SD Id's that are associated to the open event, if any
  const sdIdsAssociatedToOpenEvent: string[] =
    currentOpenEventPreferredEventHypothesis?.associatedSignalDetectionHypotheses
      ? currentOpenEventPreferredEventHypothesis.associatedSignalDetectionHypotheses.map(
          sd => sd.id.signalDetectionId
        )
      : [];
  // array of SD Id's that are deleted in the open event, if any
  const sdIdsDeletedFromOpenEvent: string[] =
    currentOpenEventPreferredEventHypothesis &&
    currentOpenEvent?.rejectedSignalDetectionAssociations
      ? currentOpenEvent.rejectedSignalDetectionAssociations.map(sd => sd.id)
      : [];

  // array of the selected SD Id's that AREN'T associated to open event
  const unassociatedSdIds: string[] = actionTargetSignalDetectionIds.filter(
    id => !sdIdsAssociatedToOpenEvent.includes(id)
  );
  // array of the selected SD Id's that ARE associated to open event
  const associatedSdIds: string[] = actionTargetSignalDetectionIds.filter(id =>
    sdIdsAssociatedToOpenEvent.includes(id)
  );
  // array of the selected SD Id's that are deleted from the open event
  const deletedSdIds: string[] = actionTargetSignalDetectionIds.filter(id =>
    sdIdsDeletedFromOpenEvent.includes(id)
  );

  const isRejectedOrDeleted: boolean =
    currentOpenEventPreferredEventHypothesis?.deleted ||
    currentOpenEventPreferredEventHypothesis?.rejected;

  const menuOptionAssociateToCurrentlyOpenEvent = (
    <MenuItem
      text={`Associate ${determineActionTargetsByType('associate').length} to open event`}
      labelElement={formatHotkeyString(associateSelectedSignalDetectionsHotkey)}
      onClick={associateOnClick}
      data-cy="associate-to-open"
      disabled={
        !currentOpenEvent || // no open event
        unassociatedSdIds.length === 0 || // all selected SD's are already associated
        isRejectedOrDeleted // open event is deleted or rejected
      }
      onMouseEnter={() => setActionType('associate')}
      onMouseLeave={clearActionType}
    />
  );
  const menuOptionUnassociateFromCurrentlyOpenEvent = (
    <MenuItem
      text={`Unassociate ${determineActionTargetsByType('unassociate').length} from open event`}
      labelElement={formatHotkeyString(unassociateSelectedSignalDetectionsHotkey)}
      onClick={unassociateOnClick}
      data-cy="unassociate-to-open"
      disabled={
        !currentOpenEvent || // no open event
        associatedSdIds.length === 0 || // no selected SD's are associated
        isRejectedOrDeleted // open event is deleted or rejected
      }
      onMouseEnter={() => setActionType('unassociate')}
      onMouseLeave={clearActionType}
    />
  );
  const menuOptionRejectFromCurrentlyOpenEvent = (
    <MenuItem
      text={`Reject ${determineActionTargetsByType('reject associate').length} from open event`}
      onClick={rejectOnClick}
      data-cy="reject-to-open"
      disabled={
        !currentOpenEvent || // no open event
        deletedSdIds.length === actionTargetSignalDetectionIds.length || // all selected SD's are already deleted
        associatedSdIds.length === 0 || // no selected SD's are associated
        isRejectedOrDeleted // open event is deleted or rejected
      }
      onMouseEnter={() => setActionType('reject associate')}
      onMouseLeave={clearActionType}
    />
  );

  const isDisabled = !currentOpenEvent || isRejectedOrDeleted || areSelectedSdsAllDeleted;

  return (
    <MenuItem text="Event association" disabled={isDisabled}>
      {menuOptionAssociateToCurrentlyOpenEvent}
      {menuOptionUnassociateFromCurrentlyOpenEvent}
      {menuOptionRejectFromCurrentlyOpenEvent}
    </MenuItem>
  );
}
