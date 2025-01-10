import type { CommonTypes } from '@gms/common-model';
import { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import {
  findPreferredEventHypothesisByOpenStageOrDefaultStage,
  findPreferredLocationSolution
} from '@gms/common-model/lib/event';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { UILogger } from '@gms/ui-util';
import flatMap from 'lodash/flatMap';
import intersection from 'lodash/intersection';
import * as React from 'react';

import type {
  EventStatus,
  FindEventStatusInfoByStageIdAndEventIdsProps,
  FindEventStatusInfoByStageIdAndEventIdsQuery
} from '../api';
import {
  eventManagerApiSlice,
  selectEvents,
  selectOpenEventId,
  useUpdateEventStatusMutation
} from '../api';
import type { FindEventsByAssociatedSignalDetectionHypothesesArgs } from '../api/data/event/find-events-by-assoc-sd-hypotheses';
import { findEventsByAssociatedSignalDetectionHypotheses } from '../api/data/event/find-events-by-assoc-sd-hypotheses';
import { getEventsWithDetectionsAndSegmentsByTimeQuery } from '../api/data/event/get-events-detections-segments-by-time';
import type {
  FindEventsByAssociatedSignalDetectionHypothesesHistory,
  FindEventsByAssociatedSignalDetectionHypothesesQueryArgs,
  GetEventsWithDetectionsAndSegmentsByTimeQueryArgs
} from '../api/data/event/types';
import { UIStateError } from '../error-handling/ui-state-error';
import type { AsyncFetchResult, FetchHistoryStatus } from '../query';
import { useProduceAndHandleSkip } from '../query/util';
import { selectOpenIntervalName } from '../state';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useGetSignalDetections } from './signal-detection-hooks';
import { useViewableInterval } from './waveform-hooks';

const logger = UILogger.create('GMS_LOG_EVENT_MANAGER', process.env.GMS_LOG_EVENT_MANAGER);

export type EventsByAssociatedSignalDetectionHypothesesHistoryFetchResult =
  AsyncFetchResult<FindEventsByAssociatedSignalDetectionHypothesesHistory>;

/**
 * Defines async fetch result for the events. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type EventsFetchResult = AsyncFetchResult<EventTypes.Event[]>;

/**
 * A hook that can be used to return the current history of the events by time query.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the `getEventsWithDetectionsAndSegmentsByTime` queries
 *
 * @returns returns the current history of the events by time query.
 */
export const useGetEventsWithDetectionsAndSegmentsByTimeHistory = (): FetchHistoryStatus => {
  const history = useAppSelector(
    state => state.data.queries.getEventsWithDetectionsAndSegmentsByTime
  );
  return useFetchHistoryStatus<GetEventsWithDetectionsAndSegmentsByTimeQueryArgs>(history);
};

/**
 * @returns the skipped result for the get signal detections by stations query
 */
const useGetEventsWithDetectionsAndSegmentsByTimeSkippedResult = (): EventsFetchResult => {
  const result = React.useRef({
    data: [],
    pending: 0,
    fulfilled: 0,
    rejected: 0,
    isLoading: false,
    isError: false
  });
  return result.current;
};

/**
 * A hook that returns the fetch results for events by time.
 *
 *  This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the events from all requests
 *
 * ! the returned results are filtered so that the results only match what the query args requested
 *
 * @param args the query props data
 * @returns the events with segments and signal detections by time query. If skipped, the returned data will be set to `null`
 */
const useGetEventsByTime = (
  args: GetEventsWithDetectionsAndSegmentsByTimeQueryArgs | undefined
): EventsFetchResult => {
  const history = useGetEventsWithDetectionsAndSegmentsByTimeHistory();

  const signalDetectionsResult = useGetSignalDetections();

  const openIntervalName = useAppSelector(selectOpenIntervalName);

  // retrieve all events from the state
  const events = useAppSelector(selectEvents);

  const skippedReturnValue = useGetEventsWithDetectionsAndSegmentsByTimeSkippedResult();

  const shouldSkip = args ? getEventsWithDetectionsAndSegmentsByTimeQuery.shouldSkip(args) : true;

  const emptyArray = React.useRef<EventTypes.Event[]>([]);

  const data = React.useMemo(
    () => (shouldSkip ? emptyArray.current : Object.values(events)),
    [events, shouldSkip]
  );

  // filter the events based on the query args using the preferred hypothesis
  const filteredData = React.useMemo(() => {
    const sdhIds = flatMap(
      signalDetectionsResult.data?.map(sd => sd.signalDetectionHypotheses.map(sdh => sdh.id.id))
    );

    return data.filter(event => {
      const preferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
        event,
        openIntervalName
      );
      const locationSolution = preferredEventHypothesis?.id.hypothesisId
        ? findPreferredLocationSolution(
            preferredEventHypothesis.id.hypothesisId,
            event.eventHypotheses
          )
        : undefined;

      const time = locationSolution?.location?.time;
      // check that the event time falls between the start and end time or if we have a visible SD that with an association
      return (
        (time != null &&
          args?.startTime &&
          args?.endTime &&
          time >= args.startTime &&
          time <= args.endTime) ||
        intersection(
          preferredEventHypothesis?.associatedSignalDetectionHypotheses.map(sdh => sdh.id.id) || [],
          sdhIds
        ).length > 0
      );
    });
  }, [args?.endTime, args?.startTime, data, openIntervalName, signalDetectionsResult.data]);

  return React.useMemo(() => {
    if (args && getEventsWithDetectionsAndSegmentsByTimeQuery.shouldSkip(args)) {
      return skippedReturnValue;
    }
    return { ...history, data: filteredData };
  }, [args, history, filteredData, skippedReturnValue]);
};

/**
 * A hook that can be used to retrieve query arguments based on the current state.
 * Accounts for the current interval and visible stations.
 *
 * @param interval interval of time to use as the start and end time
 * @returns the events with detections and segments by time query args.
 */
export const useQueryArgsForGetEventsWithDetectionsAndSegmentsByTime = (
  interval: Nullable<CommonTypes.TimeRange>
): GetEventsWithDetectionsAndSegmentsByTimeQueryArgs | undefined => {
  const stageName = useAppSelector(state => state.app.workflow.openIntervalName);
  return React.useMemo(
    () =>
      interval.startTimeSecs != null && interval.endTimeSecs !== null
        ? {
            startTime: interval.startTimeSecs,
            endTime: interval.endTimeSecs,
            stageId: {
              name: stageName
            }
          }
        : undefined,
    [interval, stageName]
  );
};

const useQueryArgsForFindEventsByAssociatedSignalDetectionHypotheses = (
  interval: Nullable<CommonTypes.TimeRange>
): FindEventsByAssociatedSignalDetectionHypothesesArgs => {
  const openIntervalName = useAppSelector(state => state.app.workflow.openIntervalName);

  const args = useQueryArgsForGetEventsWithDetectionsAndSegmentsByTime(interval);
  const eventsByTime = useGetEventsByTime(args);

  const signalDetectionsResult = useGetSignalDetections();

  const emptyArray = React.useRef<EventTypes.Event[]>([]);

  const signalDetectionHypotheses = React.useMemo(() => {
    // !wait for the signal detections and events by time to be completed until querying for associated events
    const signalDetections =
      !signalDetectionsResult.isLoading && !eventsByTime.isLoading
        ? signalDetectionsResult.data || emptyArray.current
        : emptyArray.current;

    const hypotheses: Record<string, SignalDetectionTypes.SignalDetectionHypothesis> = {};
    signalDetections.forEach(signalDetection => {
      // Don't query for things with unsaved changes, the server will spit back bad request errors
      if (
        signalDetection._uiHasUnsavedChanges ||
        signalDetection._uiHasUnsavedEventSdhAssociation
      ) {
        return;
      }
      const hypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
        signalDetection.signalDetectionHypotheses
      );

      hypotheses[hypothesis.id.id] = hypothesis;
    });
    return Object.values(hypotheses);
  }, [eventsByTime.isLoading, signalDetectionsResult.data, signalDetectionsResult.isLoading]);

  return React.useMemo(
    () => ({
      signalDetectionHypotheses,
      stageId: { name: openIntervalName }
    }),
    [openIntervalName, signalDetectionHypotheses]
  );
};

const useFetchEventsByAssociatedSignalDetectionHypotheses = (
  args: FindEventsByAssociatedSignalDetectionHypothesesQueryArgs
): void => {
  const dispatch = useAppDispatch();
  //! useEffect updates redux state
  React.useEffect(() => {
    dispatch(findEventsByAssociatedSignalDetectionHypotheses(args)).catch(error => {
      throw new UIStateError(error);
    });
  }, [dispatch, args]);
};

/**
 * A hook that can be used to retrieve events for the current interval.
 * Also obtains edge events outside interval if they are associated to SDs within interval
 *
 * @returns the events results for the viewable interval.
 */
export const useGetEvents = (): EventsFetchResult => {
  const [viewableInterval] = useViewableInterval();

  const args = useQueryArgsForGetEventsWithDetectionsAndSegmentsByTime(viewableInterval);
  const eventsByTime = useGetEventsByTime(args);

  const eventsByAssociatedSignalDetectionHypothesesArgs =
    useQueryArgsForFindEventsByAssociatedSignalDetectionHypotheses(viewableInterval);
  useFetchEventsByAssociatedSignalDetectionHypotheses(
    eventsByAssociatedSignalDetectionHypothesesArgs
  );

  return eventsByTime;
};

/**
 * Wraps the hook from the event manager api slice to allow for reuse of
 * Returns the query result for the event status by stage and event ids query.
 *
 * The useEventStatusQuery hook wraps the RTK query hook
 * useFindEventStatusInfoByStageIdAndEventIdsQuery; to allow for reuse of
 * configuration, i.e. specifying when to skip the query.
 *
 * @returns the event status by stage and event ids. If skipped, the return will be null
 */
export const useEventStatusQuery = (): FindEventStatusInfoByStageIdAndEventIdsQuery => {
  const stageName = useAppSelector(state => state.app.workflow.openIntervalName);
  const eventResults = useGetEvents();
  const data: FindEventStatusInfoByStageIdAndEventIdsProps = React.useMemo(() => {
    return {
      stageId: { name: stageName },
      eventIds: eventResults?.data?.map(event => event.id) || []
    };
  }, [eventResults.data, stageName]);

  const skip =
    data.stageId?.name == null ||
    data.eventIds == null ||
    data.eventIds.length < 1 ||
    eventResults.pending > 0;

  return useProduceAndHandleSkip(
    eventManagerApiSlice.useFindEventStatusInfoByStageIdAndEventIdsQuery(data, { skip }),
    skip
  );
};

/**
 * @returns function that will create a new {@link EventStatus} according to the
 * structure for new events and new virtual events.
 */
export const useCreateNewEventStatus = () => {
  const [updateEventStatusMutation] = useUpdateEventStatusMutation();
  const stageName = useAppSelector(selectOpenIntervalName);

  return React.useCallback(
    async (eventId: string) => {
      const newEventStatus: EventStatus = {
        stageId: {
          name: stageName
        },
        eventId,
        eventStatusInfo: {
          eventStatus: EventTypes.EventStatus.NOT_COMPLETE,
          activeAnalystIds: []
        }
      };
      await updateEventStatusMutation(newEventStatus);
    },
    [stageName, updateEventStatusMutation]
  );
};

/**
 * @returns function that will update an existing {@link EventStatus} according to the
 * structure for rejected/deleted events.
 */
export const useRejectDeleteEventStatus = () => {
  const [updateEventStatusMutation] = useUpdateEventStatusMutation();
  const eventStatuses: Record<string, EventStatus> | undefined = useEventStatusQuery()?.data;
  const openEventId = useAppSelector(selectOpenEventId);

  return React.useCallback(
    (eventIds: string[]) => {
      eventIds.forEach(async id => {
        const eventStatus = eventStatuses ? eventStatuses[id] : undefined;
        if (!eventStatus) {
          logger.warn(`Could not locate/update EventStatus for event ${id}`);
          return;
        }

        // If the rejected/deleted event is open (IN_PROGRESS) do not change eventStatus
        if (
          id === openEventId &&
          eventStatus.eventStatusInfo.eventStatus === EventTypes.EventStatus.IN_PROGRESS
        )
          return;
        // Otherwise set to NOT_COMPLETE
        const updatedEventStatus: EventStatus = {
          ...eventStatus,
          eventStatusInfo: {
            ...eventStatus.eventStatusInfo,
            eventStatus: EventTypes.EventStatus.NOT_COMPLETE
          }
        };
        await updateEventStatusMutation(updatedEventStatus);
      });
    },
    [eventStatuses, openEventId, updateEventStatusMutation]
  );
};

/**
 * !Not complete, duplicate events are not yet sent to database
 *
 * @returns function that will create a new {@link EventStatus} according to the
 * structure for new, duplicated events.
 */
export const useDuplicateEventStatus = () => {
  // TODO: future work: update duplicated event status once duplicated events are in the DB
  // const [updateEventStatusMutation] = useUpdateEventStatusMutation();
  // const eventStatuses: Record<string, EventStatus> = useEventStatusQuery().data;
  const stageName = useAppSelector(selectOpenIntervalName);

  return React.useCallback(
    (eventIds: string[]) => {
      eventIds.forEach(id => {
        const newEventStatus: EventStatus = {
          stageId: {
            name: stageName
          },
          eventId: id,
          eventStatusInfo: {
            activeAnalystIds: [],
            eventStatus: EventTypes.EventStatus.NOT_COMPLETE
          }
        };
        logger.warn(
          `Duplicate event: should only publish EventStatus for Duplicated Events once they exist in the DB.`,
          newEventStatus
        );
      });
    },
    [stageName]
  );
};
