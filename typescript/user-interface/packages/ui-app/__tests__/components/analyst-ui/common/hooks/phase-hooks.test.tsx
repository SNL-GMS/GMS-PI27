/* eslint-disable no-void */
import {
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import {
  findPhaseFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import type { SignalDetectionFetchResult } from '@gms/ui-state';
import { act, renderHook } from '@testing-library/react';
import React from 'react';

import {
  useCloseCreateEventDialog,
  useCloseCurrentPhaseMenu,
  useClosePhaseMenu,
  useCreateSignalDetectionPhaseSelectorProps,
  useSelectedPhases
} from '~analyst-ui/common/dialogs/phase-selector/phase-hooks';

const mockShortcuts = processingAnalystConfigurationData.keyboardShortcuts;
const mockCreateSignalDetection = jest.fn();

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useCreateSignalDetection: () => mockCreateSignalDetection,
    useKeyboardShortcutConfigurations: jest.fn(() => mockShortcuts)
  };
});

const SDQueryResult: SignalDetectionFetchResult = {
  data: signalDetectionsData,
  isLoading: false,
  pending: 0,
  isError: false,
  fulfilled: 0,
  rejected: 0
};

describe('phase-hooks', () => {
  describe('useCreateSignalDetectionPhaseSelectorProps', () => {
    it('returns props for the PhaseSelector dialog to create a signal detection', async () => {
      const wrapper = renderHook(() => {
        const createSignalDetectionPhaseSelectorProps =
          useCreateSignalDetectionPhaseSelectorProps();
        return createSignalDetectionPhaseSelectorProps;
      });

      wrapper.result.current.openDialog('test', 'test2', 0, true);
      wrapper.rerender();

      // dialog is open after calling openDialog
      expect(wrapper.result.current.isOpen).toBeTruthy();

      await wrapper.result.current.callBack(['P']);
      // props from the open are used in the call back along with the first phase of the array
      expect(mockCreateSignalDetection).toHaveBeenCalledWith('test', 'test2', 0, 'P', true);

      mockCreateSignalDetection.mockClear();

      // close is called without calling the callback
      wrapper.result.current.closeDialog();
      wrapper.rerender();

      expect(mockCreateSignalDetection).toHaveBeenCalledTimes(0);
      expect(wrapper.result.current.isOpen).toBeFalsy();

      // if isTemporary is true, show not associated hotkey
      expect(wrapper.result.current.hotkey).toEqual(
        mockShortcuts.clickEvents.createSignalDetectionNotAssociatedWithWaveformChosenPhase
          .combos[0]
      );

      wrapper.result.current.openDialog('test', 'test2', 0, false);
      wrapper.rerender();

      // if isTemporary is false, show associated hotkey
      expect(wrapper.result.current.hotkey).toEqual(
        mockShortcuts.clickEvents.createSignalDetectionWithChosenPhase.combos[0]
      );
    });
  });

  it('useCloseCreateEventDialog', () => {
    const setVisibilityStateMock = jest.fn();
    const useVisibilityStateMock = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation(useVisibilityStateMock);

    const { result } = renderHook(() => useCloseCreateEventDialog(setVisibilityStateMock));
    void act(() => {
      result.current.call(setVisibilityStateMock);
    });
    expect(setVisibilityStateMock).toHaveBeenCalledWith({ visibility: false });
  });

  it('useCloseCurrentPhaseMenu', () => {
    const setVisibilityStateMock = jest.fn();
    const useVisibilityStateMock = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation(useVisibilityStateMock);

    const { result } = renderHook(() => useCloseCurrentPhaseMenu(setVisibilityStateMock));
    void act(() => {
      result.current.call(setVisibilityStateMock);
    });
    expect(setVisibilityStateMock).toHaveBeenCalledWith(false);
  });

  it('useClosePhaseMenu', () => {
    const setVisibilityStateMock = jest.fn();
    const useVisibilityStateMock = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation(useVisibilityStateMock);
    const setSignalDetectionActionTargetsMock = jest.fn();

    const { result } = renderHook(() =>
      useClosePhaseMenu(setVisibilityStateMock, setSignalDetectionActionTargetsMock)
    );

    void act(() => {
      result.current.call({
        this: this,
        args: { setVisibilityStateMock, setSignalDetectionActionTargetsMock }
      });
    });
    expect(setVisibilityStateMock).toHaveBeenCalledWith(false);
  });

  describe('useSelectedPhases', () => {
    it('returns empty array with no sd results', () => {
      const { result } = renderHook(() => useSelectedPhases(undefined, 0, [0]));

      expect(result.current).toBeDefined();
      expect(result.current).toHaveLength(0);
    });
    it('useSelectedPhases', () => {
      const clickedSd = SDQueryResult.data[0];
      const clickedSdId = clickedSd.id;

      const selectedSds = [clickedSd, SDQueryResult.data[1]];
      const selectedSdIds = [clickedSdId, SDQueryResult.data[1].id];
      const { result } = renderHook(() =>
        useSelectedPhases(SDQueryResult, clickedSdId, selectedSdIds)
      );
      const clickedSdHypothesis = getCurrentHypothesis(clickedSd.signalDetectionHypotheses);
      const clickedSdPhase = findPhaseFeatureMeasurement(clickedSdHypothesis.featureMeasurements)
        .measurementValue.value;

      const selectedSdHypothesis = getCurrentHypothesis(selectedSds[1].signalDetectionHypotheses);
      const selectedSdPhase = findPhaseFeatureMeasurement(selectedSdHypothesis.featureMeasurements)
        .measurementValue.value;

      expect(clickedSdPhase).toEqual('P');
      expect(result.current).toHaveLength(2);
      expect(result.current[0]).toEqual(clickedSdPhase);
      expect(result.current[1]).toEqual(selectedSdPhase);
    });
  });
});
