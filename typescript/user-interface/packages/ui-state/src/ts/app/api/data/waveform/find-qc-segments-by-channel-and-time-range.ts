import type { FacetedTypes } from '@gms/common-model';
import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type { WithRequired } from '@gms/common-model/lib/type-util/type-util';
import { chunkRanges, uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type { PriorityRequestConfig } from '@gms/ui-workers';
import { produce } from 'immer';
import flatMap from 'lodash/flatMap';

import type { AsyncFetchHistory } from '../../../query';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  PrepareRequestConfig,
  ShouldSkip,
  TransformArgs,
  TransformResult,
  UpdateState
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import type { AppState } from '../../../store';
import { getProcessingAnalystConfiguration } from '../../processing-configuration';
import { determineChannelsTimeRangeRequest } from '../deduplication-utils';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';
import { createRecipeToMutateQcSegmentsRecord } from './mutate-qc-segment-record';

const logger = UILogger.create('GMS_LOG_FETCH_QC_SEGMENTS', process.env.GMS_LOG_FETCH_QC_SEGMENTS);

const DEFAULT_MAX_TIME_REQUEST = 5400;

/**
 * The interface required to make a qc segment query
 */
export interface FindQCSegmentsByChannelAndTimeRangeQueryArgs {
  startTime: number;
  endTime: number;
  channels: FacetedTypes.VersionReference<'name'>[];
}

/**
 * Defines the history record type for the FindQCSegmentsByChannelAndTimeRange query
 */
export type FindQCSegmentsByChannelAndTimeRangeHistory =
  AsyncFetchHistory<FindQCSegmentsByChannelAndTimeRangeQueryArgs>;

const idGenerator: IdGenerator<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = args => {
  const time = `startTime:${args.startTime}-endTime:${args.endTime}`;
  const channels = `channels:${uniqSortStrings(args?.channels?.map(channel => channel.name)).join(
    ';'
  )}`;
  return `${time}/${channels}`;
};

const shouldSkip: ShouldSkip<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = (args): boolean =>
  !args ||
  args.startTime == null ||
  args.endTime == null ||
  args.channels == null ||
  args.channels.length === 0;

const transformArgs: TransformArgs<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = (
  args,
  history,
  id,
  entries
) => {
  return determineChannelsTimeRangeRequest<FindQCSegmentsByChannelAndTimeRangeQueryArgs>(
    args,
    entries
  );
};

const prepareRequestConfig: PrepareRequestConfig<
  FindQCSegmentsByChannelAndTimeRangeQueryArgs,
  AppState
> = (args, requestConfig, history, id, entries, store) => {
  const requests: WithRequired<
    PriorityRequestConfig<FindQCSegmentsByChannelAndTimeRangeQueryArgs>,
    'data'
  >[] = [];

  const processingAnalystConfiguration = getProcessingAnalystConfiguration(() => store);

  const maxTimeRangeRequestInSeconds =
    processingAnalystConfiguration?.endpointConfigurations?.fetchQcSegmentsByChannelsAndTime
      ?.maxTimeRangeRequestInSeconds || DEFAULT_MAX_TIME_REQUEST;

  // chunk up the data requests based on the `maxTimeRangeRequestInSeconds`
  if (args.startTime && args.endTime) {
    const chunkedRanges = chunkRanges(
      [{ start: args.startTime, end: args.endTime }],
      maxTimeRangeRequestInSeconds
    );

    chunkedRanges?.forEach(r => {
      requests.push({
        ...requestConfig,
        data: {
          channels: args.channels,
          startTime: r.start,
          endTime: r.end
        }
      });
    });
    return requests;
  }
  return [];
};

const transformResult: TransformResult<
  FindQCSegmentsByChannelAndTimeRangeQueryArgs,
  QcSegment[]
> = (args, results) => {
  return flatMap(results.map(result => result ?? []));
};

const updateState: UpdateState<
  FindQCSegmentsByChannelAndTimeRangeQueryArgs,
  QcSegment[],
  DataState
> = (action, state): void => {
  if (action.payload) {
    action.payload.forEach(qs => {
      state.qcSegments = produce(
        state.qcSegments,
        createRecipeToMutateQcSegmentsRecord(qs.channel.name, [qs])
      );
    });
  }
};

/**
 * Defines an async thunk query for the query to find {@link QcSegment}s by channel and time range.
 */
export const findQCSegmentsByChannelAndTimeRangeQuery: CreateAsyncThunkQueryProps<
  FindQCSegmentsByChannelAndTimeRangeQueryArgs,
  QcSegment[],
  DataState
> = {
  typePrefix: 'qcSegment/findQCSegmentsByChannelAndTimeRange',
  config: config.waveform.services.findQCSegmentsByChannelAndTimeRange.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.findQCSegmentsByChannelAndTimeRange,
  idGenerator,
  shouldSkip,
  transformArgs,
  prepareRequestConfig,
  transformResult,
  updateState
};

/**
 * Provides an async thunk query and the and add reducers functions
 * for {@link findQCSegmentsByChannelAndTimeRangeQuery}
 */
export const {
  asyncQuery: findQCSegmentsByChannelAndTimeRange,
  addMatchReducers: addFindQCSegmentsByChannelAndTimeRangeMatchReducers
} = createAsyncThunkQuery<FindQCSegmentsByChannelAndTimeRangeQueryArgs, QcSegment[], DataState>(
  findQCSegmentsByChannelAndTimeRangeQuery
);
