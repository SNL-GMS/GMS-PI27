import type {
  ChannelSegmentTypes,
  EventTypes,
  SignalDetectionTypes,
  WaveformTypes
} from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import type { ExtraOptions } from '@gms/ui-workers';
import { axiosBaseQuery } from '@gms/ui-workers';
import type { WeavessTypes } from '@gms/weavess-core';
import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query';
import type { AxiosRequestConfig } from 'axios';

import { CANCELED } from '../../../app';
import type { UiChannelSegment } from '../../../types';
import { convertChannelSegmentsToTypedArrays } from '../util/channel-segment-util';

const logger = UILogger.create('GMS_LOG_FETCH_EVENTS', process.env.GMS_LOG_FETCH_EVENTS);

export interface FetchEventsWithDetectionsAndSegmentsParameters {
  originalDomain: WeavessTypes.TimeRange;
  requestConfig: AxiosRequestConfig;
}

/**
 * Events fetch type returned by worker.
 */
export interface EventsWithDetectionsAndSegmentsFetchResults {
  events: EventTypes.Event[];
  signalDetections: SignalDetectionTypes.SignalDetection[];
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
}

/**
 * Sends a request to the server using the provided request configuration.
 * Validates the returned data to ensure it is of the expected type
 * Converts the returned channelSegment data to the TypedArray format Weavess requires.
 *
 * @param requestConfig the request configuration
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 */
export const requestEventsAndDetectionsWithSegments = async (
  requestConfig: AxiosRequestConfig,
  originalDomain: WeavessTypes.TimeRange
): Promise<EventsWithDetectionsAndSegmentsFetchResults> => {
  if (!requestConfig.baseURL) {
    return Promise.reject(
      new Error('Cannot make a request on the worker without a baseUrl in the config')
    );
  }
  let result;

  try {
    const queryFn = axiosBaseQuery<{
      events: EventTypes.Event[];
      signalDetections: SignalDetectionTypes.SignalDetection[];
      channelSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[];
    }>({
      baseUrl: requestConfig.baseURL
    });

    // ! pass {} as the second and third args because our axios request doesn't use the api or extra options
    result = await queryFn(
      {
        requestConfig: {
          ...requestConfig
        }
      },
      {} as BaseQueryApi,
      {} as ExtraOptions
    );

    return {
      events: result?.data?.events ?? [],
      signalDetections: result?.data?.signalDetections ?? [],
      uiChannelSegments: await convertChannelSegmentsToTypedArrays(
        result?.data?.channelSegments ?? [],
        originalDomain
      )
    };
  } catch (error) {
    if (error.message !== CANCELED) {
      logger.error(`[Worker] Error fetching/loading events and detections with segments`, error);
    }
    return Promise.reject(error);
  }
};

/**
 * Fetches events and detections with segments.
 *
 * @param params the request parameters
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 */
export const fetchEventsAndDetectionsWithSegments = async (
  params: FetchEventsWithDetectionsAndSegmentsParameters
): Promise<EventsWithDetectionsAndSegmentsFetchResults> => {
  return requestEventsAndDetectionsWithSegments(params.requestConfig, params.originalDomain);
};
