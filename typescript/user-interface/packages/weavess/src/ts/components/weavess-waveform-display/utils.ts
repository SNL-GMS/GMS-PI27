import 'moment-precise-range-plugin';

import { MILLISECONDS_IN_SECOND } from '@gms/common-util';
import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessConstants, WeavessUtil } from '@gms/weavess-core';
import { isDataBySampleRate, isDataClaimCheck } from '@gms/weavess-core/lib/types';
import moment from 'moment';

/**
 * Calculates the left percentage for a given time based on the provided start and end times.
 *
 * @param timeSeconds The time to calculate the left percentage on
 * @param startTimeSeconds The start time in seconds
 * @param endTimeSeconds The end time in seconds
 *
 * @returns left percentage as a number
 */
export const calculateLeftPercent = (
  timeSeconds: number,
  startTimeSecs: number,
  endTimeSecs: number
): number => {
  const scale = WeavessUtil.scaleLinear([startTimeSecs, endTimeSecs], [0, 1]);
  return scale(timeSeconds) * WeavessConstants.PERCENT_100;
};
/**
 * Cleans up after THREE js objects such as Camera and Scene
 *
 * @param obj THREE object
 */
export const clearThree = (obj: any): void => {
  if (!obj) {
    return;
  }
  while (obj.children?.length > 0) {
    clearThree(obj.children[0]);
    obj.remove(obj.children[0]);
  }
  if (obj.geometry) obj.geometry.dispose();

  if (obj.material) {
    // in case of map, bumpMap, normalMap, envMap ...
    Object.keys(obj.material).forEach(prop => {
      if (!obj.material[prop]) return;
      if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')
        obj.material[prop].dispose();
    });
    if (obj?.material?.dispose && typeof obj.material.dispose === 'function')
      obj.material.dispose();
  }
};

/**
 * Calculates the right percentage for a given time based on the provided start and end times.
 *
 * @param timeSeconds The time to calculate the left percentage on
 * @param startTimeSeconds The start time in seconds
 * @param endTimeSeconds The end time in seconds
 *
 * @returns right percentage as a number
 */
export const calculateRightPercent = (
  timeSeconds: number,
  startTimeSeconds: number,
  endTimeSeconds: number
): number =>
  WeavessConstants.PERCENT_100 -
  calculateLeftPercent(timeSeconds, startTimeSeconds, endTimeSeconds);

/**
 * Helper function to format the number of seconds difference between start and end time
 *
 * @param interval time interval in epoch seconds
 * @returns string formatted number of seconds
 */
export const deltaTimeString = (interval: WeavessTypes.TimeRange): string => {
  const deltaSecs = interval.endTimeSecs - interval.startTimeSecs;
  if (deltaSecs > 1) {
    return `${(moment as any).preciseDiff(
      moment.unix(interval.endTimeSecs),
      moment.unix(interval.startTimeSecs)
    )}`;
  }

  let precision = 5;
  if (deltaSecs > 1 / MILLISECONDS_IN_SECOND) {
    precision = 4;
  }
  return `${Number.parseFloat(deltaSecs.toFixed(precision))} seconds`;
};

/**
 * Time range of display interval as human-readable string
 * in the following structure: `startTime - endTime, duration`
 * startTime and endTime default to `YYYY-MM-DD HH:mm:ss.SSS` if no other format is specified
 *
 * @param interval: WeavessTypes.TimeRange
 * @param format: optional string to format start and end time using moment. Defaults to `YYYY-MM-DD HH:mm:ss.SSS`
 * @returns interval formatted string to display
 */
export const timeRangeDisplayString = (
  interval: WeavessTypes.TimeRange,
  format = 'YYYY-MM-DD HH:mm:ss.SSS'
): string => {
  if (!interval) {
    return ``;
  }
  const formattedStartTime = moment.unix(interval.startTimeSecs).utc().format(format);

  const formattedEndTime = moment.unix(interval.endTimeSecs).utc().format(format);

  return `${formattedStartTime} - ${formattedEndTime}, ${deltaTimeString(interval)}`;
};

/**
 * Determine if time falls within time range
 *
 * @param timeSecs
 * @param timeRange
 * @returns boolean
 */
export const isWithinTimeRange = (timeSecs: number, timeRange: WeavessTypes.TimeRange): boolean => {
  if (timeSecs >= timeRange.startTimeSecs && timeSecs <= timeRange.endTimeSecs) {
    return true;
  }
  return false;
};

/**
 * Gets the channel segments for a station's default channel
 * Only returns the channel segments for the currently applied filter.
 * If none is found, returns an empty array
 */
function getChannelSegmentsFromDefaultChannel(
  station: WeavessTypes.Station | undefined
): WeavessTypes.ChannelSegment[] {
  const waveform = station?.defaultChannel?.waveform;
  return waveform?.channelSegmentsRecord?.[waveform.channelSegmentId] ?? [];
}

/**
 * Gets the channel segments for the non-default channel of the provided channelId from the provided station.
 * Only returns the channel segments for the currently applied filter.
 * If none is found, returns an empty array
 */
function getChannelSegmentsFromNonDefaultChannel(
  channelId: string,
  station: WeavessTypes.Station | undefined
): WeavessTypes.ChannelSegment[] {
  const waveform = station?.nonDefaultChannels?.find(
    nonDefaultChannel => nonDefaultChannel.id === channelId
  )?.waveform;
  return waveform?.channelSegmentsRecord?.[waveform.channelSegmentId] ?? [];
}

/**
 * Gets the channel segments for a specific channel by a point in time.
 *
 * @param channelId the channel id
 * @param timeSecs the time in epoch seconds
 * @param stations the current array of stations
 * @returns an array of selected channel segments
 */
export const getChannelSegmentsFromStationAndTime = (
  channelId: string,
  timeSecs: number,
  stations: WeavessTypes.Station[],
  isDefaultChannel: boolean
): WeavessTypes.ChannelSegment[] => {
  if (!channelId || !timeSecs || !stations) return [];
  const stationName = channelId.split('.')[0];
  const station = stations.find(s => s.name === stationName);
  const channelSegments = isDefaultChannel
    ? getChannelSegmentsFromDefaultChannel(station)
    : getChannelSegmentsFromNonDefaultChannel(channelId, station);
  return channelSegments.filter(channelSegment => {
    return !!channelSegment.dataSegments.find(dataSegment => {
      if (isDataClaimCheck(dataSegment.data) || isDataBySampleRate(dataSegment.data)) {
        const { startTimeSecs, endTimeSecs } = dataSegment.data;
        return timeSecs >= startTimeSecs && timeSecs <= endTimeSecs;
      }

      return false;
    });
  });
};

/**
 * Sets focus to weavess wp container viewport
 */
export function setFocusToWeavess(): void {
  // this container is important because that is where the onblur is called
  // see packages/weavess/src/ts/components/weavess-waveform-display/weavess-waveform-display.tsx
  const weavess = document.getElementsByClassName('weavess');
  const weavessElement = weavess[0] as HTMLElement;
  weavessElement?.focus();
}
