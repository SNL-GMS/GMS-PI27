import type { FkTypes } from '@gms/common-model';
import {
  fkReviewablePhasesByActivityNameByStation,
  fkReviewablePhasesByStation
} from '@gms/common-model/__tests__/__data__';
import type { FkReviewablePhasesByStation } from '@gms/common-model/lib/fk';
import { unwrapResult } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';
import Axios from 'axios';
import { produce } from 'immer';
import React from 'react';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState } from '../../../../../src/ts/app';
import { getStore, useAppDispatch } from '../../../../../src/ts/app';
import type { GetFkReviewablePhasesQueryArgs } from '../../../../../src/ts/app/api/data/signal-enhancement';
import {
  addFkReviewablePhasesMatchReducers,
  fkReviewablePhasesQuery,
  getFkReviewablePhases
} from '../../../../../src/ts/app/api/data/signal-enhancement';
import { appState } from '../../../../test-util';

const activity = {
  name: 'AL1 Event Review'
};

const queryArgs: GetFkReviewablePhasesQueryArgs = {
  stations: [{ name: 'PDAR' }, { name: 'ASAR' }],
  activity
};

const payload: FkTypes.FkReviewablePhasesByStation = fkReviewablePhasesByStation;

const stateWithFkReviewablePhases: AppState = produce(appState, draft => {
  draft.data.fkReviewablePhases = fkReviewablePhasesByActivityNameByStation;
});

const mockAxiosRequest = jest
  .fn()
  .mockImplementation(async () =>
    Promise.resolve({ data: { sample: ['a', 'b', 'c'] } as FkReviewablePhasesByStation })
  );
Axios.request = mockAxiosRequest;

describe('Get FK Reviewable phases for stations', () => {
  it('has defined functions', () => {
    expect(fkReviewablePhasesQuery).toBeDefined();
    expect(addFkReviewablePhasesMatchReducers).toBeDefined();
    expect(getFkReviewablePhases).toBeDefined();
  });

  it('builds a builder using addFkReviewablePhasesMatchReducers', () => {
    const builderMap: any[] = [];
    const builder: any = {
      addCase: (k, v) => {
        builderMap.push(v);
        return builder;
      },
      addMatcher: (k, v) => {
        builderMap.push(v);
        return builder;
      }
    };

    addFkReviewablePhasesMatchReducers(builder);

    // eslint-disable-next-line prefer-const
    let state = {
      fkReviewablePhases: {},
      queries: {
        getFkReviewablePhases: {}
      }
    };

    // eslint-disable-next-line prefer-const
    let action = {
      meta: { requestId: fkReviewablePhasesQuery.idGenerator(queryArgs), arg: queryArgs },
      payload
    };

    // Pending
    builderMap[0](state, action);
    expect(
      state.queries.getFkReviewablePhases[fkReviewablePhasesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('pending');
    expect(state.fkReviewablePhases).toMatchObject({});

    // Fulfilled
    builderMap[1](state, action);
    expect(
      state.queries.getFkReviewablePhases[fkReviewablePhasesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('fulfilled');
    expect(state.fkReviewablePhases[activity.name]).toMatchObject(payload);

    // Rejected
    builderMap[2](state, action);
    expect(
      state.queries.getFkReviewablePhases[fkReviewablePhasesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('rejected');
  });

  it('can determine when to skip query execution', () => {
    expect(
      fkReviewablePhasesQuery.shouldSkip({
        ...queryArgs,
        stations: []
      })
    ).toBeTruthy();
    expect(fkReviewablePhasesQuery.shouldSkip(queryArgs)).toBeFalsy();
  });

  it('can create lookup keys from the arguments', () => {
    expect(fkReviewablePhasesQuery.idGenerator(queryArgs)).toMatchInlineSnapshot(
      `"activity:AL1 Event Review/stations:ASAR;PDAR"`
    );
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(stateWithFkReviewablePhases);

    const badQueryArgs: GetFkReviewablePhasesQueryArgs = {
      ...queryArgs,
      stations: []
    };

    await store.dispatch(getFkReviewablePhases(badQueryArgs) as any);

    // results should have empty arrays
    expect(store.getActions()).toHaveLength(0);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(stateWithFkReviewablePhases);

    await store.dispatch(getFkReviewablePhases(queryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signal-enhancement/getFkReviewablePhases/fulfilled'
    );
  });

  it('sample fk reviewable query test', async () => {
    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={getStore()}>{props.children}</Provider>
      )
    });

    const result = await dispatch.result.current(
      getFkReviewablePhases({ activity: { name: 'sample' }, stations: [{ name: 'sample1' }] })
    );
    expect(unwrapResult(result)).toMatchInlineSnapshot(`
      {
        "sample": [
          "a",
          "b",
          "c",
        ],
      }
    `);
  });
});
