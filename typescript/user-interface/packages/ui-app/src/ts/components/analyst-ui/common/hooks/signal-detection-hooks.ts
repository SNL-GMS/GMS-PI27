import { SignalDetectionTypes } from '@gms/common-model';
import type { UpdateSignalDetectionArrivalTimeArgs } from '@gms/ui-state';
import {
  AnalystWorkspaceOperations,
  selectMeasurementMode,
  selectOpenEventId,
  selectOpenIntervalName,
  selectSelectedSdIds,
  useAppSelector,
  useAssociateSignalDetections,
  useEventStatusQuery,
  useGetEvents,
  useGetSignalDetections,
  useKeyboardShortcutConfigurationsWithValidation,
  useSetSelectedSdIds,
  useSetSignalDetectionActionTargets,
  useUnassociateSignalDetections,
  useUpdateSignalDetectionArrivalTime
} from '@gms/ui-state';
import { useSuperStableCallback } from '@gms/ui-util';
import { isHotKeyCommandSatisfied } from '@gms/ui-util/lib/ui-util/hot-key-util';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { showSignalDetectionDetails } from '../dialogs/signal-detection-details/signal-detection-details';
import { showSignalDetectionMenu } from '../menus/signal-detection-menu';
import { getSignalDetectionStatus } from '../utils/event-util';

/**
 * Weavess SD event handlers
 */
export interface SignalDetectionHandlers {
  signalDetectionDoubleClickHandler: (
    event: React.MouseEvent<HTMLDivElement>,
    signalDetectionId: string
  ) => void;
  signalDetectionClickHandler: (
    event: React.MouseEvent<HTMLDivElement>,
    signalDetectionId: string
  ) => void;
  onSignalDetectionContextMenuHandler: (
    e: React.MouseEvent<HTMLDivElement>,
    channelName: string,
    sdId: string
  ) => void;
  onSignalDetectionDragEndHandler: (
    sdId: string,
    timeSecs: number,
    uncertaintySecs: number
  ) => Promise<void>;
}

/**
 * Signal Detection handlers implemented
 *
 * @param isSplitChannelOverlayOpen
 * @param isAzimuthSlownessContextMenu
 * @param setFocusToDisplay
 * @param setPhaseMenuVisibility
 * @returns SignalDetectionHandlers
 */
export const useSignalDetectionEventHandlers = (
  isSplitChannelOverlayOpen: boolean,
  isAzimuthSlownessContextMenu: boolean,
  setFocusToDisplay: () => void,
  setPhaseMenuVisibility: React.Dispatch<React.SetStateAction<boolean>>,
  setClickedSdId?: (sdId: string) => void
): SignalDetectionHandlers => {
  const currentOpenEventId = useAppSelector(selectOpenEventId);
  const signalDetections = useGetSignalDetections();
  const eventResults = useGetEvents();
  const eventStatusQuery = useEventStatusQuery();
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const unassociateSignalDetections = useUnassociateSignalDetections();
  const associateSignalDetections = useAssociateSignalDetections();
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const setSelectedSdIds = useSetSelectedSdIds();
  const measurementMode = useAppSelector(selectMeasurementMode);
  const updateSignalDetectionArrivalTime = useUpdateSignalDetectionArrivalTime();
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurationsWithValidation();

  const getSelectedSdIds = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>, sdId: string): string[] => {
      const isAlreadySelected = selectedSdIds.indexOf(sdId) > -1;
      let tempSelectedSdIds: string[] = [];

      // If ctrl, meta, or shift is pressed, append to current list, otherwise new singleton list
      if (isHotKeyCommandSatisfied(e.nativeEvent, ['Ctrl', 'Meta', 'Shift'])) {
        // meta + already selected = remove the element
        if (isAlreadySelected) {
          tempSelectedSdIds = selectedSdIds.filter(id => id !== sdId);
        } else {
          tempSelectedSdIds = [...selectedSdIds, sdId];
        }
      }
      // Handle single-select
      else if (!isAlreadySelected || selectedSdIds.length !== 1) {
        tempSelectedSdIds = [sdId];
      }
      return tempSelectedSdIds;
    },
    [selectedSdIds]
  );

  /**
   * Helper function to call UpdateDetection Mutation
   * Invokes the call to the update signal detection mutation.
   *
   * @param sdId the unique signal detection id
   * @param timeSecs the epoch seconds time
   * @param uncertaintySecs uncertainty of signal detection timing
   */
  const updateSignalDetectionMutation = React.useCallback(
    async (sdId: string, timeSecs: number, uncertaintySecs: number): Promise<void> => {
      const args: UpdateSignalDetectionArrivalTimeArgs = {
        signalDetectionId: sdId,
        arrivalTime: {
          value: timeSecs,
          uncertainty: uncertaintySecs
        }
      };
      await updateSignalDetectionArrivalTime(args);
    },
    [updateSignalDetectionArrivalTime]
  );

  /**
   * Event handler for when a signal detection drag ends
   *
   * @param sdId a Signal Detection Id as a string
   * @param timeSecs epoch seconds of where drag ended in respect to the data
   * @param uncertaintySecs uncertainty of signal detection timing
   */
  const onSignalDetectionDragEndHandler = React.useCallback(
    async (sdId: string, timeSecs: number, uncertaintySecs: number): Promise<void> => {
      await updateSignalDetectionMutation(sdId, timeSecs, uncertaintySecs);
    },
    [updateSignalDetectionMutation]
  );

  /**
   * Event handler for when context menu is displayed
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelName a Channel Id as a string
   * @param sdId a Signal Detection Id as a string
   */
  const onSignalDetectionContextMenuHandler = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>, channelName: string, sdId: string) => {
      e.preventDefault();
      if (e.ctrlKey) {
        return;
      }
      // if provided && not already selected, set the current selection to just the context-menu'd detection
      const detectionIds = sdId && selectedSdIds.indexOf(sdId) === -1 ? [sdId] : selectedSdIds;
      setSignalDetectionActionTargets(detectionIds);
      if (setClickedSdId) {
        setClickedSdId(sdId);
      }
      showSignalDetectionMenu(
        e,
        {
          measurementMode,
          setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries,
          setPhaseMenuVisibilityCb: setPhaseMenuVisibility,
          isAzimuthSlownessContextMenu
        },
        {
          onClose: () => {
            setSignalDetectionActionTargets([]);
          }
        }
      );
    },
    [
      isAzimuthSlownessContextMenu,
      measurementMode,
      selectedSdIds,
      setClickedSdId,
      setPhaseMenuVisibility,
      setSignalDetectionActionTargets
    ]
  );

  const signalDetectionClickHandler = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>, signalDetectionId: string) => {
      if (setClickedSdId) {
        setClickedSdId(signalDetectionId);
      }
      // not main mouse button or both alt and ctrl keys then do nothing
      if (event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      // Open Signal Detection Details
      const showSdDetailsHotkeys =
        keyboardShortcutConfigurations.clickEvents?.showSignalDetectionDetails?.combos ?? [];

      if (
        isHotKeyCommandSatisfied(event.nativeEvent, showSdDetailsHotkeys) &&
        !isSplitChannelOverlayOpen
      ) {
        const signalDetection = signalDetections.data?.find(sd => sd.id === signalDetectionId);
        showSignalDetectionDetails(
          event,
          { signalDetection },
          {
            onClose: () => {
              setSignalDetectionActionTargets([]);
              setFocusToDisplay();
            }
          }
        );
      }
      // Determine selection
      else if (isHotKeyCommandSatisfied(event.nativeEvent, ['', 'Ctrl', 'Meta', 'Shift'])) {
        const tempSelectedSdIds = getSelectedSdIds(event, signalDetectionId);
        if (!isEqual(selectedSdIds, tempSelectedSdIds)) {
          setSelectedSdIds(tempSelectedSdIds);
        }
      }
    },
    [
      getSelectedSdIds,
      isSplitChannelOverlayOpen,
      keyboardShortcutConfigurations?.clickEvents?.showSignalDetectionDetails?.combos,
      selectedSdIds,
      setClickedSdId,
      setFocusToDisplay,
      setSelectedSdIds,
      setSignalDetectionActionTargets,
      signalDetections.data
    ]
  );

  /**
   * A hook that returns a function that handles an sd double click
   *
   * @param isSplitChannelOverlayOpen flag for is in split channel overlay
   * @returns function to handle a sd being double clicked
   */
  const signalDetectionDoubleClickHandler = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>, signalDetectionId: string) => {
      if (event.button !== 0 || !currentOpenEventId || isSplitChannelOverlayOpen) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      const signalDetection = signalDetections.data.find(sd => sd.id === signalDetectionId);
      const assocStatus = getSignalDetectionStatus(
        signalDetection,
        eventResults.data,
        currentOpenEventId ?? undefined,
        eventStatusQuery.data,
        openIntervalName
      );
      // Associate the SD if it's unassociated to the open event
      if (assocStatus === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED) {
        unassociateSignalDetections([signalDetectionId]);
        return;
      }
      // Else associate to the open event
      associateSignalDetections([signalDetectionId]);
    },
    [
      associateSignalDetections,
      currentOpenEventId,
      eventResults.data,
      eventStatusQuery.data,
      isSplitChannelOverlayOpen,
      openIntervalName,
      signalDetections.data,
      unassociateSignalDetections
    ]
  );

  return {
    signalDetectionDoubleClickHandler: useSuperStableCallback(signalDetectionDoubleClickHandler),
    signalDetectionClickHandler: useSuperStableCallback(signalDetectionClickHandler),
    onSignalDetectionContextMenuHandler: useSuperStableCallback(
      onSignalDetectionContextMenuHandler
    ),
    onSignalDetectionDragEndHandler: useSuperStableCallback(onSignalDetectionDragEndHandler)
  };
};
