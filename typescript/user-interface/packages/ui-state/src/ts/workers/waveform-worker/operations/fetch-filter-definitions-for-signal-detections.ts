import { UILogger } from '@gms/ui-util';
import type { ExtraOptions } from '@gms/ui-workers';
import { axiosBaseQuery } from '@gms/ui-workers';
import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query';
import type { AxiosRequestConfig } from 'axios';

import { CANCELED } from '../../../app';
import type {
  FetchFilterDefinitionsForSignalDetectionsResponse,
  GetFilterDefinitionsForSignalDetectionsQueryArgs
} from '../../../app/api/data/signal-detection/get-filter-definitions-for-signal-detections';

const logger = UILogger.create(
  'GMS_LOG_FETCH_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS',
  process.env.GMS_LOG_FETCH_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS
);

/**
 * Sends a request to the server using the provided request configuration.
 *
 * @param requestConfig the request configuration
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns a promise containing a record of filter definitions
 */
export const fetchFilterDefinitionsForSignalDetections = async (
  requestConfig: AxiosRequestConfig<GetFilterDefinitionsForSignalDetectionsQueryArgs>
): Promise<FetchFilterDefinitionsForSignalDetectionsResponse | undefined> => {
  if (!requestConfig.baseURL) {
    return Promise.reject(
      new Error('Cannot make a request on the worker without a baseUrl in the config')
    );
  }

  try {
    const queryFn = axiosBaseQuery<FetchFilterDefinitionsForSignalDetectionsResponse>({
      baseUrl: requestConfig.baseURL
    });

    const result = await queryFn({ requestConfig }, {} as BaseQueryApi, {} as ExtraOptions);
    return result.data;
  } catch (error) {
    if (error.message !== CANCELED) {
      logger.error(`[Worker] Error fetching/loading filter definitions`, error);
    }
    return Promise.reject(error);
  }
};
