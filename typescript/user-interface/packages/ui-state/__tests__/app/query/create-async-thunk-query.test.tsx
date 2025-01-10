/* eslint-disable @typescript-eslint/no-magic-numbers */
import { uniqSortStrings } from '@gms/common-util';
import { configureStore, createReducer, unwrapResult } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';
import type { AxiosResponse } from 'axios';
import Axios from 'axios';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider, useSelector } from 'react-redux';

import type { AsyncFetchHistory } from '../../../src/ts/app';
import { useAppDispatch } from '../../../src/ts/app';
import type { CreateAsyncThunkQueryProps } from '../../../src/ts/app/query/create-async-thunk-query';
import {
  AsyncThunkQueryThrottledRequestConfig,
  createAsyncThunkQuery,
  getThrottleRequestTimeMs
} from '../../../src/ts/app/query/create-async-thunk-query';

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    epochSecondsNow: () => 100
  };
});

type Args = string[];

type Result = Record<string, string[]>;

type History = AsyncFetchHistory<Args>;

const response: AxiosResponse<Result> = {
  status: 200,
  config: {},
  headers: {},
  statusText: '',
  data: {}
};

interface State {
  data: Result;
  history: History;
}

const initialState: State = {
  data: {},
  history: {}
};

const sampleQuery: CreateAsyncThunkQueryProps<Args, Result, State, [], State> = {
  typePrefix: 'sample/query',
  config: { baseURL: 'sample' },
  getSliceState: state => state,
  getHistory: state => state.history,
  idGenerator: args => uniqSortStrings(args).join(';'),
  shouldSkip: args => !args || (args.length ?? 0) === 0,
  transformArgs: (args, history, id, entries) => {
    const existing = flatMap(entries.map(r => r.arg));
    const missing = args.filter(s => !includes(existing, s));
    return uniqSortStrings(missing);
  },
  transformResult: (a, results) => {
    const output: Result = {};
    results.forEach(result => {
      if (result) {
        Object.keys(result).forEach(k => {
          output[k] = result[k];
        });
      }
    });
    return output;
  },
  updateState: (action, state) => {
    if (action.payload) {
      Object.entries(action.payload).forEach(([key, value]) => {
        state.data[key] = value;
      });
    }
  }
};

const { asyncQuery, addMatchReducers } = createAsyncThunkQuery<Args, Result, State, [], State>(
  sampleQuery
);

const reducer = createReducer(initialState, builder => {
  addMatchReducers(builder);
});

const store = () => configureStore({ reducer });

describe('create async thunk query', () => {
  it('is exported', () => {
    expect(createAsyncThunkQuery).toBeDefined();
    expect(AsyncThunkQueryThrottledRequestConfig).toBeDefined();
    expect(getThrottleRequestTimeMs).toBeDefined();
  });

  it('can retrieve the throttle config', () => {
    expect(getThrottleRequestTimeMs(-1)).toEqual(0);
    expect(getThrottleRequestTimeMs(0)).toEqual(0);
    expect(getThrottleRequestTimeMs(1)).toEqual(0);
    expect(getThrottleRequestTimeMs(2)).toEqual(30000);
    expect(getThrottleRequestTimeMs(3)).toEqual(30000);
    expect(getThrottleRequestTimeMs(4)).toEqual(30000);
    expect(getThrottleRequestTimeMs(5)).toEqual(30000);
    expect(getThrottleRequestTimeMs(6)).toEqual(30000);
    expect(getThrottleRequestTimeMs(7)).toEqual(60000);
    expect(getThrottleRequestTimeMs(8)).toEqual(60000);
    expect(getThrottleRequestTimeMs(9)).toEqual(60000);
    expect(getThrottleRequestTimeMs(10)).toEqual(60000);
    expect(getThrottleRequestTimeMs(11)).toEqual(60000);
    expect(getThrottleRequestTimeMs(12)).toEqual(180000);
    expect(getThrottleRequestTimeMs(13)).toEqual(180000);
    expect(getThrottleRequestTimeMs(14)).toEqual(180000);
    expect(getThrottleRequestTimeMs(15)).toEqual(180000);
    expect(getThrottleRequestTimeMs(16)).toEqual(180000);
    expect(getThrottleRequestTimeMs(17)).toEqual(300000);
    expect(getThrottleRequestTimeMs(18)).toEqual(300000);
    expect(getThrottleRequestTimeMs(19)).toEqual(300000);
    expect(getThrottleRequestTimeMs(21)).toEqual(300000);
    expect(getThrottleRequestTimeMs(22)).toEqual(300000);
    expect(getThrottleRequestTimeMs(23)).toEqual(300000);
    expect(getThrottleRequestTimeMs(24)).toEqual(300000);
    expect(getThrottleRequestTimeMs(25)).toEqual(undefined);
    expect(getThrottleRequestTimeMs(26)).toEqual(undefined);
    expect(getThrottleRequestTimeMs(100)).toEqual(undefined);
  });

  it('simple async thunk query', async () => {
    const mockAxiosRequest = jest
      .fn()
      .mockImplementation(async () =>
        Promise.resolve({ ...response, data: { sample: ['a', 'b', 'c'] } })
      );
    Axios.request = mockAxiosRequest;

    const result = renderHook(
      () => {
        useAppDispatch()(asyncQuery(['sample']) as any);
        return useSelector((state: State) => state.data);
      },
      {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store()}>{props.children}</Provider>
        )
      }
    );
    await act(async () => result.waitForNextUpdate());

    expect(mockAxiosRequest).toHaveBeenCalledTimes(1);
    expect(result.result.current).toMatchInlineSnapshot(`
      {
        "sample": [
          "a",
          "b",
          "c",
        ],
      }
    `);
  });

  it('sample async thunk query that forces two chunked requests', async () => {
    const mockAxiosRequest = jest
      .fn()
      .mockImplementation(async () =>
        Promise.resolve({ ...response, data: { multipleSample: ['a', 'b', 'c', 'd'] } })
      );
    Axios.request = mockAxiosRequest;

    const { asyncQuery: multipleAsyncThunk } = createAsyncThunkQuery<
      Args,
      Result,
      State,
      [],
      State
    >({
      ...sampleQuery,
      prepareRequestConfig: (a, c) => [
        { ...c, data: a },
        { ...c, data: a }
      ],
      transformResult: (a, results) => {
        const output: Result = {};
        results.forEach((r, i) => {
          if (r) {
            Object.entries(r).forEach(([s, v]) => {
              output[`${i}_${s}`] = v;
            });
          }
        });
        return output;
      }
    });

    const result = renderHook(
      () => {
        useAppDispatch()(multipleAsyncThunk(['multipleSample']) as any);
        return useSelector((state: State) => state.data);
      },
      {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store()}>{props.children}</Provider>
        )
      }
    );
    await act(async () => result.waitForNextUpdate());
    expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
    expect(result.result.current).toMatchInlineSnapshot(`
      {
        "0_multipleSample": [
          "a",
          "b",
          "c",
          "d",
        ],
        "1_multipleSample": [
          "a",
          "b",
          "c",
          "d",
        ],
      }
    `);
  });

  it('simple async thunk query with custom query function', async () => {
    const mockAxiosRequest = jest
      .fn()
      .mockImplementation(async () =>
        Promise.resolve({ ...response, data: { sample: ['a', 'b', 'c'] } })
      );
    Axios.request = mockAxiosRequest;

    const queryFn = jest.fn().mockImplementation(() => ({ sample: ['a', 'b', 'c'] }));

    const { asyncQuery: customFunc } = createAsyncThunkQuery<Args, Result, State, [], State>({
      ...sampleQuery,
      customQueryFunc: queryFn
    });

    const result = renderHook(
      () => {
        useAppDispatch()(customFunc(['sample']) as any);
        return useSelector((state: State) => state.data);
      },
      {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store()}>{props.children}</Provider>
        )
      }
    );
    await act(async () => result.waitForNextUpdate());

    expect(mockAxiosRequest).toHaveBeenCalledTimes(0);
    expect(result.result.current).toMatchInlineSnapshot(`
      {
        "sample": [
          "a",
          "b",
          "c",
        ],
      }
    `);
  });

  it('sample async thunk query with immediate full results', async () => {
    const mockAxiosRequest = jest
      .fn()
      .mockImplementation(async () =>
        Promise.resolve({ ...response, data: { sampleImmediateFullResults: ['a', 'b', 'c'] } })
      );
    Axios.request = mockAxiosRequest;

    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store()}>{props.children}</Provider>
      )
    });

    const result = await dispatch.result.current(asyncQuery(['sampleImmediateFullResults']) as any);
    expect(result).toMatchInlineSnapshot(`
      {
        "meta": {
          "arg": [
            "sampleImmediateFullResults",
          ],
          "requestId": "sampleImmediateFullResults",
          "requestStatus": "fulfilled",
        },
        "payload": {
          "sampleImmediateFullResults": [
            "a",
            "b",
            "c",
          ],
        },
        "type": "sample/query/fulfilled",
      }
    `);
  });

  it('sample async thunk query with immediate results', async () => {
    const mockAxiosRequest = jest
      .fn()
      .mockImplementation(async () =>
        Promise.resolve({ ...response, data: { sampleImmediateResults: ['z'] } })
      );
    Axios.request = mockAxiosRequest;

    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store()}>{props.children}</Provider>
      )
    });

    const result = unwrapResult(
      await dispatch.result.current(asyncQuery(['sampleImmediateResults']) as any)
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "sampleImmediateResults": [
          "z",
        ],
      }
    `);
  });

  it('simple async thunk query with condition test', async () => {
    const mockAxiosRequest = jest
      .fn()
      .mockImplementation(async () =>
        Promise.resolve({ ...response, data: { sample: ['a', 'b', 'c'] } })
      );
    Axios.request = mockAxiosRequest;

    const theStore = store();

    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={theStore}>{props.children}</Provider>
      )
    });

    const select = renderHook(() => useSelector((state: State) => state.history), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={theStore}>{props.children}</Provider>
      )
    });

    let result = await dispatch.result
      .current(asyncQuery(['sample1', 'sample2']) as any)
      .then(unwrapResult)
      .then(r => r)
      .catch(rejected => rejected);
    expect(mockAxiosRequest).toHaveBeenCalledTimes(1);
    await act(() => select.rerender());
    expect(select.result.current).toMatchInlineSnapshot(`
      {
        "sample1;sample2": {
          "sample1;sample2": {
            "arg": [
              "sample1",
              "sample2",
            ],
            "attempts": 1,
            "error": {},
            "status": "fulfilled",
            "time": 100,
          },
        },
      }
    `);
    expect(result).toMatchInlineSnapshot(`
      {
        "sample": [
          "a",
          "b",
          "c",
        ],
      }
    `);

    result = await dispatch.result
      .current(asyncQuery(['sample3']) as any)
      .then(unwrapResult)
      .then(r => r)
      .catch(rejected => rejected);
    expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
    await act(() => select.rerender());
    expect(select.result.current).toMatchInlineSnapshot(`
      {
        "sample1;sample2": {
          "sample1;sample2": {
            "arg": [
              "sample1",
              "sample2",
            ],
            "attempts": 1,
            "error": {},
            "status": "fulfilled",
            "time": 100,
          },
        },
        "sample3": {
          "sample3": {
            "arg": [
              "sample3",
            ],
            "attempts": 1,
            "error": {},
            "status": "fulfilled",
            "time": 100,
          },
        },
      }
    `);
    expect(result).toMatchInlineSnapshot(`
      {
        "sample": [
          "a",
          "b",
          "c",
        ],
      }
    `);

    result = await dispatch.result
      .current(asyncQuery(['sample1', 'sample2']) as any)
      .then(unwrapResult)
      .then(r => r)
      .catch(rejected => rejected);
    expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
    await act(() => select.rerender());
    expect(select.result.current).toMatchInlineSnapshot(`
      {
        "sample1;sample2": {
          "sample1;sample2": {
            "arg": [
              "sample1",
              "sample2",
            ],
            "attempts": 1,
            "error": {},
            "status": "fulfilled",
            "time": 100,
          },
        },
        "sample3": {
          "sample3": {
            "arg": [
              "sample3",
            ],
            "attempts": 1,
            "error": {},
            "status": "fulfilled",
            "time": 100,
          },
        },
      }
    `);
    expect(result).toMatchInlineSnapshot(`
      {
        "message": "Aborted due to condition callback returning false.",
        "name": "ConditionError",
      }
    `);

    result = await dispatch.result
      .current(asyncQuery(['sample2']) as any)
      .then(unwrapResult)
      .then(r => r)
      .catch(rejected => rejected);
    expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
    await act(() => select.rerender());
    expect(select.result.current).toMatchInlineSnapshot(`
      {
        "sample1;sample2": {
          "sample1;sample2": {
            "arg": [
              "sample1",
              "sample2",
            ],
            "attempts": 1,
            "error": {},
            "status": "fulfilled",
            "time": 100,
          },
        },
        "sample3": {
          "sample3": {
            "arg": [
              "sample3",
            ],
            "attempts": 1,
            "error": {},
            "status": "fulfilled",
            "time": 100,
          },
        },
      }
    `);
    expect(result).toMatchInlineSnapshot(`
      {
        "message": "Aborted due to condition callback returning false.",
        "name": "ConditionError",
      }
    `);
  });
});
