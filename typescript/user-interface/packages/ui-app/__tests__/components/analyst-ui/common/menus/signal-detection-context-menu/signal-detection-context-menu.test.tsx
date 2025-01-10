import type { CommonTypes } from '@gms/common-model';
import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { eventData } from '@gms/common-model/__tests__/__data__/event/event-data';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__/signal-detections/signal-detection-data';
import type { AppState } from '@gms/ui-state';
import { AnalystWorkspaceTypes, getStore } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import type { SignalDetectionMenuProps } from '~analyst-ui/common/menus/signal-detection-menu';
import { SignalDetectionMenu } from '~analyst-ui/common/menus/signal-detection-menu';

// Mock data setup
const loading = false;
const isLoading = () => {
  return loading;
};
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const now = 1234567890 / 1000;
const timeRange: CommonTypes.TimeRange = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  startTimeSecs: now - 3600,
  endTimeSecs: now
};
const mockShortcuts = processingAnalystConfigurationData.keyboardShortcuts;
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      state.app.workflow.openIntervalName = 'AL1';
      state.app.analyst.openEventId = 'eventId';
      return stateFunc(state);
    }),
    useGetSignalDetections: jest.fn(() => ({
      data: signalDetectionsData,
      isLoading: isLoading()
    })),
    useViewableInterval: jest.fn(() => [timeRange, jest.fn]),
    useKeyboardShortcutConfigurations: jest.fn(() => mockShortcuts)
  };
});

jest.mock('../../../../../../../common-model/src/ts/event/util', () => {
  const actual = jest.requireActual('../../../../../../../common-model/src/ts/event/util');
  return {
    ...actual,
    findPreferredEventHypothesisByOpenStageOrDefaultStage: jest.fn(() => [
      eventData.eventHypotheses[0]
    ])
  };
});

jest.mock(
  '../../../../../../src/ts/components/analyst-ui/common/hotkey-configs/signal-detection-hotkey-configs',
  () => {
    const actual = jest.requireActual(
      '../../../../../../src/ts/components/analyst-ui/common/hotkey-configs/signal-detection-hotkey-configs'
    );
    return {
      ...actual,
      useGetSignalDetectionKeyboardShortcut: jest.fn().mockReturnValue({
        associateSelectedSignalDetections: {
          description: 'Associate Selected Signal Detections To Open Event',
          helpText: 'Associate selected signal detection(s) to the currently open event',
          combos: ['ctrl+g'],
          tags: ['associate', 'signal', 'detection'],
          categories: ['Signal Detections List Display']
        },
        unassociateSelectedSignalDetections: {
          description: 'Unassociate Selected Signal Detections To Open Event',
          helpText: 'Unassociate selected signal detection(s) to the currently open event',
          combos: ['alt+g'],
          tags: ['unassociate', 'signal', 'detection'],
          categories: ['Signal Detections List Display']
        },
        currentPhaseLabel: {
          description: 'Set Selected Signal Detections Phase Label to Current Phase',
          helpText: 'Set phase label for selected signal detection(s) to the current phase.',
          combos: ['shift+e'],
          tags: ['set', 'update', 'phase label', 'current phase'],
          categories: ['Signal Detections List Display']
        }
      })
    };
  }
);

describe('Signal Detection Context Menu', () => {
  const props: SignalDetectionMenuProps = {
    measurementMode: {
      mode: AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT,
      entries: {
        [signalDetectionsData[0].id]: true
      }
    },
    setMeasurementModeEntries: jest.fn()
  };

  it('renders', () => {
    const store = getStore();
    const { setMeasurementModeEntries } = props;
    const { container } = render(
      <Provider store={store}>
        <SignalDetectionMenu
          measurementMode={props.measurementMode}
          setMeasurementModeEntries={setMeasurementModeEntries}
        />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with isAzimuthSlownessContextMenu', () => {
    const store = getStore();
    const { setMeasurementModeEntries } = props;
    const { container } = render(
      <Provider store={store}>
        <SignalDetectionMenu
          measurementMode={props.measurementMode}
          setMeasurementModeEntries={setMeasurementModeEntries}
          isAzimuthSlownessContextMenu
        />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
