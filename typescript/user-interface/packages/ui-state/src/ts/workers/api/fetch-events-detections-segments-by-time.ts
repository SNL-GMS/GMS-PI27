import type { CommonTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import type { AxiosRequestConfig } from 'axios';

import { WorkerOperations } from '../waveform-worker/operations';
import type { EventsWithDetectionsAndSegmentsFetchResults } from '../waveform-worker/operations/fetch-events-detections-segments-by-time';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for fetching events with detections and segments by time.
 *
 * @param requestConfig the request config
 * @param currentInterval the current interval
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns the fetch result containing events with detections and segments
 */
export const fetchEventsWithDetectionsAndSegmentsByTime = async (
  requestConfig: AxiosRequestConfig,
  currentInterval: Nullable<CommonTypes.TimeRange>
): Promise<EventsWithDetectionsAndSegmentsFetchResults> =>
  waveformWorkerRpc.rpc(WorkerOperations.FETCH_EVENTS_WITH_DETECTIONS_AND_SEGMENTS_BY_TIME, {
    originalDomain: currentInterval,
    requestConfig
  });
