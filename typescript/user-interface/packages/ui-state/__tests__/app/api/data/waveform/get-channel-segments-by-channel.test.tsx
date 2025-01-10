import { PD01ChannelVersionReference } from '@gms/common-model/__tests__/__data__';
import cloneDeep from 'lodash/cloneDeep';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { GetChannelSegmentsByChannelQueryArgs } from '../../../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel';
import {
  addGetChannelSegmentsByChannelMatchReducers,
  getChannelSegmentsByChannel,
  getChannelSegmentsByChannelQuery
} from '../../../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel';
import type { AppState } from '../../../../../src/ts/app/store';
import { getStore } from '../../../../../src/ts/app/store';
import { appState } from '../../../../test-util';

jest.mock('../../../../../src/ts/workers/api', () => {
  const actual = jest.requireActual('../../../../../src/ts/workers/api');
  return {
    ...actual,
    fetchChannelSegmentsByChannel: jest.fn(async () =>
      Promise.reject(new Error('Rejected fetchChannelSegmentsByChannel'))
    )
  };
});

const fiveMinutes = 300;
const endTimeSecs = 123456789;
const startTimeSecs = endTimeSecs - fiveMinutes;

const waveformQueryChannelInput: GetChannelSegmentsByChannelQueryArgs = {
  channels: [PD01ChannelVersionReference],
  startTime: startTimeSecs,
  endTime: endTimeSecs
};

describe('Get Channel Segments for Channels', () => {
  it('have defined', () => {
    expect(getChannelSegmentsByChannelQuery.shouldSkip).toBeDefined();
    expect(getChannelSegmentsByChannel).toBeDefined();
    expect(addGetChannelSegmentsByChannelMatchReducers).toBeDefined();
  });

  it('build a builder using addGetChannelSegmentsByChannelMatchReducers', () => {
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

    addGetChannelSegmentsByChannelMatchReducers(builder);
    expect(builderMap).toMatchSnapshot();

    // eslint-disable-next-line prefer-const
    let state = { queries: { getChannelSegmentsByChannel: {} } };
    // eslint-disable-next-line prefer-const
    let action = {
      meta: {
        requestId: getChannelSegmentsByChannelQuery.idGenerator({
          channels: [{ name: 'channelName', effectiveAt: startTimeSecs }],
          startTime: startTimeSecs,
          endTime: endTimeSecs
        }),
        arg: { channels: [{ name: 'channelName' }] }
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

  it('can determine when to skip query execution', () => {
    expect(
      getChannelSegmentsByChannelQuery.shouldSkip({
        ...waveformQueryChannelInput,
        startTime: null
      })
    ).toBeTruthy();
    expect(
      getChannelSegmentsByChannelQuery.shouldSkip({
        ...waveformQueryChannelInput,
        endTime: null
      })
    ).toBeTruthy();
    expect(
      getChannelSegmentsByChannelQuery.shouldSkip({
        ...waveformQueryChannelInput,
        channels: []
      })
    ).toBeTruthy();
    expect(getChannelSegmentsByChannelQuery.shouldSkip(waveformQueryChannelInput)).toBeFalsy();
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(
      getChannelSegmentsByChannel({ ...waveformQueryChannelInput, channels: [] }) as any
    );

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  it('will not execute query if the current interval is not defined', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(getChannelSegmentsByChannel(waveformQueryChannelInput) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'channelSegment/getChannelSegmentsByChannel/rejected'
    );
    expect(store.getActions()[store.getActions().length - 1].payload).toMatchInlineSnapshot(
      `[Error: Rejected fetchChannelSegmentsByChannel]`
    );
  });

  it('can handle rejected state', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const realStore = getStore();

    const state = cloneDeep(realStore.getState());
    state.app.workflow.timeRange.startTimeSecs = 4;
    state.app.workflow.timeRange.endTimeSecs = 6;

    const store = mockStoreCreator(state);

    await store.dispatch(getChannelSegmentsByChannel(waveformQueryChannelInput) as any);

    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'channelSegment/getChannelSegmentsByChannel/rejected'
    );
  });
});
