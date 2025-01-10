import type { EventTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import { axiosBaseQuery } from '@gms/ui-workers';
import type { MaybeDrafted } from '@reduxjs/toolkit/dist/query/core/buildThunks';
import type { MutationTrigger } from '@reduxjs/toolkit/dist/query/react/buildHooks';
import type { BaseQueryFn, MutationDefinition } from '@reduxjs/toolkit/query/react';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { UseQueryStateResult } from '../../query';
import { Subscription } from '../../subscription';
import { config } from './endpoint-configuration';

const logger = UILogger.create('GMS_EVENT_MANAGER_API', process.env.GMS_LOG_EVENTS);

const subscriberId = `find-event-status-info-by-stage-id-event-ids-${uuid.asString()}`;

export interface EventStatusResponse {
  eventStatusInfoMap: Record<string, EventTypes.EventStatusInfo>;
  stageId: { name: string };
}

export interface EventStatus {
  stageId: { name: string };
  eventId: string;
  eventStatusInfo: EventTypes.EventStatusInfo;
}

export interface FindEventStatusInfoByStageIdAndEventIdsProps {
  stageId: { name: string };
  eventIds: string[];
}

/**
 * Transforms response from the event status initial query to match the format of the subscription
 *
 * @param data the response from the event status base query
 * @returns
 */
export const eventStatusTransform = (data: EventStatusResponse): Record<string, EventStatus> => {
  // The initial query data is formatted differently then the subscription
  // So this rebuilds it into a Record of EventStatus to match what the subscription gets
  const newRecord: Record<string, EventStatus> = {};
  Object.entries(data.eventStatusInfoMap).forEach(params => {
    newRecord[params[0]] = {
      stageId: data.stageId,
      eventId: params[0],
      eventStatusInfo: params[1]
    };
  });
  return newRecord;
};

/**
 * Updates the events in the store.
 *
 * @param events the events to update or add
 * @returns a mutation function that is used with immer
 */
export const updateEventStatus =
  (eventStatus: EventStatus[]) =>
  (draft: MaybeDrafted<Record<string, EventStatus>>): void => {
    eventStatus.forEach(status => {
      // Update the dictionary with thew new data
      draft[status.eventId] = status;
    });
  };

/**
 * The event manager api reducer slice.
 */
export const eventManagerApiSlice = createApi({
  reducerPath: 'eventManagerApi',
  baseQuery: axiosBaseQuery({
    baseUrl: config.eventManager.baseUrl
  }),
  endpoints(build) {
    return {
      /**
       * defines query for events status
       */
      findEventStatusInfoByStageIdAndEventIds: build.query<
        Record<string, EventStatus>,
        FindEventStatusInfoByStageIdAndEventIdsProps
      >({
        query: (data: FindEventStatusInfoByStageIdAndEventIdsProps) => ({
          requestConfig: {
            ...config.eventManager.services.findEventStatusInfoByStageIdAndEventIds.requestConfig,
            data
          }
        }),
        transformResponse: eventStatusTransform,
        async onCacheEntryAdded(data, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
          // Callback from the subscription list of Events
          const onMessage: (eventStatus: EventStatus[]) => void = eventStatus => {
            if (!eventStatus) {
              return;
            }
            updateCachedData(updateEventStatus(eventStatus));
          };

          try {
            // wait for the initial query to resolve before proceeding
            await cacheDataLoaded;

            Subscription.addSubscriber(subscriberId, 'events', onMessage);
            logger.debug(`Events subscription subscribed ${subscriberId}`);

            // cacheEntryRemoved will resolve when the cache subscription is no longer active
            await cacheEntryRemoved;
          } catch (e) {
            Subscription.removeSubscriber(subscriberId, 'events');
            logger.error(`Failed to establish websocket connection ${subscriberId}`, e);
          }
        }
      }),

      /**
       * Defines the mutation for updating event status
       */
      updateEventStatus: build.mutation<void, EventStatus>({
        query: (data: EventStatus) => ({
          requestConfig: {
            ...config.eventManager.services.updateEventStatus.requestConfig,
            data
          }
        })
      })
    };
  }
});

export const { useUpdateEventStatusMutation } = eventManagerApiSlice;
export type UpdateEventMutation = ReturnType<
  typeof eventManagerApiSlice.useUpdateEventStatusMutation
>;

export type FindEventStatusInfoByStageIdAndEventIdsQuery = UseQueryStateResult<
  Record<string, EventStatus>
>;

export type UpdateEventStatusMutation = ReturnType<
  typeof eventManagerApiSlice.useUpdateEventStatusMutation
>;

export type UpdateEventStatusMutationFunc = MutationTrigger<
  MutationDefinition<EventStatus, BaseQueryFn, never, void, 'eventManagerApi'>
>;
