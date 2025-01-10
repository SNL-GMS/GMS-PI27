import type { CommonTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import type { ExtraOptions } from '@gms/ui-workers';
import { axiosBaseQuery } from '@gms/ui-workers';
import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query';
import type { AxiosRequestConfig } from 'axios';

import type {
  EventBeamsByEventHypothesisAndStations,
  UiChannelSegmentByEventHypothesisId
} from '../../../app';
import { CANCELED } from '../../../app';
import { convertChannelSegmentsToTypedArrays } from '../util/channel-segment-util';

const logger = UILogger.create('GMS_LOG_FETCH_EVENT_BEAMS', process.env.GMS_LOG_FETCH_EVENT_BEAMS);

export interface FetchEventBeamsParameters {
  originalDomain: CommonTypes.TimeRange;
  requestConfig: AxiosRequestConfig;
}

/**
 * Sends a request to the server using the provided request configuration and query key.
 * Uses the defaultQuery function to perform the request.
 * Validates the returned data to ensure it is of the expected type.
 * Converts the returned data to the TypedArray format Weavess requires.
 *
 * @param requestConfig the request configuration
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 */
export const requestEventBeamsByEventHypothesisAndStations = async (
  requestConfig: AxiosRequestConfig,
  originalDomain: CommonTypes.TimeRange
): Promise<UiChannelSegmentByEventHypothesisId> => {
  if (!requestConfig.baseURL) {
    return Promise.reject(
      new Error('Cannot make a request on the worker without a baseUrl in the config')
    );
  }

  try {
    const queryFn = axiosBaseQuery<EventBeamsByEventHypothesisAndStations>({
      baseUrl: requestConfig.baseURL
    });

    // ! pass {} as the second and third args because our axios request doesn't use the api or extra options
    const result = await queryFn(
      {
        requestConfig
      },
      {} as BaseQueryApi,
      {} as ExtraOptions
    );

    const uiChannelSegmentByEventHypothesisId: UiChannelSegmentByEventHypothesisId = {};
    if (result.data) {
      await Promise.all(
        result.data.eventHypothesisChannelSegmentsPairs.map(async eventBeams => {
          const channelSegments = await convertChannelSegmentsToTypedArrays(
            eventBeams.channelSegments ?? [],
            originalDomain
          );
          if (!uiChannelSegmentByEventHypothesisId[eventBeams.eventHypothesis.id.hypothesisId]) {
            uiChannelSegmentByEventHypothesisId[eventBeams.eventHypothesis.id.hypothesisId] = [];
          }
          uiChannelSegmentByEventHypothesisId[eventBeams.eventHypothesis.id.hypothesisId].push(
            ...channelSegments
          );
        })
      );
    }
    return uiChannelSegmentByEventHypothesisId;
  } catch (error) {
    if (error.message !== CANCELED) {
      logger.error(`[Worker] Error fetching/loading event beams`, error);
    }
    return Promise.reject(error);
  }
};

/**
 * Fetches event beams.
 *
 * @param params the request parameters
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 */
export const fetchEventBeamsByEventHypothesisAndStations = async (
  params: FetchEventBeamsParameters
): Promise<UiChannelSegmentByEventHypothesisId> => {
  return requestEventBeamsByEventHypothesisAndStations(params.requestConfig, params.originalDomain);
};
