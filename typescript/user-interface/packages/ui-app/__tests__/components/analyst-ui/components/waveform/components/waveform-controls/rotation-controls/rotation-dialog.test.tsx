/* eslint-disable react/jsx-props-no-spreading */
import type { CommonTypes } from '@gms/common-model';
import {
  asar,
  defaultStations,
  pdar,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { addSignalDetections, analystActions, getStore } from '@gms/ui-state';
import { useQueryStateResult } from '@gms/ui-state/__tests__/__data__';
import { render, screen } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';

import type { RotationDialogProps } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-dialog';
import { RotationDialog } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-dialog';
import type { RotationDialogState } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/types';

const operationalTimeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  endTimeSecs: 48 * 3600 // 48 hours
};
const operationalTimePeriodConfigurationQuery = cloneDeep(useQueryStateResult);
operationalTimePeriodConfigurationQuery.data = operationalTimeRange;

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');

  return {
    ...actual,
    selectProcessingConfiguration: jest.fn(() => processingAnalystConfigurationData),
    useKeyboardShortcutConfigurations: jest.fn(() => {
      const keyboardShortcutConfig = processingAnalystConfigurationData.keyboardShortcuts;
      return keyboardShortcutConfig;
    }),
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => {
      const processingConfig = {
        ...cloneDeep(useQueryStateResult),
        data: processingAnalystConfigurationData
      };
      return processingConfig;
    }),
    useGetOperationalTimePeriodConfigurationQuery: jest.fn(
      () => operationalTimePeriodConfigurationQuery
    ),
    useVisibleStations: jest.fn(() => {
      return [pdar, asar];
    })
  };
});

// eslint-disable-next-line prefer-const
let initialRotationDialogStatePhase: RotationDialogState = {
  azimuth: '',
  hasRotationTemplates: true,
  inputMode: 'station-phase-mode',
  interpolation: undefined,
  latitude: '0',
  leadDurationMode: 'custom-lead-duration',
  longitude: '0',
  rotationPhase: 'S',
  steeringMode: 'reference-location',
  targetChannels: [],
  targetSignalDetections: [],
  targetStations: [defaultStations[0]],
  validChannels: [],
  validSignalDetections: signalDetectionsData,
  validStations: [],
  durationSecs: '1',
  isRotationDialogState: true,
  leadSecs: '1'
};

// eslint-disable-next-line prefer-const
let rotationDialogPropsPhaseMode: RotationDialogProps = {
  onCancel: jest.fn(),
  onCloseCallback: jest.fn(),
  rotationHotkeyConfig: processingAnalystConfigurationData.keyboardShortcuts.hotkeys.rotate,
  initialRotationState: initialRotationDialogStatePhase
};

const initialRotationDialogStateSD: RotationDialogState = {
  ...initialRotationDialogStatePhase,
  inputMode: 'signal-detection-mode'
};

// eslint-disable-next-line prefer-const
let rotationDialogPropsSDMode: RotationDialogProps = {
  onCancel: jest.fn(),
  onCloseCallback: jest.fn(),
  rotationHotkeyConfig: processingAnalystConfigurationData.keyboardShortcuts.hotkeys.rotate,
  initialRotationState: initialRotationDialogStateSD
};

const store = getStore();
store.dispatch(addSignalDetections(signalDetectionsData));

describe('RotationDialog', () => {
  it('matches snapshot', () => {
    render(
      <Provider store={store}>
        <RotationDialog {...rotationDialogPropsPhaseMode} />
      </Provider>
    );
    expect(screen.getByRole('dialog')).toMatchSnapshot();
  });
  it('defaults to station/phase mode if no signal detections are selected', () => {
    store.dispatch(analystActions.setSelectedSdIds([]));
    render(
      <Provider store={store}>
        <RotationDialog {...rotationDialogPropsPhaseMode} />
      </Provider>
    );
    expect(
      screen.getByLabelText<HTMLInputElement>('Using selected stations/channels and phase').checked
    ).toBe(true);
  });
  it('defaults to signal detection mode if signal detections are selected', () => {
    const result = render(
      <Provider store={store}>
        <RotationDialog {...rotationDialogPropsSDMode} />
      </Provider>
    );
    expect(result.baseElement).toMatchSnapshot();
    expect(
      screen.getByLabelText<HTMLInputElement>('Using selected signal detections').checked
    ).toBe(true);
  });
});
