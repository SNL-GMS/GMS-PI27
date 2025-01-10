import type { FkTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes } from '@gms/common-model';
import { WeavessTypes } from '@gms/weavess-core';

import type { UiChannelSegment } from '../../../types';
import { convertAndStoreTimeseries } from './position-buffer-util';

/**
 * Higher order function that generates a converter that converts waveforms to typed arrays
 * within the given time range (domain).
 *
 * @param domain the low to high bound (inclusive) of timestamps visible in the window
 * @returns a converter function that will return the ChannelSegment with a claim check time series
 */
export function channelSegToClaimCheckedChannelSegment(domain: WeavessTypes.TimeRange) {
  return async function convertWaveformToTypedArray(
    chanSeg: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>
  ): Promise<UiChannelSegment<WaveformTypes.Waveform>> {
    const timeseries = await convertAndStoreTimeseries(chanSeg, domain);
    return {
      channelSegment: {
        ...chanSeg,
        timeseries,
        _uiFilterId: WeavessTypes.UNFILTERED
      },
      channelSegmentDescriptor: {
        ...chanSeg.id
      },
      domainTimeRange: domain
    };
  };
}

/**
 * Converts the channel segment into the TypedArray format that Weavess can render.
 *
 * @param chanSegment the waveform channel segment to convert.
 * @param originalDomain the start and end times of the viewable time span in the Weavess Display
 *
 * @returns UiChannelSegment
 */
export const convertChannelSegmentToTypedArray = async (
  chanSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>,
  originalDomain: WeavessTypes.TimeRange
): Promise<UiChannelSegment<WaveformTypes.Waveform>> => {
  const converter = channelSegToClaimCheckedChannelSegment(originalDomain);
  return converter(chanSegment);
};

/**
 * Converts the channel segments timeseries into the TypedArray format.
 *
 * @param chanSegments the list of waveform channel segments to convert.
 * @param originalDomain the start and end times of the viewable time span in the Weavess Display
 */
export const convertChannelSegmentsToTypedArrays = async (
  chanSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[],
  originalDomain: WeavessTypes.TimeRange
): Promise<UiChannelSegment<WaveformTypes.Waveform>[]> => {
  return Promise.all(
    chanSegments.map(async channelSegment => {
      return convertChannelSegmentToTypedArray(channelSegment, originalDomain);
    })
  );
};

/**
 * Checks if FK spectra channel segment
 *
 * @param object Channel Segment
 * @returns boolean
 */
export function isFkSpectraChannelSegment(
  object: ChannelSegmentTypes.ChannelSegment<ChannelSegmentTypes.Timeseries>
): object is ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra> {
  return object.timeseriesType === ChannelSegmentTypes.TimeseriesType.FK_SPECTRA;
}

/**
 * Checks if FK Spectra time series
 *
 * @param object Time Series
 * @param type Time Series Type
 * @returns boolean
 */
export function isFkSpectraTimeseries(
  object: ChannelSegmentTypes.Timeseries,
  type: ChannelSegmentTypes.TimeseriesType
): object is FkTypes.FkSpectra {
  return type === ChannelSegmentTypes.TimeseriesType.FK_SPECTRA;
}

/**
 * Checks if Waveforms time series
 *
 * @param object Time Series
 * @param type Time Series Type
 * @returns boolean
 */
export function isWaveformTimeseries(
  object: ChannelSegmentTypes.Timeseries,
  type: ChannelSegmentTypes.TimeseriesType
): object is WaveformTypes.Waveform {
  return type === ChannelSegmentTypes.TimeseriesType.WAVEFORM;
}

/**
 * Checks if waveform channel segment
 *
 * @param object Channel segment
 * @returns boolean
 */
export function isWaveformChannelSegment(
  object: ChannelSegmentTypes.ChannelSegment<ChannelSegmentTypes.Timeseries>
): object is ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> {
  return (
    object?.timeseries && object.timeseriesType === ChannelSegmentTypes.TimeseriesType.WAVEFORM
  );
}

/**
 * Checks if time series
 *
 * @param object Time series or time series OSD representation
 * @returns boolean
 */
export function isTimeseries(
  object: ChannelSegmentTypes.Timeseries
): object is ChannelSegmentTypes.Timeseries {
  return typeof object.startTime === 'number';
}
