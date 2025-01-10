import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  addGetChannelsByNamesTimeRangeMatchReducers,
  getChannelsByNamesTimeRange,
  getChannelsByNamesTimeRangeQuery
} from '../../../../../src/ts/app/api/data/channel/get-channels-by-names-timerange';
import type { GetChannelsByNamesTimeRangeQueryArgs } from '../../../../../src/ts/app/api/data/channel/types';
import type { AppState } from '../../../../../src/ts/app/store';
import { testChannel } from '../../../../__data__/channel-data';
import { appState } from '../../../../test-util';

jest.mock('../../../../../src/ts/workers/api', () => {
  const actual = jest.requireActual('../../../../../src/ts/workers/api');
  return {
    ...actual,
    fetchChannelsByNamesTimeRange: jest.fn(async () =>
      Promise.reject(new Error('Rejected fetchChannelsByNamesTimeRange'))
    )
  };
});

const channelQueryArgs: GetChannelsByNamesTimeRangeQueryArgs = {
  channelNames: ['ASAR'],
  startTime: 0,
  endTime: 1
};

describe('Get Channel Segments for Channels', () => {
  it('have defined', () => {
    expect(getChannelsByNamesTimeRangeQuery.shouldSkip).toBeDefined();
    expect(getChannelsByNamesTimeRange).toBeDefined();
    expect(addGetChannelsByNamesTimeRangeMatchReducers).toBeDefined();
  });

  it('build a builder using addGetChannelsByNamesReducers', () => {
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

    addGetChannelsByNamesTimeRangeMatchReducers(builder);

    // eslint-disable-next-line prefer-const
    let state = {
      channels: {
        raw: {},
        derived: {}
      },
      queries: { getChannelsByNamesTimeRange: {} }
    };
    // eslint-disable-next-line prefer-const
    let action = {
      meta: { requestId: 0, arg: channelQueryArgs },
      payload: [testChannel]
    };
    builderMap[0](state, action);
    expect(state.queries.getChannelsByNamesTimeRange['0'][action.meta.requestId].status).toMatch(
      'pending'
    );
    expect(state.channels).toMatchObject({
      raw: {},
      derived: {}
    });

    builderMap[1](state, action);
    expect(state.queries.getChannelsByNamesTimeRange['0'][action.meta.requestId].status).toMatch(
      'fulfilled'
    );
    expect(state.channels).toMatchObject({
      raw: {
        [testChannel.name]: testChannel
      },
      derived: {}
    });

    builderMap[2](state, action);
    expect(state.queries.getChannelsByNamesTimeRange['0'][action.meta.requestId].status).toMatch(
      'rejected'
    );
  });

  it('can determine when to skip query execution', () => {
    expect(
      getChannelsByNamesTimeRangeQuery.shouldSkip({ ...channelQueryArgs, channelNames: [] })
    ).toBeTruthy();
    expect(getChannelsByNamesTimeRangeQuery.shouldSkip(channelQueryArgs)).toBeFalsy();
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(
      getChannelsByNamesTimeRange({ ...channelQueryArgs, channelNames: [] }) as any
    );

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(getChannelsByNamesTimeRange(channelQueryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'channel/getChannelsByNamesTimeRange/rejected'
    );
  });
});
