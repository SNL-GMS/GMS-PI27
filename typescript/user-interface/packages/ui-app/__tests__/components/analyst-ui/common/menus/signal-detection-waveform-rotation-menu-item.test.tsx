import type { AppState } from '@gms/ui-state';
import { getStore } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { SignalDetectionWaveformRotationMenuItem } from '~analyst-ui/common/menus/signal-detection-waveform-rotation-menu-item';

// make sure we down pollute the test logs
global.console.warn = jest.fn();
const setSelectedSdIds = jest.fn();
jest.mock('@gms/ui-state', () => {
  const actualRedux = jest.requireActual('@gms/ui-state');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);

  return {
    ...actualRedux,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState as any;
      state.app.analyst.selectedSdIds = ['id'];
      // return ids when we call useAppSelector with selectValidActionTargetSignalDetectionIds
      if (stateFunc.name === 'memoized') {
        return ['ids'];
      }
      return stateFunc(state);
    }),
    useSetSelectedSdIds: jest.fn(() => setSelectedSdIds),
    useAppDispatch: mockUseAppDispatch,
    useUpdateSignalDetectionArrivalTime: jest.fn(),
    useGetProcessingAnalystConfigurationQuery: jest.fn(),
    useKeyboardShortcutConfigurations: jest.fn()
  };
});

jest.mock('@gms/ui-state/src/ts/app/util/util', () => {
  return {
    determineAllDeletableSignalDetections: jest.fn(() => ['ids'])
  };
});

describe('signal-detection-waveform-rotation-menu', () => {
  describe('SignalDetectionWaveformRotationMenuItem', () => {
    let result;
    beforeEach(() => {
      const store = getStore();
      result = render(<SignalDetectionWaveformRotationMenuItem />, {
        wrapper: ({ children }) => {
          return <Provider store={store}>{children}</Provider>;
        }
      });
    });
    test('matches snapshot', () => {
      expect(result.container).toMatchSnapshot();
    });
    test('calls out on click as expected', () => {
      const closeButton = screen.getByText('Rotate waveforms using 1 signal detection');
      fireEvent.click(closeButton);
      expect(setSelectedSdIds).toHaveBeenCalledTimes(1);
    });
  });
});
