import { UILogger } from '@gms/ui-util';
import type { Action, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware, unwrapResult } from '@reduxjs/toolkit';
import type { CreateListenerMiddlewareOptions } from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import type { ThunkDispatch } from 'redux-thunk';

import { UIStateError } from '../../error-handling/ui-state-error';
import { selectOpenIntervalName, waveformActions } from '../../state';
import { updateStationsVisibilityForSignalDetections } from '../../state/waveform/operations';
import { selectViewableInterval } from '../../state/waveform/selectors';
import type { AppState } from '../../store';
import {
  getEventsWithDetectionsAndSegmentsByTime,
  getEventsWithDetectionsAndSegmentsByTimeQuery
} from '../data/event/get-events-detections-segments-by-time';
import type { GetEventsWithDetectionsAndSegmentsByTimeQueryArgs } from '../data/event/types';
import { dataPopulationOnError, isIntervalOpen, isRejectedAction } from './util';

const logger = UILogger.create(
  'GMS_FETCH_EVENTS_DETECTIONS_BY_TIME_MIDDLEWARE',
  process.env.GMS_FETCH_EVENTS_DETECTIONS_BY_TIME_MIDDLEWARE
);

/** rejected actions to listen for to retry the middleware action */
const listenerRejectedActions: string[] = [
  `${getEventsWithDetectionsAndSegmentsByTime.typePrefix}/rejected`
];

/** actions to listen for to perform the middleware action */
const listenerActions: string[] = [
  waveformActions.setViewableInterval.type,
  ...listenerRejectedActions
];

type ActionType = typeof getEventsWithDetectionsAndSegmentsByTime;

type PopulateEventsWithDetectionsAndSegmentsByTimeListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<ActionType>>,
  unknown
>;

const populateEventsWithDetectionsAndSegmentsByTimeOptions: CreateListenerMiddlewareOptions<unknown> =
  {
    onError: dataPopulationOnError,
    extra: {}
  };

export const populateEventsWithDetectionsAndSegmentsByTimeMiddleware: PopulateEventsWithDetectionsAndSegmentsByTimeListener =
  createListenerMiddleware(populateEventsWithDetectionsAndSegmentsByTimeOptions);

populateEventsWithDetectionsAndSegmentsByTimeMiddleware.startListening({
  predicate: function populateEventsWithDetectionsAndSegmentsByTimePredicate(
    action: Action,
    currentState: AppState
  ): action is Action {
    return includes(listenerActions, action.type) && isIntervalOpen(currentState);
  },
  effect: function populateEventsWithDetectionsAndSegmentsByTimeEffect(
    action: Action,
    listenerApi
  ) {
    const state = listenerApi.getState();
    const openIntervalName = selectOpenIntervalName(state);
    const viewableInterval = selectViewableInterval(state);

    listenerApi.fork(() => {
      const args: GetEventsWithDetectionsAndSegmentsByTimeQueryArgs = {
        startTime: viewableInterval.startTimeSecs ?? 0,
        endTime: viewableInterval.endTimeSecs ?? 0,
        stageId: {
          name: openIntervalName
        }
      };

      // only fetch if the args are valid
      if (getEventsWithDetectionsAndSegmentsByTimeQuery.shouldSkip(args)) {
        return;
      }

      // if the previous request to {@link getEventsWithDetectionsAndSegmentsByTime} was rejected
      // and the args have changed then do not allow the retry of the request
      if (isRejectedAction(action, listenerRejectedActions) && !isEqual(args, action.meta.arg)) {
        return;
      }

      listenerApi
        .dispatch(getEventsWithDetectionsAndSegmentsByTime(args))
        .then(result => {
          if (result.payload) {
            const data = unwrapResult(result);
            if (data?.signalDetections) {
              listenerApi.dispatch(
                updateStationsVisibilityForSignalDetections(data.signalDetections)
              );
            }
          }
        })
        .catch(error => {
          logger.error(
            `Failed to fetch Events with Detections and Segments`,
            new UIStateError(error)
          );
        });
    });
  }
});
