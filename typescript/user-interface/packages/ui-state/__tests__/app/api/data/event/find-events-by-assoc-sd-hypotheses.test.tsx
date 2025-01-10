import { CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import { Units } from '@gms/common-model/lib/common/types';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState } from '../../../../../src/ts/app';
import {
  addFindEventsByAssociatedSignalDetectionHypothesesMatchReducers,
  findEventsByAssociatedSignalDetectionHypotheses,
  findEventsByAssociatedSignalDetectionHypothesesQuery
} from '../../../../../src/ts/app/api/data/event/find-events-by-assoc-sd-hypotheses';
import type { FindEventsByAssociatedSignalDetectionHypothesesQueryArgs } from '../../../../../src/ts/app/api/data/event/types';
import { appState } from '../../../../test-util';

const mockArgs: FindEventsByAssociatedSignalDetectionHypothesesQueryArgs = {
  signalDetectionHypotheses: [
    {
      id: {
        id: '20cc9505-efe3-3068-b7d5-59196f37992c',
        signalDetectionId: '012de1b9-8ae3-3fd4-800d-58665c3152cc'
      },
      parentSignalDetectionHypothesis: null,
      deleted: false,
      station: {
        name: 'ASAR',
        effectiveAt: 0
      },
      monitoringOrganization: 'GMS',
      featureMeasurements: [
        {
          channel: {
            name: 'ASAR.beam.SHZ/beam,fk,coherent/steer,az_90.142deg,slow_7.122s_per_deg/06c0cb24-ab8f-3853-941d-bdf5e73a51b4',
            effectiveAt: 1636503404
          },
          measuredChannelSegment: {
            id: {
              channel: {
                name: 'ASAR.beam.SHZ/beam,fk,coherent/steer,az_90.142deg,slow_7.122s_per_deg/06c0cb24-ab8f-3853-941d-bdf5e73a51b4',
                effectiveAt: 1636503404
              },
              startTime: 1636503404,
              endTime: 1636503704,
              creationTime: 1636503404
            }
          },
          measurementValue: {
            arrivalTime: {
              value: 1636503404,
              standardDeviation: 1.162,
              units: CommonTypes.Units.SECONDS
            },
            travelTime: { value: 0, units: Units.COUNTS_PER_NANOMETER }
          },
          snr: {
            value: 8.9939442,
            standardDeviation: 0,
            units: CommonTypes.Units.DECIBELS
          },
          featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
        }
      ]
    }
  ],
  stageId: { name: 'AL1' }
};

describe('Find events by associated SD hypotheses', () => {
  test('contains definitions', () => {
    expect(addFindEventsByAssociatedSignalDetectionHypothesesMatchReducers).toBeDefined();
    expect(findEventsByAssociatedSignalDetectionHypotheses).toBeDefined();
    expect(findEventsByAssociatedSignalDetectionHypothesesQuery).toBeDefined();
  });

  test('query is skipped when args are falsy, not skipped when args are truthy', () => {
    const mockSkipArgs: FindEventsByAssociatedSignalDetectionHypothesesQueryArgs = {
      signalDetectionHypotheses: [],
      stageId: { name: 'test' }
    };
    expect(
      findEventsByAssociatedSignalDetectionHypothesesQuery.shouldSkip(mockSkipArgs)
    ).toBeTruthy();
    expect(findEventsByAssociatedSignalDetectionHypothesesQuery.shouldSkip(mockArgs)).toBeFalsy();
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(
      findEventsByAssociatedSignalDetectionHypotheses({
        ...mockArgs,
        signalDetectionHypotheses: []
      }) as any
    );

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  test('findEventsByAssociatedSignalDetectionHypotheses returns events', () => {
    expect(findEventsByAssociatedSignalDetectionHypotheses(mockArgs)).toMatchSnapshot();
  });

  test('addFindEventsByAssociatedSignalDetectionHypothesesMatchReducers builds', () => {
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

    addFindEventsByAssociatedSignalDetectionHypothesesMatchReducers(builder);
    expect(builderMap).toMatchSnapshot();
    const state = { queries: { findEventsByAssociatedSignalDetectionHypotheses: {} } };
    // eslint-disable-next-line prefer-const
    let action = {
      meta: {
        requestId: findEventsByAssociatedSignalDetectionHypothesesQuery.idGenerator(mockArgs),
        mockArgs
      },
      payload: []
    };

    builderMap[0](state, action);
    expect(state).toMatchSnapshot();
    builderMap[1](state, action);
    expect(state).toMatchSnapshot();
    builderMap[2](state, action);
    expect(state).toMatchSnapshot();
  });
});
