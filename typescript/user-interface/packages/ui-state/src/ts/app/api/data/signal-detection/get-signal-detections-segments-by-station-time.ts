import type {
  CommonTypes,
  FacetedTypes,
  SignalDetectionTypes,
  WorkflowTypes
} from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { determineExcludedRanges, IS_NODE_ENV_DEVELOPMENT, LogLevel } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import { isDraft, original } from 'immer';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';

import { fetchSignalDetectionsWithSegmentsByStationsAndTime } from '../../../../workers/api';
import type { SignalDetectionWithSegmentsFetchResults } from '../../../../workers/waveform-worker/operations/fetch-signal-detections-segments-by-stations-time';
import type { AsyncFetchHistory } from '../../../query';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  PrepareRequestConfig,
  QueryFunc,
  ShouldSkip,
  TransformResult,
  UpdateState,
  ValidateResult
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import type { AppState } from '../../../store';
import type { DataState } from '../types';
import { mutateUiChannelSegmentsRecord } from '../waveform/mutate-channel-segment-record';
import { config } from './endpoint-configuration';

const logger = UILogger.create(
  'GMS_LOG_FETCH_SIGNAL_DETECTION',
  // TODO: remove the default log level of error once the known issue of SD duplicates is resolved
  process.env.GMS_LOG_FETCH_SIGNAL_DETECTION || LogLevel.ERROR
);

/**
 * The interface required to make a signal detection query by stations.
 */
export interface GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs {
  /**
   * Entity references contain only the station name.
   */
  stations: FacetedTypes.EntityReference<'name'>[];

  /**
   * In seconds. This will get converted into a UTC time string by the AxiosTransformers.
   */
  startTime: number;

  /**
   * In seconds. This will get converted into a UTC time string by the AxiosTransformers.
   */
  endTime: number;

  /**
   * The stage for which to request signal detections by station.
   */
  stageId: WorkflowTypes.WorkflowDefinitionId;

  /**
   * A list of signal detections to exclude from the result (so a request
   * with the same times could return newer results, in the case of late-arriving
   * data for example).
   */
  excludedSignalDetections?: SignalDetectionTypes.SignalDetection[];
}

type GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult = Record<
  string /* station name */,
  SignalDetectionWithSegmentsFetchResults
>;

/**
 * Defines the history record type for the getSignalDetectionsWithSegmentsByStationAndTime query
 */
export type GetSignalDetectionsWithSegmentsByStationAndTimeHistory =
  AsyncFetchHistory<GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs>;

const idGenerator: IdGenerator<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs
> = args => {
  const stage = `stageId:${args.stageId.name}`;
  const time = `startTime:${args.startTime}-endTime:${args.endTime}`;
  const stations = `stations:${uniqSortEntityOrVersionReference(args.stations)
    .map(s => s.name)
    .join(';')}`;
  return `${stage}/${time}/${stations}`;
};

const shouldSkip: ShouldSkip<GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs> = args =>
  args == null ||
  args.stageId == null ||
  args.stageId.name == null ||
  args.startTime == null ||
  args.endTime == null ||
  args.startTime === args.endTime ||
  args.stations == null ||
  args.stations.length === 0;

const prepareRequestConfig: PrepareRequestConfig<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs,
  AppState
> = (args, requestConfig, history, id, entries) =>
  flatMap(
    args.stations.map(station => {
      const ranges = determineExcludedRanges(
        entries
          .filter(e =>
            includes(
              e.arg.stations.map(s => s.name),
              station.name
            )
          )
          .map(v => ({
            start: v.arg.startTime,
            end: v.arg.endTime
          })),
        { start: args.startTime, end: args.endTime }
      );

      return ranges.map(r => ({
        ...requestConfig,
        data: {
          stations: [station],
          stageId: args.stageId,
          startTime: r.start,
          endTime: r.end,
          excludedSignalDetections: args.excludedSignalDetections
        }
      }));
    })
  );

const customQueryFunc: QueryFunc<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs,
  [Nullable<CommonTypes.TimeRange>],
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult
> = async (
  requestConfig,
  timeRange
): Promise<GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult> => {
  if (!requestConfig.data) throw new Error('Request config missing data');
  if (requestConfig.data && requestConfig.data.stations.length !== 1) {
    throw new Error(
      `Expect the length of stations to be size 1 (chunked by station); see prepareRequestConfig`
    );
  }
  const { name } = requestConfig.data.stations[0];
  const result: GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult = {};
  result[name] = await fetchSignalDetectionsWithSegmentsByStationsAndTime(requestConfig, timeRange);
  return result;
};

const transformResult: TransformResult<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs,
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult
> = (args, results) => {
  const mergedResults: GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult = {};
  results.forEach(result => {
    if (result) {
      Object.keys(result).forEach(stationName => {
        mergedResults[stationName] = result[stationName];
      });
    }
  });
  return mergedResults;
};

const validateSignalDetectionForDuplicates = (
  state: AppState,
  signalDetection: SignalDetectionTypes.SignalDetection
) => {
  if (state.data.signalDetections[signalDetection.id] !== undefined) {
    const originalSd = isDraft(state.data.signalDetections[signalDetection.id])
      ? original<SignalDetectionTypes.SignalDetection>(
          state.data.signalDetections[signalDetection.id]
        )
      : state.data.signalDetections[signalDetection.id];
    if (!originalSd) {
      logger.warn('Original signal detection in duplicate check is undefined'); // This should never happen
    } else if (!isEqual(originalSd, signalDetection)) {
      logger.warn(
        `getSignalDetectionsWithSegmentsByStationAndTime - received duplicate sd that are different for id ${originalSd?.id}`,
        originalSd,
        signalDetection
      );
    } else {
      logger.warn(
        `getSignalDetectionsWithSegmentsByStationAndTime - received duplicate sd that are equal for id ${originalSd?.id}`
      );
    }
  }
};

const validateResult: ValidateResult<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs,
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult,
  AppState
> = (args, result, state) => {
  // validate the received signal detections; check for any duplicates and differences
  if (IS_NODE_ENV_DEVELOPMENT) {
    if (result) {
      Object.keys(result).forEach(stationName => {
        result[stationName].signalDetections.forEach(signalDetection => {
          validateSignalDetectionForDuplicates(state, signalDetection);
        });
      });
    }
  }
  return undefined;
};

const updateState: UpdateState<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs,
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult,
  DataState
> = (action, state) => {
  if (action.payload) {
    const { payload } = action;
    Object.keys(action.payload).forEach(stationName => {
      payload[stationName].signalDetections.forEach(sd => {
        state.signalDetections[sd.id] = sd;
      });

      mutateUiChannelSegmentsRecord(
        state.uiChannelSegments,
        stationName,
        payload[stationName].uiChannelSegments
      );
    });
  }
};

export const getSignalDetectionsWithSegmentsByStationAndTimeQuery: CreateAsyncThunkQueryProps<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs,
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult,
  DataState,
  [Nullable<CommonTypes.TimeRange>]
> = {
  typePrefix: 'signalDetection/getSignalDetectionsWithSegmentsByStationAndTime',
  config: config.signalDetection.services.getDetectionsWithSegmentsByStationsAndTime.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getSignalDetectionWithSegmentsByStationAndTime,
  idGenerator,
  shouldSkip,
  prepareRequestConfig,
  customQueryParams: state => [state.app.workflow.timeRange],
  customQueryFunc,
  transformResult,
  validateResult,
  updateState
};

export const {
  asyncQuery: getSignalDetectionsWithSegmentsByStationAndTime,
  addMatchReducers: addGetSignalDetectionsWithSegmentsByStationAndTimeMatchReducers
} = createAsyncThunkQuery<
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs,
  GetSignalDetectionsWithSegmentsByStationsAndTimeQueryResult,
  DataState,
  [Nullable<CommonTypes.TimeRange>]
>(getSignalDetectionsWithSegmentsByStationAndTimeQuery);
