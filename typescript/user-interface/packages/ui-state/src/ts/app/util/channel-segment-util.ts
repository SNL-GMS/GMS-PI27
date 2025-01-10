import type { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { ChannelTypes, WaveformUtil } from '@gms/common-model';
import type { Timeseries } from '@gms/common-model/lib/channel-segment';
import type { WeavessTypes } from '@gms/weavess-core';

import type { UiChannelSegment } from '../../types';

/**
 * Determines a {@link TimeRange} from a given {@link ChannelSegment} object.
 *
 * @returns startTime and endTime in seconds
 */
export const getTimeRangeFromChannelSegment = (
  cs: ChannelSegmentTypes.ChannelSegment<ChannelSegmentTypes.Timeseries>
): WeavessTypes.TimeRange => {
  return cs.timeseries.reduce(
    (finalRange, timeseries) => {
      const timeRange: WeavessTypes.TimeRange = {
        startTimeSecs: timeseries.startTime,
        endTimeSecs: timeseries.endTime
      };
      return {
        startTimeSecs: Math.min(finalRange.startTimeSecs, timeRange.startTimeSecs),
        endTimeSecs: Math.max(finalRange.endTimeSecs, timeRange.endTimeSecs)
      };
    },
    { startTimeSecs: Infinity, endTimeSecs: -Infinity }
  );
};

/**
 * Will provide the correct key to select entries in a channel segment record, or filter record.
 *
 * @param stationId the station id or weavess row name commonly found in a weavess channel or station
 * @param stationName the station name from a weavess station
 * @param channelName the channel name from a weavess channel
 * @returns the correct key to use in a channel segment record, or the channel filter record
 */
export const getChannelRecordKey = (
  stationId: string,
  stationName: string,
  channelName: string
) => {
  if (!ChannelTypes.Util.isSplitChannelName(stationId)) return stationId;
  if (
    !ChannelTypes.Util.isSplitChannelName(channelName) &&
    ChannelTypes.Util.isRawChannelName(channelName)
  )
    return channelName;
  return stationName;
};

/**
 * Type assertion to narrow the type of the timeseries of a UiChannelSegment.
 * If you have a UiChannelSegment and want to see if it contains Waveforms (as opposed to other
 * types of Timeseries), use this.
 *
 * @param uiChannelSegment the UiChannelSegment to test
 * @returns true and narrows the type if the timeseries of uiChannelSegment are Waveforms.
 */
export function isWaveformUiChannelSegment(
  uiChannelSegment: UiChannelSegment<Timeseries>
): uiChannelSegment is UiChannelSegment<WaveformTypes.Waveform> {
  return (
    uiChannelSegment.channelSegment.timeseries?.length > 0 &&
    WaveformUtil.isWaveformTimeseries(uiChannelSegment.channelSegment.timeseries[0])
  );
}
