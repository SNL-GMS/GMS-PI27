import { SignalDetectionTypes } from '@gms/common-model';
import { Units } from '@gms/common-model/lib/common/types';
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

import type { AppState } from '../../../../src/ts/app';
import { getStore, useAppDispatch } from '../../../../src/ts/app';
import type {
  PredictFeatures,
  PredictFeaturesForEventLocation,
  PredictFeaturesForEventLocationArgs
} from '../../../../src/ts/app/api/data/event/predict-features-for-event-location';
import {
  addPredictFeaturesForEventLocationMatchReducers,
  eventLocationToString,
  predictFeaturesForEventLocation,
  predictFeaturesForEventLocationQuery,
  usePreCachePredictFeaturesForEventLocation
} from '../../../../src/ts/app/api/data/event/predict-features-for-event-location';
import { appState } from '../../../test-util';

const queryArgs: PredictFeaturesForEventLocationArgs = {
  phases: ['P'],
  sourceLocation: {
    depthKm: 0,
    latitudeDegrees: 50,
    longitudeDegrees: 100,
    time: 100
  },
  receivers: [
    {
      receiverBandType: '',
      receiverDataType: '',
      receiverLocationsByName: {
        nameA: {
          depthKm: 0,
          elevationKm: 0,
          latitudeDegrees: 100,
          longitudeDegrees: 100
        }
      }
    }
  ]
};

const payload: PredictFeatures = {
  receiverLocationsByName: {
    nameA: {
      featurePredictions: [
        {
          extrapolated: true,
          phase: 'P',
          predictionType: SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME,
          predictionValue: {
            featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME,
            featurePredictionComponentSet: [],
            predictedValue: {
              arrivalTime: {
                units: Units.UNITLESS,
                value: 3,
                standardDeviation: 0
              }
            },
            derivativeMap: {
              DERIVATIVE_WRT_DEPTH: {
                value: 5,
                standardDeviation: 0,
                units: Units.SECONDS
              }
            }
          },
          receiverLocation: { depthKm: 4, latitudeDegrees: 3, longitudeDegrees: 3, elevationKm: 3 },
          sourceLocation: { depthKm: 4, latitudeDegrees: 3, longitudeDegrees: 3, time: 1 },
          channel: undefined,
          predictionChannelSegment: undefined
        }
      ]
    }
  }
};

const savedState: PredictFeaturesForEventLocation = {
  '100_0_50_100': payload
};

const stateWithPredictFeaturesForEventLocation: AppState = produce(appState, draft => {
  draft.data.predictFeaturesForEventLocation = savedState;
});

const mockAxiosRequest = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    data: payload
  })
);
Axios.request = mockAxiosRequest;

describe('Predict features for event location', () => {
  it('has defined functions', () => {
    expect(predictFeaturesForEventLocation).toBeDefined();
    expect(addPredictFeaturesForEventLocationMatchReducers).toBeDefined();
    expect(usePreCachePredictFeaturesForEventLocation).toBeDefined();
    expect(eventLocationToString).toBeDefined();
  });

  it('builds a builder using addPredictFeaturesForEventLocationMatchReducers', () => {
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

    addPredictFeaturesForEventLocationMatchReducers(builder);

    const state = {
      predictFeaturesForEventLocation: {},
      queries: {
        predictFeaturesForEventLocation: {}
      }
    };

    const action = {
      meta: {
        requestId: predictFeaturesForEventLocationQuery.idGenerator(queryArgs),
        arg: queryArgs
      },
      payload
    };

    builderMap[0](state, action);
    expect(
      state.queries.predictFeaturesForEventLocation[
        predictFeaturesForEventLocationQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('pending');
    expect(state.predictFeaturesForEventLocation).toMatchObject({});

    builderMap[1](state, action);
    expect(
      state.queries.predictFeaturesForEventLocation[
        predictFeaturesForEventLocationQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('fulfilled');
    expect(savedState).toMatchInlineSnapshot(`
      {
        "100_0_50_100": {
          "receiverLocationsByName": {
            "nameA": {
              "featurePredictions": [
                {
                  "channel": undefined,
                  "extrapolated": true,
                  "phase": "P",
                  "predictionChannelSegment": undefined,
                  "predictionType": "ARRIVAL_TIME",
                  "predictionValue": {
                    "derivativeMap": {
                      "DERIVATIVE_WRT_DEPTH": {
                        "standardDeviation": 0,
                        "units": "SECONDS",
                        "value": 5,
                      },
                    },
                    "featureMeasurementType": "ARRIVAL_TIME",
                    "featurePredictionComponentSet": [],
                    "predictedValue": {
                      "arrivalTime": {
                        "standardDeviation": 0,
                        "units": "UNITLESS",
                        "value": 3,
                      },
                    },
                  },
                  "receiverLocation": {
                    "depthKm": 4,
                    "elevationKm": 3,
                    "latitudeDegrees": 3,
                    "longitudeDegrees": 3,
                  },
                  "sourceLocation": {
                    "depthKm": 4,
                    "latitudeDegrees": 3,
                    "longitudeDegrees": 3,
                    "time": 1,
                  },
                },
              ],
            },
          },
        },
      }
    `);
    expect(state.predictFeaturesForEventLocation).toMatchInlineSnapshot(`
      {
        "100_0_50_100": {
          "receiverLocationsByName": {
            "nameA": {
              "featurePredictions": [
                {
                  "channel": undefined,
                  "extrapolated": true,
                  "phase": "P",
                  "predictionChannelSegment": undefined,
                  "predictionType": "ARRIVAL_TIME",
                  "predictionValue": {
                    "derivativeMap": {
                      "DERIVATIVE_WRT_DEPTH": {
                        "standardDeviation": 0,
                        "units": "SECONDS",
                        "value": 5,
                      },
                    },
                    "featureMeasurementType": "ARRIVAL_TIME",
                    "featurePredictionComponentSet": [],
                    "predictedValue": {
                      "arrivalTime": {
                        "standardDeviation": 0,
                        "units": "UNITLESS",
                        "value": 3,
                      },
                    },
                  },
                  "receiverLocation": {
                    "depthKm": 4,
                    "elevationKm": 3,
                    "latitudeDegrees": 3,
                    "longitudeDegrees": 3,
                  },
                  "sourceLocation": {
                    "depthKm": 4,
                    "latitudeDegrees": 3,
                    "longitudeDegrees": 3,
                    "time": 1,
                  },
                },
              ],
            },
          },
        },
      }
    `);
    expect(state.predictFeaturesForEventLocation).toMatchObject(savedState);

    builderMap[2](state, action);
    expect(
      state.queries.predictFeaturesForEventLocation[
        predictFeaturesForEventLocationQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('rejected');

    expect('').toBeFalsy();
  });

  it('can determine when to skip query execution', () => {
    expect(
      predictFeaturesForEventLocationQuery.shouldSkip({
        ...queryArgs,
        phases: []
      })
    ).toBeTruthy();
    expect(
      predictFeaturesForEventLocationQuery.shouldSkip({
        ...queryArgs,
        receivers: []
      })
    ).toBeTruthy();
    expect(
      predictFeaturesForEventLocationQuery.shouldSkip({
        ...queryArgs,
        sourceLocation: undefined
      })
    ).toBeTruthy();
    expect(predictFeaturesForEventLocationQuery.shouldSkip(queryArgs)).toBeFalsy();
  });

  it('can create lookup keys from the arguments', () => {
    expect(predictFeaturesForEventLocationQuery.idGenerator(queryArgs)).toMatchInlineSnapshot(
      `"sourceLocation:100_0_50_100/receivers:__nameA/phases:P"`
    );
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(stateWithPredictFeaturesForEventLocation);

    const badQueryArgs: PredictFeaturesForEventLocationArgs = {
      ...queryArgs,
      receivers: []
    };

    await store.dispatch(predictFeaturesForEventLocation(badQueryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(stateWithPredictFeaturesForEventLocation);

    await store.dispatch(predictFeaturesForEventLocation(queryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'eventManagerApi/predictFeaturesForEventLocation/fulfilled'
    );
  });

  it('sample predict features for event location query test', async () => {
    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={getStore()}>{props.children}</Provider>
      )
    });

    const result = await dispatch.result.current(predictFeaturesForEventLocation(queryArgs));
    expect(unwrapResult(result)).toMatchObject(payload);

    // should not re-query
    const result2 = await dispatch.result.current(predictFeaturesForEventLocation(queryArgs));

    expect(() => {
      unwrapResult(result2);
    }).toThrow();
  });
});
