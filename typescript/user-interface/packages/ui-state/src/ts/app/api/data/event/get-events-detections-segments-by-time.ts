import type { CommonTypes, EventTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import type { Nullable, WithRequired } from '@gms/common-model/lib/type-util/type-util';
import {
  chunkRanges,
  determineExcludedRanges,
  IS_NODE_ENV_DEVELOPMENT,
  LogLevel
} from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type { PriorityRequestConfig } from '@gms/ui-workers';
import { isDraft, original } from 'immer';
import isEqual from 'lodash/isEqual';

import { fetchEventsWithDetectionsAndSegmentsByTime } from '../../../../workers/api';
import type { EventsWithDetectionsAndSegmentsFetchResults } from '../../../../workers/waveform-worker/operations/fetch-events-detections-segments-by-time';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  PrepareRequestConfig,
  ShouldSkip,
  TransformResult,
  UpdateState,
  ValidateResult
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import type { AppState } from '../../../store';
import { getProcessingAnalystConfiguration } from '../../processing-configuration';
import type { DataState } from '../types';
import { mutateUiChannelSegmentsRecord } from '../waveform/mutate-channel-segment-record';
import { config } from './endpoint-configuration';
import type { GetEventsWithDetectionsAndSegmentsByTimeQueryArgs } from './types';

// TODO: Remove error default value when teh end point doesn't return duplicate ids
const logger = UILogger.create(
  'GMS_LOG_FETCH_EVENTS',
  process.env.GMS_LOG_FETCH_EVENTS || LogLevel.ERROR
);

/** validate event data received from the backend; check for duplicates */
const validateEventData = (state: DataState, event: EventTypes.Event) => {
  // validate the received events; check for any duplicates and differences
  if (IS_NODE_ENV_DEVELOPMENT) {
    if (state.events[event.id] !== undefined) {
      const originalEvent = isDraft(state.events[event.id])
        ? original<EventTypes.Event>(state.events[event.id])
        : state.events[event.id];
      if (originalEvent) {
        if (!isEqual(originalEvent, event)) {
          logger.warn(
            `getEventsWithDetectionsAndSegmentsByTime - received duplicate event that are different for id ${originalEvent.id}`,
            originalEvent,
            event
          );
        } else {
          logger.warn(
            `getEventsWithDetectionsAndSegmentsByTime - received duplicate event that are equal for id ${originalEvent.id}`
          );
        }
      }
    }
  }
};

/** validate signal detection data received from the backend; check for duplicates */
const validateSignalDetectionData = (
  state: DataState,
  signalDetection: SignalDetectionTypes.SignalDetection
) => {
  // validate the received signal detections; check for any duplicates and differences
  if (IS_NODE_ENV_DEVELOPMENT) {
    if (state.signalDetections[signalDetection.id] !== undefined) {
      const originalSd = isDraft(state.signalDetections[signalDetection.id])
        ? original<SignalDetectionTypes.SignalDetection>(state.signalDetections[signalDetection.id])
        : state.signalDetections[signalDetection.id];
      if (originalSd) {
        if (!isEqual(originalSd, signalDetection)) {
          logger.warn(
            `getEventsWithDetectionsAndSegmentsByTime - received duplicate sd that are different for id ${originalSd.id}`,
            originalSd,
            signalDetection
          );
        } else {
          logger.warn(
            `getEventsWithDetectionsAndSegmentsByTime - received duplicate sd that are equal for id ${originalSd.id}`
          );
        }
      }
    }
  }
};

const idGenerator: IdGenerator<GetEventsWithDetectionsAndSegmentsByTimeQueryArgs> = args => {
  return `startTime:${args.startTime}-endTime:${args.endTime};stage:${args.stageId?.name}`;
};

const shouldSkip: ShouldSkip<GetEventsWithDetectionsAndSegmentsByTimeQueryArgs> = (args): boolean =>
  !args ||
  args.startTime == null ||
  args.endTime == null ||
  args.stageId == null ||
  args.stageId.name == null;

const updateState: UpdateState<
  GetEventsWithDetectionsAndSegmentsByTimeQueryArgs,
  EventsWithDetectionsAndSegmentsFetchResults,
  DataState
> = (action, state): void => {
  action.payload?.events.forEach(event => {
    state.events[event.id] = event;
  });

  action.payload?.signalDetections.forEach(sd => {
    state.signalDetections[sd.id] = sd;

    const arrivalTime = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
        .featureMeasurements
    );

    const uiChannelSegments = action.payload?.uiChannelSegments.filter(
      seg => seg.channelSegment.id.channel.name === arrivalTime?.channel.name
    );

    if (uiChannelSegments && uiChannelSegments.length > 0) {
      mutateUiChannelSegmentsRecord(state.uiChannelSegments, sd.station.name, uiChannelSegments);
    }
  });
};

const validateResult: ValidateResult<
  GetEventsWithDetectionsAndSegmentsByTimeQueryArgs,
  EventsWithDetectionsAndSegmentsFetchResults,
  AppState
> = (args, result, state) => {
  result?.events.forEach(event => {
    validateEventData(state.data, event);
  });

  result?.signalDetections.forEach(sd => {
    validateSignalDetectionData(state.data, sd);
  });

  return undefined;
};

const prepareRequestConfig: PrepareRequestConfig<
  GetEventsWithDetectionsAndSegmentsByTimeQueryArgs,
  AppState
> = (args, requestConfig, history, id, entries, state) => {
  const MAX_TIME_RANGE_REQUEST_IN_SECONDS_FALLBACK = 300;
  const requests: WithRequired<
    PriorityRequestConfig<GetEventsWithDetectionsAndSegmentsByTimeQueryArgs>,
    'data'
  >[] = [];

  const processingAnalystConfiguration = getProcessingAnalystConfiguration(() => state);

  const maxTimeRangeRequestInSeconds =
    processingAnalystConfiguration?.endpointConfigurations?.getEventsWithDetectionsAndSegmentsByTime
      ?.maxTimeRangeRequestInSeconds || MAX_TIME_RANGE_REQUEST_IN_SECONDS_FALLBACK;

  const ranges = determineExcludedRanges(
    Object.values(entries ?? []).map(v => ({
      start: v.arg.startTime,
      end: v.arg.endTime
    })),
    { start: args.startTime, end: args.endTime }
  );

  if (ranges && ranges.length > 0) {
    // chunk up the data requests based on the `maxTimeRangeRequestInSeconds`
    const chunkedRanges = chunkRanges(ranges, maxTimeRangeRequestInSeconds);
    chunkedRanges.forEach(r => {
      requests.push({
        ...requestConfig,
        data: {
          stageId: args.stageId,
          startTime: r.start,
          endTime: r.end
        }
      });
    });
  }
  return requests;
};

const transformResult: TransformResult<
  GetEventsWithDetectionsAndSegmentsByTimeQueryArgs,
  EventsWithDetectionsAndSegmentsFetchResults
> = (args, results) => {
  const events = results.flatMap(result => result?.events ?? []);
  const signalDetections = results.flatMap(result => result?.signalDetections ?? []);
  const uiChannelSegments = results.flatMap(result => result?.uiChannelSegments ?? []);

  return { events, signalDetections, uiChannelSegments };
};

export const getEventsWithDetectionsAndSegmentsByTimeQuery: CreateAsyncThunkQueryProps<
  GetEventsWithDetectionsAndSegmentsByTimeQueryArgs,
  EventsWithDetectionsAndSegmentsFetchResults,
  DataState,
  [Nullable<CommonTypes.TimeRange>]
> = {
  typePrefix: 'events/getEventsWithDetectionsAndSegmentsByTime',
  config: config.event.services.getEventsWithDetectionsAndSegmentsByTime.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getEventsWithDetectionsAndSegmentsByTime,
  idGenerator,
  shouldSkip,
  updateState,
  prepareRequestConfig,
  transformResult,
  validateResult,
  customQueryParams: state => [state.app.workflow.timeRange],
  customQueryFunc: fetchEventsWithDetectionsAndSegmentsByTime
};

export const {
  asyncQuery: getEventsWithDetectionsAndSegmentsByTime,
  addMatchReducers: addGetEventsWithDetectionsAndSegmentsByTimeMatchReducers
} = createAsyncThunkQuery<
  GetEventsWithDetectionsAndSegmentsByTimeQueryArgs,
  EventsWithDetectionsAndSegmentsFetchResults,
  DataState,
  [Nullable<CommonTypes.TimeRange>]
>(getEventsWithDetectionsAndSegmentsByTimeQuery);
