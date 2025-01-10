import { signalDetectionAsarAs01Shz } from '@gms/common-model/__tests__/__data__';
import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import {
  addSignalDetections,
  createSignalDetection,
  getStore,
  selectSignalDetections,
  useAppSelector,
  waveformSlice,
  workflowActions
} from '../../../../src/ts/app';

const mockedGetFilterDefinitionsForSignalDetections = jest.fn();
jest.mock(
  '../../../../src/ts/app/api/data/signal-detection/get-filter-definitions-for-signal-detections',
  () => {
    const actual = jest.requireActual(
      '../../../../src/ts/app/api/data/signal-detection/get-filter-definitions-for-signal-detections'
    );
    return {
      ...actual,
      getFilterDefinitionsForSignalDetections: () => mockedGetFilterDefinitionsForSignalDetections
    };
  }
);

describe('getFilterDefinitionsForSignalDetectionsPopulationMiddleware', () => {
  beforeEach(() => {
    mockedGetFilterDefinitionsForSignalDetections.mockClear();
  });

  it('will not run if an interval is not open', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectSignalDetections), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    act(() => {
      store.dispatch(addSignalDetections([signalDetectionAsarAs01Shz]));
    });

    await waitFor(() => {
      expect(mockedGetFilterDefinitionsForSignalDetections).not.toHaveBeenCalled();
    });
  });
  it('will not run when an interval is first opened (no SDs for new interval)', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectSignalDetections), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      store.dispatch(workflowActions.setOpenIntervalName('Initial'));
    });

    await waitFor(() => {
      expect(mockedGetFilterDefinitionsForSignalDetections).not.toHaveBeenCalled();
    });
  });
  it('will run if an interval is open and a signal detection is added', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectSignalDetections), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    act(() => {
      store.dispatch(workflowActions.setOpenIntervalName('Initial'));
      store.dispatch(addSignalDetections([signalDetectionAsarAs01Shz]));
    });

    await waitFor(() => {
      expect(mockedGetFilterDefinitionsForSignalDetections).toHaveBeenCalled();
    });
  });

  it('will run if an interval is open and a signal detection is created', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectSignalDetections), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    act(() => {
      store.dispatch(workflowActions.setOpenIntervalName('Initial'));
      store.dispatch(
        createSignalDetection({
          signalDetection: signalDetectionAsarAs01Shz,
          updatedUiChannelSegments: []
        })
      );
    });

    await waitFor(() => {
      expect(mockedGetFilterDefinitionsForSignalDetections).toHaveBeenCalled();
    });
  });

  it('will not run if an interval is open and an arbitrary action occurs', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectSignalDetections), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    act(() => {
      store.dispatch(workflowActions.setOpenIntervalName('Initial'));
      store.dispatch(waveformSlice.actions.setStationsVisibility({}));
    });

    await waitFor(() => {
      expect(mockedGetFilterDefinitionsForSignalDetections).not.toHaveBeenCalled();
    });
  });
});
