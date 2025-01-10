import { getByText, render } from '@testing-library/react';
import React from 'react';

import type { CreateSignalDetectionMenuProps } from '~analyst-ui/common/menus/create-signal-detection-menu';
import { CreateSignalDetectionMenu } from '~analyst-ui/common/menus/create-signal-detection-menu';

jest.mock('@gms/ui-state', () => {
  const actualRedux = jest.requireActual('@gms/ui-state');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actualRedux,
    useAppDispatch: mockUseAppDispatch,
    useUpdateSignalDetectionArrivalTime: jest.fn(),
    useGetProcessingAnalystConfigurationQuery: jest.fn(),
    useKeyboardShortcutConfigurations: jest.fn()
  };
});

const props: CreateSignalDetectionMenuProps = {
  channelId: 'ABC',
  createSignalDetection: jest.fn(),
  showCreateSignalDetectionPhaseSelector: jest.fn(),
  timeSecs: 1000,
  currentPhase: 'PP',
  defaultSignalDetectionPhase: 'P'
};

describe('create-signal-detection-menu', () => {
  describe('CreateSignalDetectionMenuContent', () => {
    let rendered;
    beforeEach(() => {
      rendered =
        // eslint-disable-next-line react/jsx-props-no-spreading
        render(<CreateSignalDetectionMenu {...props} />);
    });
    test('matches snapshot', () => {
      expect(rendered.container).toMatchSnapshot();
    });
    test('creates a signal detection associated to a waveform with current phase', () => {
      const menuItem = getByText(
        rendered.container,
        'Create signal detection associated to a waveform with current phase'
      );
      menuItem.click();
      expect(props.createSignalDetection).toHaveBeenCalledWith('ABC', undefined, 1000, 'PP');
    });
    test('creates a signal detection associated to a waveform with default phase', () => {
      const menuItem = getByText(
        rendered.container,
        'Create signal detection associated to a waveform with default phase'
      );
      menuItem.click();
      expect(props.createSignalDetection).toHaveBeenCalledWith('ABC', undefined, 1000, 'P');
    });
    test('creates a signal detection associated to a waveform with chosen phase', () => {
      const menuItem = getByText(
        rendered.container,
        'Create signal detection associated to a waveform with chosen phase'
      );
      menuItem.click();
      expect(props.showCreateSignalDetectionPhaseSelector).toHaveBeenCalledWith(
        'ABC',
        undefined,
        1000,
        false
      );
    });
    test('creates a signal detection not associated to a waveform with current phase', () => {
      const menuItem = getByText(
        rendered.container,
        'Create signal detection not associated to a waveform with current phase'
      );
      menuItem.click();
      expect(props.createSignalDetection).toHaveBeenCalledWith('ABC', undefined, 1000, 'PP', true);
    });
    test('creates a signal detection not associated to a waveform with default phase', () => {
      const menuItem = getByText(
        rendered.container,
        'Create signal detection not associated to a waveform with default phase'
      );
      menuItem.click();
      expect(props.createSignalDetection).toHaveBeenCalledWith('ABC', undefined, 1000, 'P', true);
    });
    test('creates a signal detection not associated to a waveform with chosen phase', () => {
      const menuItem = getByText(
        rendered.container,
        'Create signal detection not associated to a waveform with chosen phase'
      );
      menuItem.click();
      expect(props.showCreateSignalDetectionPhaseSelector).toHaveBeenCalledWith(
        'ABC',
        undefined,
        1000,
        true
      );
    });
  });
});
