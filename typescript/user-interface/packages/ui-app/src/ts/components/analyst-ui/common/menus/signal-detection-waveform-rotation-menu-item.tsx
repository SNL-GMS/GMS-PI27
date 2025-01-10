import { MenuItem } from '@blueprintjs/core';
import {
  selectSelectedSdIds,
  selectSignalDetections,
  selectValidActionTargetSignalDetectionIds,
  useAppSelector,
  useDetermineActionTargetsByType,
  useRotate2dForSignalDetections,
  useSetActionType,
  useSetSelectedSdIds
} from '@gms/ui-state';
import React from 'react';

import { rotationLogger } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-dialog-util';

/**
 * Menu item to be used to rotate waveforms based on selected
 * action target signal detections
 *
 * @param props
 */
export function SignalDetectionWaveformRotationMenuItem(): JSX.Element {
  const selectedSignalDetectionIds = useAppSelector(selectSelectedSdIds);
  const setActionType = useSetActionType();
  const determineActionTargetsByType = useDetermineActionTargetsByType();
  const setSelectedSdIds = useSetSelectedSdIds();
  const rotate2dForSignalDetections = useRotate2dForSignalDetections();
  const signalDetections = useAppSelector(selectSignalDetections);
  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );

  /**
   * Rotate waveforms based the signal detections for the provided ids.
   *
   * @param sdIds the signal detection ids to delete
   */
  const rotateWaveformsOnClick = React.useCallback(
    (sdIds: string[]) => {
      // TODO: deal with this void / async eslint issue
      // eslint-disable-next-line no-void
      void rotate2dForSignalDetections(
        Object.values(signalDetections).filter(signalDetection => {
          return !!sdIds.find(sdId => sdId === signalDetection.id);
        })
      ).catch(rotationLogger.error);
    },
    [rotate2dForSignalDetections, signalDetections]
  );
  return (
    <MenuItem
      text={`Rotate waveforms using ${determineActionTargetsByType('rotate').length} signal ${
        determineActionTargetsByType('rotate').length > 1 ? 'detections' : 'detection'
      }`}
      disabled={
        validActionTargetSignalDetectionIds.length === 0 ||
        determineActionTargetsByType('rotate').length === 0
      }
      onClick={React.useCallback(() => {
        // remove qualified sd action targets from array of selected sd ids
        const sdIdsToReselect = selectedSignalDetectionIds.filter(
          sdId => !validActionTargetSignalDetectionIds.includes(sdId)
        );
        rotateWaveformsOnClick(validActionTargetSignalDetectionIds);
        setSelectedSdIds(sdIdsToReselect); // leave SD's that were unqualified action targets selected
      }, [
        rotateWaveformsOnClick,
        selectedSignalDetectionIds,
        setSelectedSdIds,
        validActionTargetSignalDetectionIds
      ])}
      data-cy="rotate-sd"
      onMouseEnter={() => setActionType('rotate')}
      onMouseLeave={() => setActionType(null)}
    />
  );
}
