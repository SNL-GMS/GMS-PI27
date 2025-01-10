import { eventData } from '@gms/common-model/__tests__/__data__';
import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import {
  analystActions,
  getStore,
  selectEvents,
  selectOpenEventId,
  selectOpenIntervalName,
  useAppSelector,
  waveformActions,
  workflowActions
} from '../../../../src/ts/app';
import { getEventsWithDetectionsAndSegmentsByTimeQuery } from '../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time';

const testMock = jest.fn();

jest.mock('../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time'
  );
  return {
    ...actual,
    getEventsWithDetectionsAndSegmentsByTime: () => async () => {
      testMock();
      return new Promise(resolve => {
        resolve({
          type: getEventsWithDetectionsAndSegmentsByTimeQuery.typePrefix,
          payload: {
            events: [eventData],
            signalDetections: [],
            uiChannelSegments: []
          }
        });
      });
    }
  };
});

describe('Events and detections segments by time population middleware', () => {
  it('will not run if an arbitrary action is fired off', () => {
    const store = getStore();
    const { result } = renderHook(() => useAppSelector(selectEvents), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      store.dispatch(analystActions.setOpenEventId('TEST'));
    });

    expect(Object.keys(result.current)).toHaveLength(0);
  });
  it('will not run if an interval is not open', () => {
    const store = getStore();
    const { result } = renderHook(() => useAppSelector(selectEvents), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      store.dispatch(analystActions.setOpenEventId(''));
    });

    expect(selectOpenEventId(store.getState())).toBe('');

    expect(Object.keys(result.current)).toHaveLength(0);
  });
  it('will run if the correct action is triggered and an interval is open', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectEvents), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      store.dispatch(workflowActions.setOpenIntervalName('TEST'));
      store.dispatch(waveformActions.setViewableInterval({ startTimeSecs: 0, endTimeSecs: 1 }));
    });

    expect(selectOpenIntervalName(store.getState())).toBe('TEST');

    await waitFor(() => {
      expect(testMock).toHaveBeenCalled();
    });
  });
});
