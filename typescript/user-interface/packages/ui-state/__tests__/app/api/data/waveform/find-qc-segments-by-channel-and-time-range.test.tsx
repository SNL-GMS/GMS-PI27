import { PD01Channel } from '@gms/common-model/__tests__/__data__';

import type { FindQCSegmentsByChannelAndTimeRangeQueryArgs } from '../../../../../src/ts/app/api/data/waveform/find-qc-segments-by-channel-and-time-range';
import {
  addFindQCSegmentsByChannelAndTimeRangeMatchReducers,
  findQCSegmentsByChannelAndTimeRange,
  findQCSegmentsByChannelAndTimeRangeQuery
} from '../../../../../src/ts/app/api/data/waveform/find-qc-segments-by-channel-and-time-range';

const fiveMinutes = 300000;
const endTimeMils = 123456789;
const startTimeSecs = (endTimeMils - fiveMinutes) / 1000;

const waveformQueryChannelInput: FindQCSegmentsByChannelAndTimeRangeQueryArgs = {
  channels: [PD01Channel],
  startTime: startTimeSecs,
  endTime: endTimeMils / 1000
};

describe('finds qc segments by channel and time', () => {
  it('have defined', () => {
    expect(findQCSegmentsByChannelAndTimeRangeQuery.shouldSkip).toBeDefined();
    expect(findQCSegmentsByChannelAndTimeRange).toBeDefined();
    expect(addFindQCSegmentsByChannelAndTimeRangeMatchReducers).toBeDefined();
  });

  it('build a builder using addFindQCSegmentsByChannelAndTimeRangeMatchReducers', () => {
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

    addFindQCSegmentsByChannelAndTimeRangeMatchReducers(builder);
    expect(builderMap).toMatchSnapshot();

    // eslint-disable-next-line prefer-const
    let state = { queries: { findQCSegmentsByChannelAndTimeRange: {} } };
    // eslint-disable-next-line prefer-const
    let action = {
      meta: { requestId: 12345, arg: { startTime: 0 } },
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
      findQCSegmentsByChannelAndTimeRangeQuery.shouldSkip({
        ...waveformQueryChannelInput,
        channels: []
      })
    ).toBeTruthy();
    expect(
      findQCSegmentsByChannelAndTimeRangeQuery.shouldSkip(waveformQueryChannelInput)
    ).toBeFalsy();
  });
});
