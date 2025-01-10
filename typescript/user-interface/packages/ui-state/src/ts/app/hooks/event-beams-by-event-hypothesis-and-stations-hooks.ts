import type { EventTypes, FacetedTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import React from 'react';

import type {
  FindEventBeamsByEventHypothesisAndStationsQueryArgs,
  UiChannelSegmentByEventHypothesisId
} from '../api';
import {
  findEventBeamsByEventHypothesisAndStations,
  findEventBeamsByEventHypothesisAndStationsQuery,
  selectEventBeams,
  selectEvents
} from '../api';
import { UIStateError } from '../error-handling/ui-state-error';
import type { AsyncFetchResult, FetchHistoryStatus } from '../query';
import { selectOpenIntervalName } from '../state';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useVisibleStations } from './station-definition-hooks';

/**
 * Defines async fetch result for the channel segments. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type FindEventBeamsByEventHypothesisAndStationsFetchResult =
  AsyncFetchResult<UiChannelSegmentByEventHypothesisId>;

/**
 * A hook that issues the requests for the find event beams by event
 * hypothesis and stations query.
 *
 * @param args the fetch event beams by event hypothesis and stations query args
 */
export const useFetchFindEventBeamsByEventHypothesisAndStationsQuery = (
  args: FindEventBeamsByEventHypothesisAndStationsQueryArgs
): void => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(findEventBeamsByEventHypothesisAndStations(args)).catch(error => {
      throw new UIStateError(error);
    });
  }, [dispatch, args]);
};

const useFindEventBeamsByEventHypothesisAndStationsHistory = (): FetchHistoryStatus => {
  const history = useAppSelector(
    state => state.data.queries.findEventBeamsByEventHypothesisAndStations
  );
  return useFetchHistoryStatus<FindEventBeamsByEventHypothesisAndStationsQueryArgs>(history);
};

/**
 * @returns the skipped result for the get channel segments by channels query
 */
const useFindEventBeamsByEventHypothesisAndStationsSkippedResult =
  (): FindEventBeamsByEventHypothesisAndStationsFetchResult => {
    const result = React.useRef({
      data: {},
      pending: 0,
      fulfilled: 0,
      rejected: 0,
      isLoading: false,
      isError: false
    });
    return result.current;
  };

/**
 * A hook that can be used to retrieve channel segments by channels.
 * Makes an individual async request for each channel.
 *
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the channel segments from all requests
 *
 * ! the returned results are filtered so that the results only match what the query args requested
 *
 * @param args the channel segments by channels query arguments
 *
 * @returns the channel segments fetch result.
 */
export const useFindEventBeamsByEventHypothesisAndStationsQuery = (
  args: FindEventBeamsByEventHypothesisAndStationsQueryArgs
): FindEventBeamsByEventHypothesisAndStationsFetchResult => {
  const history = useFindEventBeamsByEventHypothesisAndStationsHistory();

  // issue any new fetch requests
  useFetchFindEventBeamsByEventHypothesisAndStationsQuery(args);

  // retrieve all channel segments from the state
  const eventBeams = useAppSelector(selectEventBeams);
  const skippedReturnValue = useFindEventBeamsByEventHypothesisAndStationsSkippedResult();

  return React.useMemo(() => {
    if (findEventBeamsByEventHypothesisAndStationsQuery.shouldSkip(args)) {
      return skippedReturnValue;
    }
    return { ...history, data: eventBeams };
  }, [args, eventBeams, history, skippedReturnValue]);
};

// hook to get everything

export const useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent =
  (): FindEventBeamsByEventHypothesisAndStationsFetchResult => {
    const visibleStations = useVisibleStations();
    const events = useAppSelector(selectEvents);
    const openIntervalName = useAppSelector(selectOpenIntervalName);
    const args: FindEventBeamsByEventHypothesisAndStationsQueryArgs = React.useMemo(() => {
      const stations = visibleStations
        ? visibleStations.map(station => ({ name: station.name }))
        : [];
      const preferredHypotheses: FacetedTypes.EntityReference<'id', EventTypes.EventHypothesis>[] =
        [];
      Object.values(events).forEach(event => {
        const eventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
          event,
          openIntervalName
        );
        if (eventHypothesis?.id) {
          preferredHypotheses.push({ id: eventHypothesis.id });
        }
      });
      return { eventHypotheses: preferredHypotheses, stations };
    }, [events, openIntervalName, visibleStations]);

    return useFindEventBeamsByEventHypothesisAndStationsQuery(args);
  };
