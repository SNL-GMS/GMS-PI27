import type { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import type { ExtraOptions } from '@gms/ui-workers';
import { axiosBaseQuery } from '@gms/ui-workers';
import type { WeavessTypes } from '@gms/weavess-core';
import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query';
import type { AxiosRequestConfig } from 'axios';

import { CANCELED } from '../../../app';
import type { UiChannelSegment } from '../../../types';
import { convertChannelSegmentsToTypedArrays } from '../util/channel-segment-util';

const logger = UILogger.create('GMS_LOG_FETCH_WAVEFORMS', process.env.GMS_LOG_FETCH_WAVEFORMS);

export interface FetchWaveformParameters {
  originalDomain: WeavessTypes.TimeRange;
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
export const requestChannelSegments = async (
  requestConfig: AxiosRequestConfig,
  originalDomain: WeavessTypes.TimeRange
): Promise<UiChannelSegment<WaveformTypes.Waveform>[]> => {
  if (!requestConfig.baseURL) {
    return Promise.reject(
      new Error('Cannot make a request on the worker without a baseUrl in the config')
    );
  }

  try {
    const queryFn = axiosBaseQuery<ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[]>({
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

    return convertChannelSegmentsToTypedArrays(result.data ?? [], originalDomain);
  } catch (error) {
    if (error.message !== CANCELED) {
      logger.error(`[Worker] Error fetching/loading waveforms`, error);
    }
    return Promise.reject(error);
  }
};

/**
 * Fetches channel segments.
 *
 * @param params the request parameters
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 */
export const fetchChannelSegmentsByChannel = async (
  params: FetchWaveformParameters
): Promise<UiChannelSegment<WaveformTypes.Waveform>[]> => {
  return requestChannelSegments(params.requestConfig, params.originalDomain);
};
