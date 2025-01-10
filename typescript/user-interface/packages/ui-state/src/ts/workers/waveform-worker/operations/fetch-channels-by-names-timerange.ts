import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { UILogger } from '@gms/ui-util';
import type { ExtraOptions } from '@gms/ui-workers';
import { axiosBaseQuery } from '@gms/ui-workers';
import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query';
import type { AxiosRequestConfig } from 'axios';

import { CANCELED } from '../../../app';

const logger = UILogger.create(
  'GMS_LOG_FETCH_CHANNELS_BY_NAMES',
  process.env.GMS_LOG_FETCH_CHANNELS_BY_NAMES
);

/**
 * Sends a request to the server using the provided request configuration.
 *
 * @param requestConfig the request configuration
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns a promise containing channels
 */
export const fetchChannelsByNamesTimeRange = async (
  requestConfig: AxiosRequestConfig
): Promise<Channel[]> => {
  if (!requestConfig.baseURL) {
    return Promise.reject(
      new Error('Cannot make a request on the worker without a baseUrl in the config')
    );
  }

  try {
    const queryFn = axiosBaseQuery<Channel[]>({
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
    if (!result.data) {
      throw new Error('Failed to fetch definition data');
    } else {
      return result.data;
    }
  } catch (error) {
    if (error.message !== CANCELED) {
      logger.error(`[Worker] Error fetching/loading channels`, error);
    }
    return Promise.reject(error);
  }
};
