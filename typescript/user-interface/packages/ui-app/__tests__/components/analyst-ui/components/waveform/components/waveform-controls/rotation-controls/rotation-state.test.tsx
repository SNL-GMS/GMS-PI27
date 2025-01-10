import type { ChannelTypes } from '@gms/common-model';
import {
  akasgBHEChannel,
  defaultStations,
  PD01Channel,
  PD02Channel,
  PD03Channel,
  signalDetectionAsarEventBeam
} from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import { useRotationDialogState } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-state';
import type { RotationDialogState } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/types';
import { rotationDialogActions } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/types';

// This is required so that jest.spyOn doesn't throw a type error
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useRawChannels: jest.fn((): ChannelTypes.Channel[] => {
      return defaultStations[0].allRawChannels;
    })
  };
});

jest.mock(
  '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-dialog-hooks',
  () => {
    const actual = jest.requireActual(
      '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-dialog-hooks'
    );
    return {
      ...actual,
      useGetRotationTemplatesForDialog: jest.fn(() => {
        return async () => {
          return new Promise<void>(resolve => {
            setTimeout(() => resolve(), 1);
          });
        };
      })
    };
  }
);

jest.mock(
  '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-error-handling',
  () => {
    const mockStationPhaseConfig = {
      channelOrientationTolerance: 1,
      channelSampleRateTolerance: 1,
      locationToleranceKm: 0.5
    };
    const getMockStationPhaseConfig = jest.fn(() => mockStationPhaseConfig);
    const actual = jest.requireActual(
      '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-error-handling'
    );
    return {
      ...actual,
      useGetStationPhaseConfig: jest.fn(() => getMockStationPhaseConfig)
    };
  }
);

describe('Rotation dialog state', () => {
  const initialState: RotationDialogState = {
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
    targetSignalDetections: [signalDetectionAsarEventBeam],
    targetStations: [defaultStations[0]],
    validChannels: [PD01Channel, akasgBHEChannel],
    validSignalDetections: [signalDetectionAsarEventBeam],
    validStations: defaultStations,
    durationSecs: '1',
    isRotationDialogState: true,
    leadSecs: '1'
  };

  it('Should be defined', () => {
    expect(useRotationDialogState).toBeDefined();
  });

  it('should return a reducer function', () => {
    const store = getStore();

    const { result } = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    // the initial state passed to the hook
    expect(result.current[0]).toMatchSnapshot();
    // reducer function
    expect(result.current[1]).toMatchInlineSnapshot(`[Function]`);
  });

  it('should show an empty string for azimuth when not in azimuth mode', async () => {
    const store = getStore();

    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    const dispatch = wrapper.result.current[1];

    dispatch(rotationDialogActions.setAzimuth('0'));
    await wrapper.waitForNextUpdate();
    wrapper.rerender();
    dispatch(rotationDialogActions.setSteeringMode('measured-azimuth'));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.steeringMode).toBe('measured-azimuth');
    expect(dialogState.azimuth).toBe('');
  });
  it('should be able to modify azimuth when in azimuth mode', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setSteeringMode('azimuth'));
    dispatch(rotationDialogActions.setAzimuth('0'));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.steeringMode).toBe('azimuth');
    expect(dialogState.azimuth).toBe('0');
  });
  it('should return target signal detections when in signal detection mode', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setInputMode('signal-detection-mode'));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.targetSignalDetections).toBe(initialState.targetSignalDetections);
  });
  it('should return target stations when in station-phase mode', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setInputMode('station-phase-mode'));
    await wrapper.waitForNextUpdate();

    const dialogState = wrapper.result.current[0];
    expect(dialogState.targetStations).toBe(initialState.targetStations);
  });
  it('should return target channels when they are set in station-phase mode', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setTargetChannels([PD01Channel.name]));
    wrapper.rerender();
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.targetChannels[0]).toBe(PD01Channel);
  });
  it('should be able to set interpolation', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setInterpolation('INTERPOLATED'));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.interpolation).toBe('INTERPOLATED');
  });
  it('should be able to set latitude and longitude', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setLatitude('89'));
    dispatch(rotationDialogActions.setLongitude('123'));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.latitude).toBe('89');
    expect(dialogState.longitude).toBe('123');
  });
  it('should be able to set the phase', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setPhase('Sn'));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.rotationPhase).toBe('Sn');
  });
  it('should be able to set the lead-duration-mode', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setLeadDurationMode('default-station-phase'));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.leadDurationMode).toBe('default-station-phase');
  });
  it('should be able to set the target stations', async () => {
    const store = getStore();
    const wrapper = renderHook(() => useRotationDialogState(initialState), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setTargetStations(defaultStations));
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.targetStations).toBe(defaultStations);
  });
  it('shows an error if three channels are selected', async () => {
    const store = getStore();
    const wrapper = renderHook(
      () =>
        useRotationDialogState({
          ...initialState,
          validChannels: [PD01Channel, PD02Channel, PD03Channel]
        }),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );
    const dispatch = wrapper.result.current[1];
    dispatch(
      rotationDialogActions.setTargetChannels([
        PD01Channel.name,
        PD02Channel.name,
        PD03Channel.name
      ])
    );
    wrapper.rerender();
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.displayedMessage.summary).toBe('Too many channels selected');
  });
  it('shows a warning if channels locations are out of tolerance', async () => {
    const store = getStore();
    const wrapper = renderHook(
      () =>
        useRotationDialogState({
          ...initialState,
          validChannels: [PD01Channel, PD02Channel]
        }),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );
    const dispatch = wrapper.result.current[1];
    dispatch(rotationDialogActions.setTargetChannels([PD01Channel.name, PD02Channel.name]));
    wrapper.rerender();
    await wrapper.waitForNextUpdate();
    const dialogState = wrapper.result.current[0];
    expect(dialogState.displayedMessage.summary).toBe('Channel locations are out of tolerance');
  });
});
