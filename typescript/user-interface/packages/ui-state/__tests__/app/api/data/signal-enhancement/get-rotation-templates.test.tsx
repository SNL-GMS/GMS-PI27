import type { RotationTypes } from '@gms/common-model';
import {
  rotationTemplateByPhaseByStationRecord,
  rotationTemplatesByStationByPhase
} from '@gms/common-model/__tests__/__data__';
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
import type { GetRotationTemplatesQueryArgs } from '../../../../../src/ts/app/api/data/signal-enhancement';
import {
  addGetRotationTemplatesMatchReducers,
  getRotationTemplates,
  getRotationTemplatesQuery
} from '../../../../../src/ts/app/api/data/signal-enhancement';
import { appState } from '../../../../test-util';

const queryArgs: GetRotationTemplatesQueryArgs = {
  phases: ['P'],
  stations: [
    { name: 'ASAR', effectiveAt: 1689026400 },
    { name: 'PDAR', effectiveAt: 1689026400 }
  ]
};

const payload: RotationTypes.RotationTemplateByPhaseByStation[] = [
  rotationTemplatesByStationByPhase
];

const stateWithRotationTemplates: AppState = produce(appState, draft => {
  draft.data.rotationTemplates = rotationTemplateByPhaseByStationRecord;
});

const mockAxiosRequest = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    data: [rotationTemplatesByStationByPhase]
  })
);
Axios.request = mockAxiosRequest;

describe('Get rotation templates for stations', () => {
  it('has defined functions', () => {
    expect(getRotationTemplatesQuery).toBeDefined();
    expect(addGetRotationTemplatesMatchReducers).toBeDefined();
    expect(getRotationTemplates).toBeDefined();
  });

  it('builds a builder using addGetRotationTemplatesMatchReducers', () => {
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

    addGetRotationTemplatesMatchReducers(builder);

    const state = {
      rotationTemplates: {},
      queries: {
        getRotationTemplates: {}
      }
    };

    const action = {
      meta: { requestId: getRotationTemplatesQuery.idGenerator(queryArgs), arg: queryArgs },
      payload
    };

    builderMap[0](state, action);
    expect(
      state.queries.getRotationTemplates[getRotationTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('pending');
    expect(state.rotationTemplates).toMatchObject({});

    builderMap[1](state, action);
    expect(
      state.queries.getRotationTemplates[getRotationTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('fulfilled');
    expect(state.rotationTemplates).toMatchInlineSnapshot(`
      {
        "AKASG": {
          "rotationTemplatesByPhase": {
            "S": {
              "duration": 300,
              "inputChannels": [
                {
                  "name": "AKASG.AKBB.BHE",
                },
                {
                  "name": "AKASG.AKASG.BHN",
                },
              ],
              "leadDuration": 5,
              "locationToleranceKm": 0.1,
              "orientationAngleToleranceDeg": 5,
              "rotationDescription": {
                "phaseType": "S",
                "samplingType": "NEAREST_SAMPLE",
                "twoDimensional": true,
              },
              "sampleRateToleranceHz": 0.5,
              "station": {
                "name": "AKASG",
              },
            },
          },
          "station": {
            "name": "AKASG",
          },
        },
      }
    `);

    builderMap[2](state, action);
    expect(
      state.queries.getRotationTemplates[getRotationTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('rejected');
  });

  it('can determine when to skip query execution', () => {
    expect(getRotationTemplatesQuery.shouldSkip(queryArgs)).toBe(false);
    expect(
      getRotationTemplatesQuery.shouldSkip({
        ...queryArgs,
        phases: []
      })
    ).toBe(true);
    expect(
      getRotationTemplatesQuery.shouldSkip({
        ...queryArgs,
        stations: []
      })
    ).toBe(true);
  });

  it('can create lookup keys from the arguments', () => {
    expect(getRotationTemplatesQuery.idGenerator(queryArgs)).toMatchInlineSnapshot(
      `"stations:ASAR;PDAR/phases:P"`
    );
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(stateWithRotationTemplates);

    const badQueryArgs: GetRotationTemplatesQueryArgs = {
      ...queryArgs,
      stations: []
    };

    await store.dispatch(getRotationTemplates(badQueryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(stateWithRotationTemplates);

    await store.dispatch(getRotationTemplates(queryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signal-enhancement/getRotationTemplates/fulfilled'
    );
  });

  it('sample rotation template query test', async () => {
    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={getStore()}>{props.children}</Provider>
      )
    });

    const result = await dispatch.result.current(
      getRotationTemplates({
        stations: [{ name: 'sample1', effectiveAt: 0 }],
        phases: ['a', 'b', 'c']
      })
    );
    expect(unwrapResult(result)).toMatchInlineSnapshot(`
      [
        {
          "rotationTemplatesByPhase": {
            "S": {
              "duration": 300,
              "inputChannels": [
                {
                  "name": "AKASG.AKBB.BHE",
                },
                {
                  "name": "AKASG.AKASG.BHN",
                },
              ],
              "leadDuration": 5,
              "locationToleranceKm": 0.1,
              "orientationAngleToleranceDeg": 5,
              "rotationDescription": {
                "phaseType": "S",
                "samplingType": "NEAREST_SAMPLE",
                "twoDimensional": true,
              },
              "sampleRateToleranceHz": 0.5,
              "station": {
                "name": "AKASG",
              },
            },
          },
          "station": {
            "name": "AKASG",
          },
        },
      ]
    `);
  });
});
