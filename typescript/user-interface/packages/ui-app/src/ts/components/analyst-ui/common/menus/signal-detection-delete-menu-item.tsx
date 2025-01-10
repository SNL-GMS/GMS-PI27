import { MenuItem } from '@blueprintjs/core';
import type { DeleteSignalDetectionArgs } from '@gms/ui-state';
import {
  selectSelectedSdIds,
  selectValidActionTargetSignalDetectionIds,
  useAppSelector,
  useDeleteSignalDetection,
  useDetermineActionTargetsByType,
  useKeyboardShortcutConfigurations,
  useSetActionType,
  useSetSelectedSdIds
} from '@gms/ui-state';
import React from 'react';

import { formatHotkeyString } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

/**
 * Menu item to be used to delete signal detections
 *
 * @param props
 */
export function SignalDetectionDeleteMenuItem(): JSX.Element {
  const deleteSignalDetection = useDeleteSignalDetection();
  const selectedSignalDetectionIds = useAppSelector(selectSelectedSdIds);
  const setActionType = useSetActionType();
  const determineActionTargetsByType = useDetermineActionTargetsByType();
  const setSelectedSdIds = useSetSelectedSdIds();
  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );
  const keyboardShortcutConfigs = useKeyboardShortcutConfigurations();

  /**
   * Deletes the signal detections for the provided ids.
   *
   * @param sdIds the signal detection ids to delete
   */
  const deleteDetectionsOnClick = React.useCallback(
    (sdIds: string[]) => {
      const args: DeleteSignalDetectionArgs = {
        signalDetectionIds: sdIds
      };
      deleteSignalDetection(args);
    },
    [deleteSignalDetection]
  );
  return (
    <MenuItem
      text={`Delete ${determineActionTargetsByType('delete').length}`}
      label={
        keyboardShortcutConfigs?.hotkeys?.deleteSignalDetection
          ? formatHotkeyString(keyboardShortcutConfigs.hotkeys?.deleteSignalDetection?.combos[0])
          : ''
      }
      disabled={
        validActionTargetSignalDetectionIds.length === 0 ||
        determineActionTargetsByType('delete').length === 0
      }
      onClick={() => {
        // remove qualified sd action targets from array of selected sd ids
        const sdIdsToReselect = selectedSignalDetectionIds.filter(
          sdId => !validActionTargetSignalDetectionIds.includes(sdId)
        );
        deleteDetectionsOnClick(validActionTargetSignalDetectionIds);
        setSelectedSdIds(sdIdsToReselect); // leave SD's that were unqualified action targets selected
      }}
      data-cy="delete-sd"
      onMouseEnter={() => setActionType('delete')}
      onMouseLeave={() => setActionType(null)}
    />
  );
}
