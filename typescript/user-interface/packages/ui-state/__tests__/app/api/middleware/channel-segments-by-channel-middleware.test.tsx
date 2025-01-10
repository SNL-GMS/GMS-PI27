import {
  memoizedDispatchGetChannelSegmentsByChannel,
  populateChannelSegmentsByChannelMiddleware
} from '../../../../src/ts/app/api/middleware/channel-segments-by-channel-middleware';
import type { AnalystWaveformTypes } from '../../../../src/ts/ui-state';
import { testChannel } from '../../../__data__/channel-data';

jest.mock('../../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel'
  );
  return {
    ...actual,
    getChannelSegmentsByChannel: jest.fn()
  };
});

describe('Events and detections segments by time population middleware', () => {
  it('Exports the correct functions', () => {
    expect(memoizedDispatchGetChannelSegmentsByChannel).toBeDefined();
    expect(populateChannelSegmentsByChannelMiddleware).toBeDefined();
  });

  it('fetch getChannelSegmentsByChannel is dispatched when the correct args are given', () => {
    const viewableInterval = {
      startTimeSecs: 100,
      endTimeSecs: 200
    };
    const stationsVisibility: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};
    stationsVisibility.ARCES = { visibility: true, stationName: 'ARCES', isStationExpanded: true };
    const rawChannels = { testChannel };
    const action = { meta: { arg: {} } } as any;
    const mockDispatch = jest.fn(() => {
      return { catch: jest.fn };
    });
    memoizedDispatchGetChannelSegmentsByChannel(
      viewableInterval,
      stationsVisibility,
      rawChannels,
      action,
      mockDispatch
    );
    // correct args make it to the dispatch
    expect(mockDispatch).toHaveBeenCalled();
  });
});
