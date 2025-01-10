import type { CommonTypes } from '@gms/common-model';
import { renderHook } from '@testing-library/react-hooks';
import axios from 'axios';
import React from 'react';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';

import {
  useCreateNewEventStatus,
  useDuplicateEventStatus,
  useEventStatusQuery,
  useGetEvents,
  useGetEventsWithDetectionsAndSegmentsByTimeHistory,
  useQueryArgsForGetEventsWithDetectionsAndSegmentsByTime,
  useRejectDeleteEventStatus
} from '../../../src/ts/app/hooks/event-manager-hooks';
import { workflowActions } from '../../../src/ts/app/state/workflow/workflow-slice';
import { getStore } from '../../../src/ts/app/store';

jest.mock('axios');
axios.request = jest.fn(() => {
  return {
    method: 'post',
    url: '/resolve',
    responseType: 'json',
    proxy: false,
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    timeout: 60000,
    data: { stages: [], configName: 'ui.analyst-settings', selectors: [] }
  };
}) as any;

describe('Event Manager API Slice', () => {
  it('all hooks are defined', () => {
    expect(useCreateNewEventStatus).toBeDefined();
    expect(useDuplicateEventStatus).toBeDefined();
    expect(useEventStatusQuery).toBeDefined();
    expect(useGetEvents).toBeDefined();
    expect(useGetEventsWithDetectionsAndSegmentsByTimeHistory).toBeDefined();
    expect(useQueryArgsForGetEventsWithDetectionsAndSegmentsByTime).toBeDefined();
    expect(useRejectDeleteEventStatus).toBeDefined();
    expect(useRejectDeleteEventStatus).toBeDefined();
  });

  it('has a hook for query arg generation', () => {
    const store = getStore();
    store.dispatch(workflowActions.setOpenIntervalName('AL1'));

    function Wrapper({ children }) {
      return <Provider store={store}>{children}</Provider>;
    }
    const timeInterval: CommonTypes.TimeRange = { startTimeSecs: 1, endTimeSecs: 6 };
    const { result } = renderHook(
      () => useQueryArgsForGetEventsWithDetectionsAndSegmentsByTime(timeInterval),
      {
        wrapper: Wrapper
      }
    );
    expect(result.current).toMatchInlineSnapshot(`
      {
        "endTime": 6,
        "stageId": {
          "name": "AL1",
        },
        "startTime": 1,
      }
    `);
  });

  it('hook queries for find event status', () => {
    (axios.request as jest.Mock).mockImplementation(
      jest.fn(() => {
        return {
          status: 200,
          statusText: 'OK',
          data: {},
          headers: [],
          config: {}
        };
      })
    );
    const store = getStore();
    store.dispatch(workflowActions.setTimeRange({ startTimeSecs: 200, endTimeSecs: 400 }));
    store.dispatch(workflowActions.setOpenIntervalName('test'));

    function Component() {
      const result = useEventStatusQuery();
      return <>{JSON.stringify(result.data)}</>;
    }

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('event status hook does not query with no stage name', () => {
    const store = getStore();
    store.dispatch(workflowActions.setTimeRange({ startTimeSecs: 200, endTimeSecs: 400 }));
    store.dispatch(workflowActions.setOpenIntervalName(''));

    function Component() {
      const result = useEventStatusQuery();
      return <>{JSON.stringify(result.data)}</>;
    }

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('useGetChannelSegmentsByChannels returns an object with loading values', () => {
    (axios.request as jest.Mock).mockImplementation(
      jest.fn(() => {
        return {
          status: 200,
          statusText: 'OK',
          data: {},
          headers: [],
          config: {}
        };
      })
    );
    const store = getStore();
    store.dispatch(workflowActions.setTimeRange({ startTimeSecs: 200, endTimeSecs: 400 }));

    function Wrapper({ children }) {
      return <Provider store={store}>{children}</Provider>;
    }
    const { result } = renderHook(() => useGetEvents(), {
      wrapper: Wrapper
    });
    expect(result.current).toMatchSnapshot();
  });
});
