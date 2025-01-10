import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { AxiosRequestConfig } from 'axios';

import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for fetching channels by an array of names
 *
 * @param requestConfig the request config
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns a promise containing channels
 */
export const fetchChannelsByNamesTimeRange = async (
  requestConfig: AxiosRequestConfig
): Promise<Channel[]> => {
  return waveformWorkerRpc.rpc(WorkerOperations.FETCH_CHANNELS_BY_NAMES_TIME_RANGE, requestConfig);
};
