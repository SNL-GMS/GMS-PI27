import { ChannelTypes } from '@gms/common-model';
import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import difference from 'lodash/difference';
import flatMap from 'lodash/flatMap';

import type { AppState, DataState } from '../../../../ui-state';
import { fetchChannelsByNamesTimeRange } from '../../../../workers/api/fetch-channels-by-names-timerange';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  ShouldSkip,
  TransformArgs,
  TransformResult,
  UpdateState,
  ValidateResult
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import { config } from './endpoint-configuration';
import type { GetChannelsByNamesTimeRangeQueryArgs } from './types';

const logger = UILogger.create(
  'GMS_LOG_FETCH_CHANNELS_BY_NAMES',
  process.env.GMS_LOG_FETCH_CHANNELS_BY_NAMES
);

const idGenerator: IdGenerator<GetChannelsByNamesTimeRangeQueryArgs> = args => {
  const time = `startTime:${args.startTime}-endTime:${args.endTime}`;
  const channelsNames = `channels:${uniqSortStrings(args.channelNames).join(';')}`;
  return `${time}/${channelsNames}`;
};

const shouldSkip: ShouldSkip<GetChannelsByNamesTimeRangeQueryArgs> = args =>
  args == null ||
  args.channelNames?.length <= 0 ||
  args.channelNames == null ||
  args.startTime == null ||
  args.endTime == null;

const transformArgs: TransformArgs<GetChannelsByNamesTimeRangeQueryArgs> = (
  args,
  history,
  id,
  entries
) => {
  const channelNames: string[] = [];
  const filteredEntries = entries.filter(
    e => e.arg.startTime === args.startTime && e.arg.endTime === args.endTime
  );
  args.channelNames.forEach(channelName => {
    if (filteredEntries.findIndex(e => e.arg.channelNames.includes(channelName)) === -1)
      channelNames.push(channelName);
  });
  return {
    ...args,
    channelNames
  };
};

const transformResult: TransformResult<
  GetChannelsByNamesTimeRangeQueryArgs,
  ChannelTypes.Channel[]
> = (args, results) => {
  return flatMap(results.map(result => result ?? []));
};

const validateResult: ValidateResult<
  GetChannelsByNamesTimeRangeQueryArgs,
  ChannelTypes.Channel[],
  AppState
> = (args, result) => {
  if (args.channelNames.length !== result?.length) {
    const diff = difference(args.channelNames, result ? result.map(val => val.name) : []);
    if (diff.length > 0) {
      // returning a result here will bypass the updateState (we want to keep partial results instead)
      logger.warn(`Failed to return requested fully-populated channels`, diff);
    }
  }
  // Return undefined so we don't bypass updateState
  return undefined;
};

const updateState: UpdateState<
  GetChannelsByNamesTimeRangeQueryArgs,
  ChannelTypes.Channel[],
  DataState
> = (action, state): void => {
  action.payload?.forEach(channel => {
    if (ChannelTypes.Util.isDerivedChannel(channel)) {
      state.channels.beamed[channel.name] = channel;
    } else {
      state.channels.raw[channel.name] = channel;
    }
  });
};

/**
 * Defines an async thunk query for the query to get channels by names and time range.
 */
export const getChannelsByNamesTimeRangeQuery: CreateAsyncThunkQueryProps<
  GetChannelsByNamesTimeRangeQueryArgs,
  ChannelTypes.Channel[],
  DataState
> = {
  typePrefix: 'channel/getChannelsByNamesTimeRange',
  config: config.stationDefinition.services.getChannelsByNamesTimeRange.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getChannelsByNamesTimeRange,
  idGenerator,
  shouldSkip,
  transformArgs,
  customQueryFunc: fetchChannelsByNamesTimeRange,
  transformResult,
  validateResult,
  updateState
};

/**
 * Provides an async thunk query and the and add reducers functions
 * for {@link getChannelsByNamesTimeRangeQuery}
 */
export const {
  asyncQuery: getChannelsByNamesTimeRange,
  addMatchReducers: addGetChannelsByNamesTimeRangeMatchReducers
} = createAsyncThunkQuery<GetChannelsByNamesTimeRangeQueryArgs, ChannelTypes.Channel[], DataState>(
  getChannelsByNamesTimeRangeQuery
);
