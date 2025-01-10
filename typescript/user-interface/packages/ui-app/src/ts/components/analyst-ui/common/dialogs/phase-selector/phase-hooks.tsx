import {
  findPhaseFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import { useCreateSignalDetection, useKeyboardShortcutConfigurations } from '@gms/ui-state';
import defer from 'lodash/defer';
import React from 'react';

import { setFocusToWaveformDisplay } from '~analyst-ui/components/waveform/utils';

/**
 * Close the create event dialog
 *
 * @param setCreateEventMenuState
 * @returns
 */
export function useCloseCreateEventDialog(setCreateEventMenuState) {
  return React.useCallback(() => {
    setCreateEventMenuState({ visibility: false });
    defer(() => {
      setFocusToWaveformDisplay();
    });
  }, [setCreateEventMenuState]);
}

/**
 * Close Set Current phase menu
 *
 * @param setCurrentPhaseMenuVisibility
 * @returns
 */
export function useCloseCurrentPhaseMenu(setCurrentPhaseMenuVisibility) {
  return React.useCallback(() => {
    setCurrentPhaseMenuVisibility(false);
    defer(() => {
      setFocusToWaveformDisplay();
    });
  }, [setCurrentPhaseMenuVisibility]);
}

/**
 * Close Phase menu
 *
 * @param setPhaseMenuVisibility
 * @param setSignalDetectionActionTargets
 * @returns
 */
export function useClosePhaseMenu(setPhaseMenuVisibility, setSignalDetectionActionTargets) {
  const forTesting = React.useCallback(() => {
    setPhaseMenuVisibility(false);
    setSignalDetectionActionTargets([]);
    defer(() => {
      setFocusToWaveformDisplay();
    });
  }, [setPhaseMenuVisibility, setSignalDetectionActionTargets]);
  return forTesting;
}
/**
 * Close create signal detection phase menu
 *
 * @param setCurrentPhaseMenuVisibility
 * @returns
 */
export function useCreateSignalDetectionPhaseSelectorProps() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [stationId, setStationId] = React.useState('');
  const [channelName, setChannelName] = React.useState('');
  const [timeSecs, setTimeSecs] = React.useState(0);
  const [isTemporary, setIsTemporary] = React.useState(false);
  const createSignalDetection = useCreateSignalDetection();
  const keyboardShortcuts = useKeyboardShortcutConfigurations();

  return React.useMemo(
    () => ({
      closeDialog: () => {
        setIsOpen(false);
        defer(() => {
          setFocusToWaveformDisplay();
        });
      },
      openDialog: (
        openStationId: string,
        openChannelName: string,
        openTimeSecs: number,
        openIsTemporary: boolean
      ) => {
        setStationId(openStationId);
        setChannelName(openChannelName);
        setTimeSecs(openTimeSecs);
        setIsTemporary(openIsTemporary);
        setIsOpen(true);
      },
      isOpen,
      hotkey: isTemporary
        ? keyboardShortcuts?.clickEvents?.createSignalDetectionNotAssociatedWithWaveformChosenPhase
            ?.combos[0]
        : keyboardShortcuts?.clickEvents?.createSignalDetectionWithChosenPhase?.combos[0],
      callBack: async (phases: string[]) =>
        createSignalDetection(stationId, channelName, timeSecs, phases[0], isTemporary)
    }),
    [
      channelName,
      createSignalDetection,
      isOpen,
      isTemporary,
      keyboardShortcuts?.clickEvents?.createSignalDetectionNotAssociatedWithWaveformChosenPhase
        ?.combos,
      keyboardShortcuts?.clickEvents?.createSignalDetectionWithChosenPhase?.combos,
      stationId,
      timeSecs
    ]
  );
}

/**
 * Set SDs to selected phase
 *
 * @param signalDetectionResults
 * @param clickedSdId
 * @param selectedSdIds
 * @returns
 */
export function useSelectedPhases(signalDetectionResults, clickedSdId, selectedSdIds) {
  return React.useMemo(() => {
    const newSelectedPhases = [];
    if (!signalDetectionResults?.data) return [];
    // if provided && not already selected, set the current selection to just the context-menu'd detection
    const detectionIds =
      clickedSdId && selectedSdIds.indexOf(clickedSdId) === -1 ? [clickedSdId] : selectedSdIds;

    detectionIds.forEach(id => {
      const signalDetection = signalDetectionResults.data.find(sd => sd.id === id);
      if (signalDetection) {
        const currentHypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
        newSelectedPhases.push(
          findPhaseFeatureMeasurement(currentHypothesis.featureMeasurements).measurementValue.value
        );
      }
    });
    return newSelectedPhases;
  }, [clickedSdId, selectedSdIds, signalDetectionResults?.data]);
}

/**
 * Use phase selector menu
 *
 * @param clickedSdId
 * @param selectedSdIds
 * @param signalDetectionPhaseUpdate
 * @returns
 */
export function usePhaseSelectorCallback(clickedSdId, selectedSdIds, signalDetectionPhaseUpdate) {
  return React.useCallback(
    (phases: string[]) => {
      // if provided && not already selected, set the current selection to just the context-menu'd detection
      const detectionIds =
        clickedSdId && selectedSdIds.indexOf(clickedSdId) === -1 ? [clickedSdId] : selectedSdIds;
      signalDetectionPhaseUpdate(detectionIds, phases[0]);
    },
    [clickedSdId, selectedSdIds, signalDetectionPhaseUpdate]
  );
}
