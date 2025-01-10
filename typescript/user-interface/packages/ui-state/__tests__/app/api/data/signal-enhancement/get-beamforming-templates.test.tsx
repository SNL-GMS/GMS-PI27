import { BeamformingTemplateTypes } from '@gms/common-model';
import {
  beamformingTemplatesByBeamTypeByStationByPhase,
  eventBeamformingTemplatesByStationByPhase
} from '@gms/common-model/__tests__/__data__/beamforming-templates/beamforming-templates-data';
import type { AnyAction } from '@reduxjs/toolkit';
import { unwrapResult } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';
import Axios from 'axios';
import { produce } from 'immer';
import React from 'react';
import { Provider } from 'react-redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState } from '../../../../../src/ts/app';
import { getStore, useAppDispatch } from '../../../../../src/ts/app';
import type { GetBeamformingTemplatesQueryArgs } from '../../../../../src/ts/app/api/data/signal-enhancement';
import {
  addBeamformingTemplatesMatchReducers,
  beamformingTemplatesQuery,
  getBeamformingTemplates
} from '../../../../../src/ts/app/api/data/signal-enhancement';
import { appState } from '../../../../test-util';

const queryArgs: GetBeamformingTemplatesQueryArgs = {
  phases: ['P'],
  stations: [
    { name: 'ASAR', effectiveAt: 1689026400 },
    { name: 'PDAR', effectiveAt: 1689026400 }
  ],
  beamType: BeamformingTemplateTypes.BeamType.EVENT
};

const payload: BeamformingTemplateTypes.BeamformingTemplatesByStationByPhase =
  eventBeamformingTemplatesByStationByPhase;

const stateWithBeams: AppState = produce(appState, draft => {
  draft.data.beamformingTemplates = beamformingTemplatesByBeamTypeByStationByPhase;
});

const mockAxiosRequest = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    data: eventBeamformingTemplatesByStationByPhase
  })
);
Axios.request = mockAxiosRequest;

describe('Get beamforming templates for stations', () => {
  it('has defined functions', () => {
    expect(beamformingTemplatesQuery).toBeDefined();
    expect(addBeamformingTemplatesMatchReducers).toBeDefined();
    expect(getBeamformingTemplates).toBeDefined();
  });

  it('builds a builder using addBeamformingTemplatesMatchReducers', () => {
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

    addBeamformingTemplatesMatchReducers(builder);

    const state = {
      beamformingTemplates: {
        FK: {},
        EVENT: {}
      },
      queries: {
        getBeamformingTemplates: {}
      }
    };

    const action = {
      meta: { requestId: beamformingTemplatesQuery.idGenerator(queryArgs), arg: queryArgs },
      payload
    };

    builderMap[0](state, action);
    expect(
      state.queries.getBeamformingTemplates[beamformingTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('pending');
    expect(state.beamformingTemplates).toMatchObject({});

    builderMap[1](state, action);
    expect(
      state.queries.getBeamformingTemplates[beamformingTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('fulfilled');
    expect(state.beamformingTemplates[BeamformingTemplateTypes.BeamType.EVENT]).toMatchObject(
      payload
    );

    builderMap[2](state, action);
    expect(
      state.queries.getBeamformingTemplates[beamformingTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('rejected');

    expect('').toBeFalsy();
  });

  it('can determine when to skip query execution', () => {
    expect(
      beamformingTemplatesQuery.shouldSkip({
        ...queryArgs,
        phases: []
      })
    ).toBeTruthy();
    expect(
      beamformingTemplatesQuery.shouldSkip({
        ...queryArgs,
        stations: []
      })
    ).toBeTruthy();
    expect(beamformingTemplatesQuery.shouldSkip(queryArgs)).toBeFalsy();
  });

  it('can create lookup keys from the arguments', () => {
    expect(beamformingTemplatesQuery.idGenerator(queryArgs)).toMatchInlineSnapshot(
      `"beamType:EVENT/stations:ASAR;PDAR/phases:P"`
    );
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(stateWithBeams);

    const badQueryArgs: GetBeamformingTemplatesQueryArgs = {
      ...queryArgs,
      stations: []
    };

    await store.dispatch(getBeamformingTemplates(badQueryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(stateWithBeams);

    await store.dispatch(getBeamformingTemplates(queryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signal-enhancement/getBeamformingTemplates/fulfilled'
    );
  });

  it('sample beamforming template query test', async () => {
    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={getStore()}>{props.children}</Provider>
      )
    });

    const result = await dispatch.result.current(
      getBeamformingTemplates({
        beamType: BeamformingTemplateTypes.BeamType.EVENT,
        stations: [{ name: 'sample1', effectiveAt: 0 }],
        phases: ['a', 'b', 'c']
      })
    );
    expect(unwrapResult(result)).toMatchInlineSnapshot(`
      {
        "PDAR": {
          "P": {
            "beamDescription": {
              "beamSummation": "COHERENT",
              "beamType": "EVENT",
              "phase": "P",
              "preFilterDefinition": undefined,
              "samplingType": "NEAREST_SAMPLE",
              "twoDimensional": true,
            },
            "beamDuration": 300,
            "inputChannels": [
              {
                "effectiveAt": 1636503404,
                "name": "PDAR.PD01.SHZ",
              },
              {
                "effectiveAt": 1636503404,
                "name": "PDAR.PD02.SHZ",
              },
              {
                "effectiveAt": 1636503404,
                "name": "PDAR.PD03.SHZ",
              },
            ],
            "leadDuration": 5,
            "minWaveformsToBeam": 2,
            "orientationAngleToleranceDeg": 5,
            "sampleRateToleranceHz": 0.5,
            "station": {
              "effectiveAt": 1689026400,
              "name": "PDAR",
            },
          },
        },
      }
    `);
  });
});
