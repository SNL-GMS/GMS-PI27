import { getTimeRangeFromChannelSegment } from '../../../src/ts/app/util/channel-segment-util';
import { channelSegmentWithSamples } from '../../__data__';

describe('Channel segment util test', () => {
  test('getTimeRangeFromChannelSegment isDataBySampleRate', () => {
    expect(getTimeRangeFromChannelSegment(channelSegmentWithSamples)).toMatchInlineSnapshot(`
      {
        "endTimeSecs": 1638298200,
        "startTimeSecs": 1638297900,
      }
    `);
  });
});
