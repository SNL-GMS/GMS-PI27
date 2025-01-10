import type {
  CommonTypes,
  EventTypes,
  FacetedTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';
import { ChannelSegmentTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import includes from 'lodash/includes';

import type { UiChannelSegment } from '../../../../types';
import { fetchEventBeamsByEventHypothesisAndStations } from '../../../../workers/api';
import type { AsyncFetchHistory } from '../../../query';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  ShouldSkip,
  TransformArgs,
  UpdateState
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import { determineMissingPairs } from '../deduplication-utils';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';

const logger = UILogger.create(
  'GMS_LOG_EVENT_BEAMS_BY_HYPOTHESIS_AND_STATIONS',
  process.env.GMS_LOG_EVENT_BEAMS_BY_HYPOTHESIS_AND_STATIONS
);

/**
 * The interface required to make an event beams by hypothesis and stations query
 */
export interface FindEventBeamsByEventHypothesisAndStationsQueryArgs {
  stations: FacetedTypes.EntityReference<'name', StationTypes.Station>[];
  eventHypotheses: FacetedTypes.EntityReference<'id', EventTypes.EventHypothesis>[];
}

/**
 * Defines the history record type for the FindEventBeamsByEventHypothesisAndStations query
 */
export type FindEventBeamsByEventHypothesisAndStationsHistory =
  AsyncFetchHistory<FindEventBeamsByEventHypothesisAndStationsQueryArgs>;

export interface EventBeamsByEventHypothesisAndStations {
  eventHypothesisChannelSegmentsPairs: {
    eventHypothesis: FacetedTypes.EntityReference<'id', EventTypes.EventHypothesis>;
    channelSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[];
  }[];
}

export type UiChannelSegmentByEventHypothesisId = Record<
  string,
  UiChannelSegment<WaveformTypes.Waveform>[]
>;

const idGenerator: IdGenerator<FindEventBeamsByEventHypothesisAndStationsQueryArgs> = args => {
  const stations = `stations:${uniqSortStrings(args?.stations?.map(station => station.name)).join(
    ';'
  )}`;
  const eventHypothesisIds = `eventHypothesisIds:${uniqSortStrings(
    args?.eventHypotheses?.map(eventHypothesis => eventHypothesis.id.hypothesisId)
  ).join(';')}`;
  return `${eventHypothesisIds}/${stations}`;
};

const shouldSkip: ShouldSkip<FindEventBeamsByEventHypothesisAndStationsQueryArgs> = args =>
  args == null ||
  args.stations == null ||
  args.eventHypotheses == null ||
  args.stations.length === 0 ||
  args.eventHypotheses.length === 0;

const transformArgs: TransformArgs<FindEventBeamsByEventHypothesisAndStationsQueryArgs> = (
  args,
  history,
  id,
  entries
) => {
  const argsWithIds = {
    stations: args.stations,
    eventHypotheses: args.eventHypotheses.map(eventHypothesis => eventHypothesis.id.hypothesisId)
  };

  const entriesWithIds = entries.map(entry => ({
    ...entry,
    arg: {
      stations: entry.arg.stations,
      eventHypotheses: entry.arg.eventHypotheses.map(
        eventHypothesis => eventHypothesis.id.hypothesisId
      )
    }
  }));

  const [stations, eventHypotheses] = determineMissingPairs<
    {
      stations: FacetedTypes.EntityReference<'name', StationTypes.Station>[];
      eventHypotheses: string[];
    },
    FacetedTypes.EntityReference<'name', StationTypes.Station>
  >(argsWithIds, entriesWithIds, 'stations', 'eventHypotheses');

  return {
    stations,
    eventHypotheses: args.eventHypotheses.filter(eventHypothesis =>
      includes(eventHypotheses, eventHypothesis.id.hypothesisId)
    )
  };
};

const updateState: UpdateState<
  FindEventBeamsByEventHypothesisAndStationsQueryArgs,
  UiChannelSegmentByEventHypothesisId,
  DataState
> = (action, state) => {
  logger.debug(`updateState event-beams`, action.payload);
  if (action.payload) {
    const { payload } = action;
    Object.keys(payload).forEach(eventHypothesisId => {
      if (!state.eventBeams[eventHypothesisId]) {
        state.eventBeams[eventHypothesisId] = [];
      }
      const existing = state.eventBeams[eventHypothesisId].map(existingChannelSegment =>
        ChannelSegmentTypes.Util.createChannelSegmentString(
          existingChannelSegment.channelSegmentDescriptor
        )
      );
      payload[eventHypothesisId].forEach(channelSegment => {
        const id = ChannelSegmentTypes.Util.createChannelSegmentString(
          channelSegment.channelSegmentDescriptor
        );
        // only add if the channel segment does not already exist
        if (!includes(existing, id)) {
          state.eventBeams[eventHypothesisId].push(channelSegment);
          existing.push(id);
        }
      });
    });
  }
};

export const findEventBeamsByEventHypothesisAndStationsQuery: CreateAsyncThunkQueryProps<
  FindEventBeamsByEventHypothesisAndStationsQueryArgs,
  UiChannelSegmentByEventHypothesisId,
  DataState,
  [Nullable<CommonTypes.TimeRange>]
> = {
  typePrefix: 'waveform/findEventBeamsByEventHypothesisAndStations',
  config: config.waveform.services.findEventBeamsByEventHypothesisAndStations.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.findEventBeamsByEventHypothesisAndStations,
  idGenerator,
  shouldSkip,
  transformArgs,
  customQueryParams: state => [state.app.workflow.timeRange],
  customQueryFunc: async (requestConfig, timeRange): Promise<UiChannelSegmentByEventHypothesisId> =>
    fetchEventBeamsByEventHypothesisAndStations(requestConfig, timeRange),
  updateState
};

export const {
  asyncQuery: findEventBeamsByEventHypothesisAndStations,
  addMatchReducers: addEventBeamsByEventHypothesisAndStationsMatchReducers
} = createAsyncThunkQuery<
  FindEventBeamsByEventHypothesisAndStationsQueryArgs,
  UiChannelSegmentByEventHypothesisId,
  DataState,
  [Nullable<CommonTypes.TimeRange>]
>(findEventBeamsByEventHypothesisAndStationsQuery);
