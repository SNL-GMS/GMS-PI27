import type { AxiosRequestConfig } from 'axios';

import type { FilterDefinitionsForSignalDetectionsRecord } from '../../ui-state';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for fetching default filter definitions for channel segments
 *
 * @param requestConfig the request config
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns default filter definitions for channel segments
 */
export const fetchDefaultFilterDefinitionByUsageForChannelSegments = async (
  requestConfig: AxiosRequestConfig
): Promise<FilterDefinitionsForSignalDetectionsRecord> => {
  return waveformWorkerRpc.rpc(
    WorkerOperations.FETCH_DEFAULT_FILTER_DEFINITION_BY_USAGE_FOR_CHANNEL_SEGMENTS,
    requestConfig
  );
};
