import type { CommonTypes, WaveformTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import type { AxiosRequestConfig } from 'axios';

import type { UiChannelSegment } from '../../types';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for fetching channel segments by channel and time.
 *
 * @param requestConfig the request config
 * @param currentInterval the current interval
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns the fetch result containing signal detections with segments
 */
export const fetchChannelSegmentsByChannel = async (
  requestConfig: AxiosRequestConfig,
  currentInterval: Nullable<CommonTypes.TimeRange>
): Promise<UiChannelSegment<WaveformTypes.Waveform>[]> =>
  waveformWorkerRpc.rpc(WorkerOperations.FETCH_CHANNEL_SEGMENTS_BY_CHANNEL, {
    originalDomain: currentInterval,
    requestConfig
  });
