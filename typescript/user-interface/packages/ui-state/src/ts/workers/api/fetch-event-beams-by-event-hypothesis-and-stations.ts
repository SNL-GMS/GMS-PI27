import type { CommonTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import type { AxiosRequestConfig } from 'axios';

import type { UiChannelSegmentByEventHypothesisId } from '../../app';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for fetching event beams by event hypothesis and station query.
 *
 * @param requestConfig the request config
 * @param currentInterval the current interval
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns the fetch result containing event hypothesis and UiChannelSegments touple array
 */
export const fetchEventBeamsByEventHypothesisAndStations = async (
  requestConfig: AxiosRequestConfig,
  currentInterval: Nullable<CommonTypes.TimeRange>
): Promise<UiChannelSegmentByEventHypothesisId> => {
  return waveformWorkerRpc.rpc(
    WorkerOperations.FETCH_EVENT_BEAMS_BY_EVENT_HYPOTHESIS_AND_STATIONS,
    {
      originalDomain: currentInterval,
      requestConfig
    }
  );
};
