import type { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { WeavessTypes } from '@gms/weavess-core';

import type { UiChannelSegment } from '../../types';
import type { ChannelSegmentColorOptions } from '../../workers/waveform-worker/types';

/**
 * Converts the ChannelSegmentTypes.ChannelSegment waveform to a WeavessTypes.DataSegment[]
 *
 * @param channelSegment returned from waveform query
 * @param domain TimeRange of Current Interval
 * @param semanticColors Color for raw waveform
 * @returns object with list of dataSegments, description, showLabel (boolean), channelSegmentBoundaries
 */
export function channelSegmentToWeavessDataSegment(
  channelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>,
  domain: WeavessTypes.TimeRange,
  waveformColor: string
): WeavessTypes.DataSegment[] {
  // If there was no raw data and no filtered data return empty data segments
  if (!channelSegment?.timeseries || channelSegment.timeseries.length === 0) {
    return [];
  }

  return channelSegment.timeseries.map<WeavessTypes.DataSegment>(wave => {
    if (wave._uiClaimCheckId == null) {
      throw new Error('Invalid waveform claim check id, must be defined');
    }
    return {
      displayType: [WeavessTypes.DisplayType.LINE],
      color: waveformColor,
      pointSize: 1,
      data: {
        startTimeSecs: wave.startTime,
        endTimeSecs: wave.endTime,
        sampleRate: wave.sampleRateHz,
        values: undefined, // vertices
        id: wave._uiClaimCheckId,
        domainTimeRange: domain
      }
    };
  });
}

/**
 * Higher order function that generates a converter that converts waveforms to typed arrays
 * within the given time range (domain).
 *
 * @param domain the low to high bound (inclusive) of timestamps visible in the window
 * @returns a converter function that will return the Weavess.ChannelSegment
 */
export function channelSegmentToWeavessChannelSegment(
  uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>,
  colors: ChannelSegmentColorOptions,
  isSelected = false
): WeavessTypes.ChannelSegment {
  const dataSegments = channelSegmentToWeavessDataSegment(
    uiChannelSegment.channelSegment,
    uiChannelSegment.domainTimeRange,
    colors.waveformColor
  );
  const channelSegmentDescriptor =
    uiChannelSegment.channelSegment?._uiConfiguredInput || uiChannelSegment.channelSegment.id;

  return {
    configuredInputName: JSON.stringify(channelSegmentDescriptor),
    channelName: uiChannelSegment.channelSegment.id.channel.name,
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected,
    description: WeavessTypes.UNFILTERED,
    descriptionLabelColor: colors.labelTextColor,
    dataSegments,
    channelSegmentBoundaries: undefined,
    units: uiChannelSegment.channelSegment.units,
    timeseriesType: uiChannelSegment.channelSegment.timeseriesType
  };
}

/**
 * Determines a {@link TimeRange} from a given {@link DataSegment} object.
 *
 * @returns startTime and endTime in seconds
 */
export const getTimeRangeFromDataSegment = (
  dataSegment: WeavessTypes.DataSegment
): WeavessTypes.TimeRange => {
  if (
    WeavessTypes.isDataBySampleRate(dataSegment.data) ||
    WeavessTypes.isDataClaimCheck(dataSegment.data)
  ) {
    return {
      startTimeSecs: dataSegment.data.startTimeSecs,
      endTimeSecs: dataSegment.data.endTimeSecs
    };
  }
  const startTimeSecs = WeavessTypes.isFloat32Array(dataSegment.data.values)
    ? dataSegment.data.values[0]
    : dataSegment.data.values[0].timeSecs;
  const endTimeSecs = WeavessTypes.isFloat32Array(dataSegment.data.values)
    ? dataSegment.data.values[dataSegment.data.values.length - 2]
    : dataSegment.data.values[dataSegment.data.values.length - 1].timeSecs;
  return {
    startTimeSecs,
    endTimeSecs
  };
};

/**
 * Determines a {@link TimeRange} from a given {@link ChannelSegment} object.
 *
 * @returns startTime and endTime in seconds
 */
export const getTimeRangeFromWeavessChannelSegment = (
  cs: WeavessTypes.ChannelSegment
): WeavessTypes.TimeRange => {
  return cs.dataSegments.reduce(
    (finalRange, dataSeg) => {
      const dataSegRange = getTimeRangeFromDataSegment(dataSeg);
      return {
        startTimeSecs: Math.min(finalRange.startTimeSecs, dataSegRange.startTimeSecs),
        endTimeSecs: Math.max(finalRange.endTimeSecs, dataSegRange.endTimeSecs)
      };
    },
    { startTimeSecs: Infinity, endTimeSecs: -Infinity }
  );
};
