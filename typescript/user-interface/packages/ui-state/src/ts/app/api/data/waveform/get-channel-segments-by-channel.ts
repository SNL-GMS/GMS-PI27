import type { CommonTypes, FacetedTypes, WaveformTypes } from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { determineExcludedRanges } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import flatMap from 'lodash/flatMap';

import type { UiChannelSegment } from '../../../../types';
import { fetchChannelSegmentsByChannel } from '../../../../workers';
import type { AppState, AsyncFetchHistoryEntry } from '../../..';
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
import type { AsyncFetchHistory } from '../../../query/types';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';
import { mutateUiChannelSegmentsRecord } from './mutate-channel-segment-record';

const logger = UILogger.create('GMS_LOG_FETCH_WAVEFORMS', process.env.GMS_LOG_FETCH_WAVEFORMS);

const MAX_CHANNELS_PER_REQUEST = 20;

/**
 * The interface required by the waveform manager service to make a channel segment query by channels.
 */
export interface GetChannelSegmentsByChannelQueryArgs {
  /**
   * In seconds. This will get converted into a UTC time string by the AxiosTransformers.
   */
  startTime: number | null;
  /**
   * In seconds. This will get converted into a UTC time string by the AxiosTransformers.
   */
  endTime: number | null;
  /**
   * The `channel-timerange` endpoint expects version references of the channels.
   */
  channels: VersionReference<'name'>[];
}

/**
 * Defines the history record type for the getChannelSegmentsByChannel query
 */
export type GetChannelSegmentsByChannelHistory =
  AsyncFetchHistory<GetChannelSegmentsByChannelQueryArgs>;

const idGenerator: IdGenerator<GetChannelSegmentsByChannelQueryArgs> = args => {
  const time = `startTime:${args.startTime}-endTime:${args.endTime}`;
  const channels = `channels:${uniqSortEntityOrVersionReference(args.channels)
    .map(channel => channel.name)
    .join(';')}`;
  return `${time}/${channels}`;
};

const shouldSkip: ShouldSkip<GetChannelSegmentsByChannelQueryArgs> = args =>
  args == null ||
  args.startTime == null ||
  args.endTime == null ||
  args.startTime === args.endTime ||
  args.channels == null ||
  args.channels.length === 0;

/**
 * Helper function to reduce code complexity
 *
 * @param entries
 * @param channel
 * @param args
 * @returns
 */
const obtainRanges = (
  entries: AsyncFetchHistoryEntry<GetChannelSegmentsByChannelQueryArgs>[],
  channel: FacetedTypes.VersionReference<
    'name',
    {
      name: string;
      effectiveAt: number;
    }
  >,
  args: GetChannelSegmentsByChannelQueryArgs
) => {
  return determineExcludedRanges(
    entries
      .filter(
        h =>
          h.arg.startTime != null &&
          h.arg.endTime != null &&
          h.arg.channels.findIndex(
            c => c.name === channel.name && c.effectiveAt === channel.effectiveAt
          ) !== -1
      )
      .map(v => ({
        start: v.arg.startTime as number,

        end: v.arg.endTime as number
      })),
    { start: args.startTime || 0, end: args.endTime || 0 }
  );
};

const transformArgs: TransformArgs<GetChannelSegmentsByChannelQueryArgs> = (
  args,
  history,
  id,
  entries
) => {
  let startTime = 0;
  let endTime = 0;
  const channels: FacetedTypes.VersionReference<'name'>[] = [];

  if (args.channels) {
    args.channels.forEach(channel => {
      const ranges = obtainRanges(entries, channel, args);

      if (ranges.length > 0) {
        const newStartTime = Math.min(...ranges.map(r => r.start));
        if (!startTime || newStartTime < startTime) {
          startTime = newStartTime;
        }

        const newEndTime = Math.max(...ranges.map(r => r.end));
        if (!startTime || newEndTime > endTime) {
          endTime = newEndTime;
        }
        channels.push(channel);
      }
    });
  }
  return { startTime, endTime, channels: uniqSortEntityOrVersionReference(channels) };
};

const prepareRequestConfig: PrepareRequestConfig<GetChannelSegmentsByChannelQueryArgs, AppState> = (
  args,
  requestConfig
) => {
  const { startTime, endTime } = args;
  const groups: FacetedTypes.VersionReference<'name'>[][] = [];
  let currentGroup: FacetedTypes.VersionReference<'name'>[] = [];
  uniqSortEntityOrVersionReference(args.channels).forEach(channel => {
    // if the current group is full or doesn't match the current channels station, push it and start a new group
    if (
      currentGroup.length === MAX_CHANNELS_PER_REQUEST ||
      (currentGroup[0] && channel.name.split('.')?.[0] !== currentGroup[0]?.name.split('.')?.[0])
    ) {
      groups.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(channel);
  });

  // push the final group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const requestConfigs = groups.map(channels => ({
    ...requestConfig,
    data: {
      startTime,
      endTime,
      channels
    }
  }));
  return requestConfigs;
};

const transformResult: TransformResult<
  GetChannelSegmentsByChannelQueryArgs,
  UiChannelSegment<WaveformTypes.Waveform>[]
> = (args, results) => {
  return flatMap(results.map(result => result ?? []));
};

const updateState: UpdateState<
  GetChannelSegmentsByChannelQueryArgs,
  UiChannelSegment<WaveformTypes.Waveform>[],
  DataState
> = (action, state) => {
  if (action.payload) {
    const { payload } = action;
    action.meta.arg.channels.forEach(channel => {
      const { name } = channel;
      const filteredUiChannelSegments = payload.filter(
        ucs => ucs?.channelSegmentDescriptor.channel.name === name
      );
      mutateUiChannelSegmentsRecord(state.uiChannelSegments, name, filteredUiChannelSegments);
    });
  }
};

export const getChannelSegmentsByChannelQuery: CreateAsyncThunkQueryProps<
  GetChannelSegmentsByChannelQueryArgs,
  UiChannelSegment<WaveformTypes.Waveform>[],
  DataState,
  [Nullable<CommonTypes.TimeRange>]
> = {
  typePrefix: 'channelSegment/getChannelSegmentsByChannel',
  config: config.waveform.services.getChannelSegment.requestConfig,
  logger,
  preCacheEnabled: process.env.GMS_DISABLE_PRE_CACHE_CHANNEL_SEGMENT_BY_CHANNEL !== 'true',
  getSliceState: state => state.data,
  getHistory: state => state.queries.getChannelSegmentsByChannel,
  idGenerator,
  shouldSkip,
  transformArgs,
  prepareRequestConfig,
  customQueryParams: state => [state.app.workflow.timeRange],
  customQueryFunc: async (
    requestConfig,
    timeRange
  ): Promise<UiChannelSegment<WaveformTypes.Waveform>[]> =>
    fetchChannelSegmentsByChannel(requestConfig, timeRange),
  transformResult,
  updateState
};

export const {
  asyncQuery: getChannelSegmentsByChannel,
  addMatchReducers: addGetChannelSegmentsByChannelMatchReducers,
  usePreCache: usePreCacheChannelSegmentsByChannel
} = createAsyncThunkQuery<
  GetChannelSegmentsByChannelQueryArgs,
  UiChannelSegment<WaveformTypes.Waveform>[],
  DataState,
  [Nullable<CommonTypes.TimeRange>]
>(getChannelSegmentsByChannelQuery);
