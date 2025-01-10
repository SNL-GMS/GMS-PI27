import type { AxiosRequestConfig } from 'axios';

import type { FilterDefinitionsForSignalDetectionsRecord } from '../../types';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for fetching default filter definitions for signal detection hypothesis
 *
 * @param requestConfig the request config
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns filter definitions for signal detection hypothesis
 */
export const fetchDefaultFilterDefinitionsForSignalDetectionHypotheses = async (
  requestConfig: AxiosRequestConfig
): Promise<FilterDefinitionsForSignalDetectionsRecord> => {
  return waveformWorkerRpc.rpc(
    WorkerOperations.FETCH_DEFAULT_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTION_HYPOTHESES,
    requestConfig
  );
};
