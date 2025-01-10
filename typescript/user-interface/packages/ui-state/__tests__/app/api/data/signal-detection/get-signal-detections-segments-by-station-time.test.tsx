/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { CommonTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { enableMapSet } from 'immer';
import cloneDeep from 'lodash/cloneDeep';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { getStore } from '../../../../../src/ts/app';
import type { GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs } from '../../../../../src/ts/app/api/data/signal-detection/get-signal-detections-segments-by-station-time';
import {
  addGetSignalDetectionsWithSegmentsByStationAndTimeMatchReducers,
  getSignalDetectionsWithSegmentsByStationAndTime,
  getSignalDetectionsWithSegmentsByStationAndTimeQuery
} from '../../../../../src/ts/app/api/data/signal-detection/get-signal-detections-segments-by-station-time';
import { reducer } from '../../../../../src/ts/app/state/reducer';
import type { AppState } from '../../../../../src/ts/app/store';
import { appState } from '../../../../test-util';

enableMapSet();

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

// mock the uuid
uuid.asString = jest.fn().mockImplementation(() => '12345789');

jest.mock('../../../../../src/ts/workers/api', () => {
  const actual = jest.requireActual('../../../../../src/ts/workers/api');
  return {
    ...actual,
    getSignalDetections: jest.fn(async () =>
      Promise.reject(new Error('Rejected getSignalDetections'))
    )
  };
});

const now = 1234567890 / 1000;
const timeRange: CommonTypes.TimeRange = {
  startTimeSecs: now - 3600,
  endTimeSecs: now
};

const asarStation = {
  name: 'ASAR',
  effectiveAt: timeRange.startTimeSecs
};

const signalDetectionQueryArgs: GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs = {
  stations: [asarStation],
  startTime: timeRange.startTimeSecs,
  endTime: timeRange.endTimeSecs,
  stageId: {
    name: 'AL1',
    effectiveTime: timeRange.startTimeSecs
  }
};

describe('Get Signal Detection by Station', () => {
  it('have defined', () => {
    expect(getSignalDetectionsWithSegmentsByStationAndTimeQuery).toBeDefined();
    expect(getSignalDetectionsWithSegmentsByStationAndTime).toBeDefined();
    expect(addGetSignalDetectionsWithSegmentsByStationAndTimeMatchReducers).toBeDefined();
  });

  it('build a builder using getSignalDetectionsWithSegmentsByStationMatchReducers', () => {
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

    addGetSignalDetectionsWithSegmentsByStationAndTimeMatchReducers(builder);
    expect(builderMap).toMatchSnapshot();

    const state = { queries: { getSignalDetectionWithSegmentsByStationAndTime: {} } };

    const arg = {
      stageId: { name: 'stage1' },
      stations: [{ name: 'stationA' }],
      startTime: 5,
      endTime: 10,
      excludedSignalDetections: []
    };

    const action = {
      meta: {
        requestId: getSignalDetectionsWithSegmentsByStationAndTimeQuery.idGenerator(arg),
        arg
      },
      payload: { stationA: { signalDetections: [], uiChannelSegments: [] } }
    };
    builderMap[0](state, action);
    expect(state).toMatchSnapshot();
    builderMap[1](state, action);
    expect(state).toMatchSnapshot();
    builderMap[2](state, action);
    expect(state).toMatchSnapshot();
  });

  it('can determine when to skip query execution', () => {
    expect(
      getSignalDetectionsWithSegmentsByStationAndTimeQuery.shouldSkip({
        ...signalDetectionQueryArgs,
        stations: []
      })
    ).toBeTruthy();
    expect(
      getSignalDetectionsWithSegmentsByStationAndTimeQuery.shouldSkip(signalDetectionQueryArgs)
    ).toBeFalsy();
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(
      getSignalDetectionsWithSegmentsByStationAndTime({
        ...signalDetectionQueryArgs,
        stations: []
      }) as any
    );

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  it('will not execute query if the current interval is not defined', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(
      getSignalDetectionsWithSegmentsByStationAndTime(signalDetectionQueryArgs) as any
    );

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signalDetection/getSignalDetectionsWithSegmentsByStationAndTime/rejected'
    );

    expect(store.getActions()[store.getActions().length - 1].payload).toMatchInlineSnapshot(
      `[TypeError: Cannot read properties of undefined (reading 'type')]`
    );

    expect(
      reducer(store.getState() as any, store.getActions()[store.getActions().length - 1])
    ).toMatchSnapshot();
  });

  it('can handle rejected state', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const realStore = getStore();

    const state = cloneDeep(realStore.getState());
    state.app.workflow.timeRange.startTimeSecs = 4;
    state.app.workflow.timeRange.endTimeSecs = 6;

    const store = mockStoreCreator(state);

    await store.dispatch(
      getSignalDetectionsWithSegmentsByStationAndTime(signalDetectionQueryArgs) as any
    );

    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signalDetection/getSignalDetectionsWithSegmentsByStationAndTime/rejected'
    );
  });
});
