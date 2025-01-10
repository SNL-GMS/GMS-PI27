import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { HotkeyListener } from '@gms/ui-util';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import * as sdDetails from '~analyst-ui/common/dialogs/signal-detection-details/signal-detection-details';
import { useSignalDetectionEventHandlers } from '~analyst-ui/common/hooks/signal-detection-hooks';

const mockSetSelectedSdIds = jest.fn();
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest
      .fn()
      .mockReturnValue(processingAnalystConfigurationData.keyboardShortcuts),
    useSetSelectedSdIds: jest.fn(() => mockSetSelectedSdIds)
  };
});

const store = getStore();

describe('Signal detection hooks', () => {
  describe('useSignalDetectionEventHandlers', () => {
    it('exists', () => {
      expect(useSignalDetectionEventHandlers).toBeDefined();
    });
    it('matches snapshot', () => {
      expect(useSignalDetectionEventHandlers).toMatchSnapshot();
    });
  });

  describe('signalDetectionClickHandler', () => {
    let subscriptionId;
    beforeEach(() => {
      jest.clearAllMocks();
      subscriptionId = HotkeyListener.subscribeToGlobalHotkeyListener();
    });
    afterEach(() => {
      HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
    });
    // Setup
    const mockSetFocusToDisplay = jest.fn();
    const mockSetPhaseMenuVisibility = jest.fn();
    const mockSetClickedSdId = jest.fn();
    const { result } = renderHook(
      () =>
        useSignalDetectionEventHandlers(
          false,
          false,
          mockSetFocusToDisplay,
          mockSetPhaseMenuVisibility,
          mockSetClickedSdId
        ),
      {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      }
    );
    it('matches snapshot', () => {
      expect(result.current).toMatchSnapshot();
    });

    it('single click will set selected SDs', () => {
      const resultUseSignalDetectionClickHandler = result.current.signalDetectionClickHandler;
      const mockMouseDownEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        nativeEvent: {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        },
        currentTarget: document.createElement('div'),
        type: 'mousedown',
        button: 0
      } as unknown as React.MouseEvent<HTMLDivElement>;
      resultUseSignalDetectionClickHandler(mockMouseDownEvent, 'test-id123');
      expect(mockSetSelectedSdIds).toHaveBeenCalledTimes(1);
    });

    it('Alt+click will open SD Details menu', () => {
      const spyShowSignalDetectionDetails = jest.spyOn(sdDetails, 'showSignalDetectionDetails');
      const resultUseSignalDetectionClickHandler = result.current.signalDetectionClickHandler;
      // Alt click
      const altClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        altKey: true
      });
      const mockAltMouseDownEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        nativeEvent: altClick,
        currentTarget: document.createElement('div'),
        type: 'mousedown',
        button: 0
      } as unknown as React.MouseEvent<HTMLDivElement>;

      resultUseSignalDetectionClickHandler(mockAltMouseDownEvent, 'test-id123');
      expect(spyShowSignalDetectionDetails).toHaveBeenCalledTimes(1);
    });
  });
});
