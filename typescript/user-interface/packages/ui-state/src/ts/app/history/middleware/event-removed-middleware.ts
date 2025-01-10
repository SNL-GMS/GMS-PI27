import { UILogger } from '@gms/ui-util';
import type { Action, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type {
  CreateListenerMiddlewareOptions,
  ListenerErrorHandler,
  ListenerErrorInfo
} from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import includes from 'lodash/includes';
import intersection from 'lodash/intersection';
import without from 'lodash/without';
import { batch } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';

import { analystActions } from '../../state';
import type { AppState } from '../../store';
import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import { undoRedo } from '../reducers';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

const INFO = 'Event Removed Middleware:' as const;

const onError: ListenerErrorHandler = (error: unknown, errorInfo: ListenerErrorInfo) => {
  logger.error(`${INFO} error occurred`, error, errorInfo);
};

type EventRemovedActions =
  | typeof analystActions.setOpenEventId.type
  | typeof analystActions.setSelectedEventIds.type;

type EventRemovedListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<EventRemovedActions>>,
  unknown
>;

/** returns the event ids that were removed (no longer in the current state) */
const determineRemovedEvents = (original: AppState, state: AppState) => {
  return without(Object.keys(original.data.events), ...Object.keys(state.data.events));
};

const eventRemovedMiddlewareOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError,
  extra: {}
};

/** the event remove middleware - responsible updating state when events are removed (e.g. selections, open event) */
export const eventRemovedMiddleware: EventRemovedListener = createListenerMiddleware(
  eventRemovedMiddlewareOptions
);

eventRemovedMiddleware.startListening({
  type: undoRedo.type,
  effect: async function eventRemovedMiddlewareEffect(action, listenerApi) {
    const original = listenerApi.getOriginalState();
    const state = listenerApi.getState();

    const task = listenerApi.fork(() => determineRemovedEvents(original, state));
    const result = await task.result;

    if (result.status === 'ok') {
      logger.debug(`${INFO} completed`, action, result);
      const { value } = result;
      if (value.length > 0) {
        batch(() => {
          if (includes(value, state.app.analyst.openEventId)) {
            // removed events can no longer be marked as the opened event
            listenerApi.dispatch(analystActions.setOpenEventId(''));
          }
          if (intersection(value, state.app.analyst.selectedEventIds).length > 0) {
            // removed events can no longer be marked as selected
            listenerApi.dispatch(
              analystActions.setSelectedEventIds(
                state.app.analyst.selectedEventIds.filter(id => !includes(value, id))
              )
            );
          }
        });
      }
    } else if (result.status === 'cancelled') {
      logger.debug(`${INFO} canceled`, action, result);
    } else {
      logger.error(`${INFO} rejected`, action, result.error);
    }
  }
});
