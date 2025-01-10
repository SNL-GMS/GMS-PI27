import type { AxiosRequestConfig } from 'axios';

import type {
  FetchFilterDefinitionsForSignalDetectionsResponse,
  GetFilterDefinitionsForSignalDetectionsQueryArgs
} from '../../app/api/data/signal-detection/get-filter-definitions-for-signal-detections';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for fetching filter definitions for signal detection hypothesis
 *
 * @param requestConfig the request config
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns filter definitions for signal detection hypothesis
 */
export const fetchFilterDefinitionsForSignalDetections = async (
  requestConfig: AxiosRequestConfig<GetFilterDefinitionsForSignalDetectionsQueryArgs>
): Promise<FetchFilterDefinitionsForSignalDetectionsResponse> => {
  return waveformWorkerRpc.rpc(
    WorkerOperations.FETCH_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS,
    requestConfig
  );
};
