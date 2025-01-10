import {
  linearFilterDefinition,
  signalDetectionAsarAs01Shz,
  signalDetectionAsarAs02Shz
} from '@gms/common-model/__tests__/__data__';
import { unwrapResult } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { getStore, useAppDispatch } from '../../../../../src/ts/app';
import type {
  FetchFilterDefinitionsForSignalDetectionsResponse,
  GetFilterDefinitionsForSignalDetectionsQueryArgs
} from '../../../../../src/ts/app/api/data/signal-detection/get-filter-definitions-for-signal-detections';
import {
  addGetFilterDefinitionsForSignalDetectionsMatchReducers,
  getFilterDefinitionsForSignalDetections,
  getFilterDefinitionsForSignalDetectionsQuery,
  reduceSignalDetectionsForFilterDefinitionQuery
} from '../../../../../src/ts/app/api/data/signal-detection/get-filter-definitions-for-signal-detections';
import type { AppState } from '../../../../../src/ts/app/store';
import type { SignalDetectionsRecord } from '../../../../../src/ts/types';
import { appState } from '../../../../test-util';

jest.mock('../../../../../src/ts/workers/api', () => {
  const actual = jest.requireActual('../../../../../src/ts/workers/api');
  return {
    ...actual,
    fetchFilterDefinitionsForSignalDetections: jest.fn(async () =>
      Promise.reject(new Error('Rejected fetchFilterDefinitionsForSignalDetections'))
    )
  };
});

const intervalId = {
  name: 'AL1'
};

const signalDetections: SignalDetectionsRecord = {};
signalDetections[signalDetectionAsarAs01Shz.id] = signalDetectionAsarAs01Shz;
signalDetections[signalDetectionAsarAs02Shz.id] = signalDetectionAsarAs02Shz;

const queryArgs: GetFilterDefinitionsForSignalDetectionsQueryArgs = {
  stageId: {
    name: intervalId.name
  },
  signalDetections: [
    {
      id: signalDetectionAsarAs01Shz.id
    }
  ]
};

const payload: FetchFilterDefinitionsForSignalDetectionsResponse = {
  filterDefinitionByUsageBySignalDetectionHypothesis: [
    {
      signalDetectionHypothesis: { id: signalDetectionAsarAs01Shz.signalDetectionHypotheses[0].id },
      filterDefinitionByFilterDefinitionUsage: {
        ONSET: linearFilterDefinition,
        FK: linearFilterDefinition,
        DETECTION: linearFilterDefinition,
        AMPLITUDE: linearFilterDefinition
      }
    }
  ]
};

jest.mock('../../../../../src/ts/workers/api', () => {
  const actual = jest.requireActual('../../../../../src/ts/workers/api');
  return {
    ...actual,
    fetchFilterDefinitionsForSignalDetections: jest.fn().mockImplementation(async () => {
      return Promise.resolve(payload);
    })
  };
});

describe('Get filter definitions for signal detections', () => {
  it('have defined', () => {
    expect(getFilterDefinitionsForSignalDetections).toBeDefined();
    expect(addGetFilterDefinitionsForSignalDetectionsMatchReducers).toBeDefined();
  });

  it('build a builder using addGetFilterDefinitionsForSignalDetectionsMatchReducers', () => {
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

    addGetFilterDefinitionsForSignalDetectionsMatchReducers(builder);

    const state = {
      filterDefinitionsForSignalDetections: {},
      missingSignalDetectionsHypothesesForFilterDefinitions: [],
      queries: { getFilterDefinitionsForSignalDetections: {} }
    };

    const action = {
      meta: {
        requestId: getFilterDefinitionsForSignalDetectionsQuery.idGenerator(queryArgs),
        arg: queryArgs
      },
      payload
    };

    builderMap[0](state, action);
    expect(
      state.queries.getFilterDefinitionsForSignalDetections[
        getFilterDefinitionsForSignalDetectionsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('pending');
    expect(state.filterDefinitionsForSignalDetections).toMatchObject({});

    builderMap[1](state, action);
    expect(
      state.queries.getFilterDefinitionsForSignalDetections[
        getFilterDefinitionsForSignalDetectionsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('fulfilled');

    expect(state.filterDefinitionsForSignalDetections).toMatchInlineSnapshot(`
      {
        "428b672f-e6eb-4728-9ddc-c13146c0da12": {
          "AMPLITUDE": {
            "comments": "Sample Filter Definition Comments",
            "filterDescription": {
              "causal": true,
              "comments": "Test description comments",
              "filterType": "LINEAR",
              "highFrequencyHz": 0.8,
              "linearFilterType": "IIR_BUTTERWORTH",
              "lowFrequencyHz": 0.3,
              "order": 2,
              "parameters": {
                "groupDelaySec": 1,
                "sampleRateHz": 30,
                "sampleRateToleranceHz": 20,
              },
              "passBandType": "BAND_PASS",
              "zeroPhase": true,
            },
            "name": "Sample Filter Definition Name",
          },
          "DETECTION": {
            "comments": "Sample Filter Definition Comments",
            "filterDescription": {
              "causal": true,
              "comments": "Test description comments",
              "filterType": "LINEAR",
              "highFrequencyHz": 0.8,
              "linearFilterType": "IIR_BUTTERWORTH",
              "lowFrequencyHz": 0.3,
              "order": 2,
              "parameters": {
                "groupDelaySec": 1,
                "sampleRateHz": 30,
                "sampleRateToleranceHz": 20,
              },
              "passBandType": "BAND_PASS",
              "zeroPhase": true,
            },
            "name": "Sample Filter Definition Name",
          },
          "FK": {
            "comments": "Sample Filter Definition Comments",
            "filterDescription": {
              "causal": true,
              "comments": "Test description comments",
              "filterType": "LINEAR",
              "highFrequencyHz": 0.8,
              "linearFilterType": "IIR_BUTTERWORTH",
              "lowFrequencyHz": 0.3,
              "order": 2,
              "parameters": {
                "groupDelaySec": 1,
                "sampleRateHz": 30,
                "sampleRateToleranceHz": 20,
              },
              "passBandType": "BAND_PASS",
              "zeroPhase": true,
            },
            "name": "Sample Filter Definition Name",
          },
          "ONSET": {
            "comments": "Sample Filter Definition Comments",
            "filterDescription": {
              "causal": true,
              "comments": "Test description comments",
              "filterType": "LINEAR",
              "highFrequencyHz": 0.8,
              "linearFilterType": "IIR_BUTTERWORTH",
              "lowFrequencyHz": 0.3,
              "order": 2,
              "parameters": {
                "groupDelaySec": 1,
                "sampleRateHz": 30,
                "sampleRateToleranceHz": 20,
              },
              "passBandType": "BAND_PASS",
              "zeroPhase": true,
            },
            "name": "Sample Filter Definition Name",
          },
        },
      }
    `);

    builderMap[2](state, action);
    expect(
      state.queries.getFilterDefinitionsForSignalDetections[
        getFilterDefinitionsForSignalDetectionsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('rejected');
  });

  it('can determine when to skip query execution', () => {
    expect(
      getFilterDefinitionsForSignalDetectionsQuery.shouldSkip({
        ...queryArgs,
        signalDetections: []
      })
    ).toBeTruthy();
    expect(getFilterDefinitionsForSignalDetectionsQuery.shouldSkip(queryArgs)).toBeFalsy();
  });

  it('can generate a unique id', () => {
    expect(
      getFilterDefinitionsForSignalDetectionsQuery.idGenerator({
        stageId: { name: 'sample' },
        signalDetections: [{ id: 'B' }, { id: 'A' }]
      })
    ).toMatchInlineSnapshot(`"stageId:sample/signalDetections:A;B"`);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);
    const reducedSDs = reduceSignalDetectionsForFilterDefinitionQuery(signalDetections);

    await store.dispatch(getFilterDefinitionsForSignalDetections(intervalId, reducedSDs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signalDetection/getFilterDefinitionsForSignalDetections/fulfilled'
    );
  });

  it('sample filter definitions for signal detections query test', async () => {
    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={getStore()}>{props.children}</Provider>
      )
    });
    const reducedSDs = reduceSignalDetectionsForFilterDefinitionQuery(signalDetections);

    const result = await dispatch.result.current(
      getFilterDefinitionsForSignalDetections(intervalId, reducedSDs)
    );
    expect(unwrapResult(result)).toMatchInlineSnapshot(`
      {
        "filterDefinitionByUsageBySignalDetectionHypothesis": [
          {
            "filterDefinitionByFilterDefinitionUsage": {
              "AMPLITUDE": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
              "DETECTION": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
              "FK": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
              "ONSET": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
            },
            "signalDetectionHypothesis": {
              "id": {
                "id": "428b672f-e6eb-4728-9ddc-c13146c0da12",
                "signalDetectionId": "7fad9f1a-b73c-466d-a5d9-10ad3a6e4fb9",
              },
            },
          },
        ],
      }
    `);
  });
});
