import { UILogger } from '@gms/ui-util';
import type { Action, AnyAction, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type {
  CreateListenerMiddlewareOptions,
  ListenerErrorHandler,
  ListenerErrorInfo
} from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import type { Patch } from 'immer';
import includes from 'lodash/includes';
import type { ThunkDispatch } from 'redux-thunk';

import type { AppState } from '../../store';
import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import {
  historyEventRedoAction,
  historyEventRedoByIdAction,
  historyEventUndoAction,
  historyEventUndoByIdAction,
  undoRedo
} from '../reducers';
import { findHistoriesByHistoryId } from '../utils/find-histories-by-history-id';
import { getEventRedoPosition, getEventUndoPosition } from '../utils/get-event-undo-redo-position';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

const INFO = 'Event Undo/Redo Middleware:' as const;

const onError: ListenerErrorHandler = (error: unknown, errorInfo: ListenerErrorInfo) => {
  logger.error(`${INFO} error occurred`, error, errorInfo);
};

const registeredActions = {
  historyEventUndoAction,
  historyEventUndoByIdAction,
  historyEventRedoAction,
  historyEventRedoByIdAction
} as const;

type EventUndoRedoListenerActions = ReturnType<
  (typeof registeredActions)[keyof typeof registeredActions]
>;

const eventUndoRedoListenerActions: string[] = Object.values(registeredActions).map(a => a.type);

type EventUndoRedoActions = typeof undoRedo.type;

type EventUndoRedoListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<EventUndoRedoActions>>,
  unknown
>;

const eventUndoRedoMiddlewareOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError,
  extra: {}
};

/**
 * Performs the event undo operation.
 *
 * @param action the action performed by the user for event undo
 * @param original the original state prior to executing the action
 * @param state the updated state after executing the action
 * @returns the inverse patches of the changes to be undone
 */
const performEventUndo = (
  action: ReturnType<typeof historyEventUndoAction | typeof historyEventUndoByIdAction>,
  original: AppState,
  state: AppState
): Patch[] => {
  logger.debug(`${INFO} event undo action`, action);
  const inversePatches: Patch[] = [];
  const { eventId } = action.payload;
  const originalPosition = getEventUndoPosition(original.history, eventId);
  const position = getEventUndoPosition(state.history, eventId);
  for (let i = originalPosition; i > position; i -= 1) {
    const originalHistoryItem = original.history.stack[i];
    const historyItem = state.history.stack[i];
    if (originalHistoryItem.status === 'applied' && historyItem.status === 'not applied') {
      inversePatches.push(...historyItem.inversePatches);
    }
    const originalHistories = findHistoriesByHistoryId(
      original.history,
      originalHistoryItem.historyId
    );
    const histories = findHistoriesByHistoryId(state.history, historyItem.historyId);
    originalHistories.forEach((h, index) => {
      if (
        h.historyItem.status === 'applied' &&
        histories[index].historyItem.status === 'not applied'
      ) {
        inversePatches.push(...h.historyItem.inversePatches);
      }
    });
  }
  return inversePatches;
};

/**
 * Performs the event redo operation.
 *
 * @param action the action performed by the user for event redo
 * @param original the original state prior to executing the action
 * @param state the updated state after executing the action
 * @returns the patches of the changes to be redone
 */
const performEventRedo = (
  action: ReturnType<typeof historyEventRedoAction | typeof historyEventRedoByIdAction>,
  original: AppState,
  state: AppState
): Patch[] => {
  logger.debug(`${INFO} event redo action`, action);
  const patches: Patch[] = [];
  const { eventId } = action.payload;
  const originalPosition = getEventRedoPosition(original.history, eventId);
  const position = getEventRedoPosition(state.history, eventId);
  for (let i = originalPosition; i < position; i += 1) {
    const originalHistoryItem = original.history.stack[i];
    const historyItem = state.history.stack[i];
    if (originalHistoryItem.status === 'not applied' && historyItem.status === 'applied') {
      patches.push(...historyItem.patches);
    }
    const originalHistories = findHistoriesByHistoryId(
      original.history,
      originalHistoryItem.historyId
    );
    const histories = findHistoriesByHistoryId(state.history, historyItem.historyId);
    originalHistories.forEach((h, index) => {
      if (
        h.historyItem.status === 'not applied' &&
        histories[index].historyItem.status === 'applied'
      ) {
        patches.push(...h.historyItem.patches);
      }
    });
  }
  return patches;
};

/**
 * Performs the event undo/redo operation.
 *
 * @param action the action performed by the user for event undo/redo
 * @param original the original state prior to executing the action
 * @param state the updated state after executing the action
 * @returns the patches of the undo/redo action
 */
const performEventUndoRedo = (
  action: EventUndoRedoListenerActions,
  original: AppState,
  state: AppState
): Patch[] => {
  let patches: Patch[];
  if (action.type === 'history/eventUndo' || action.type === 'history/eventUndoById') {
    patches = performEventUndo(action, original, state);
  } else if (action.type === 'history/eventRedo' || action.type === 'history/eventRedoById') {
    patches = performEventRedo(action, original, state);
  } else {
    const error = `${INFO} invalid action`;
    logger.error(`${error}`, action);
    throw new Error(`${error}`);
  }
  return patches;
};

/** the event undo/redo middleware - responsible undoing and redoing event changes */
export const eventUndoRedoMiddleware: EventUndoRedoListener = createListenerMiddleware(
  eventUndoRedoMiddlewareOptions
);
eventUndoRedoMiddleware.startListening({
  predicate: function eventUndoRedoMiddlewarePredicate(
    action: AnyAction
  ): action is EventUndoRedoListenerActions {
    if (includes(eventUndoRedoListenerActions, action.type)) {
      logger.debug(`${INFO} received action for event undo/redo`, action);
      return true;
    }
    return false;
  },
  effect: async function eventUndoRedoMiddlewareEffect(
    action: EventUndoRedoListenerActions,
    listenerApi
  ) {
    const original = listenerApi.getOriginalState();
    const state = listenerApi.getState();
    const task = listenerApi.fork(() => performEventUndoRedo(action, original, state));
    const result = await task.result;

    if (result.status === 'ok') {
      logger.debug(`${INFO} completed event undo/redo`, action);
      const patches = result.value;
      if (patches.length > 0) {
        // only send what changed for the dispatch; i.e. the patches
        listenerApi.dispatch(undoRedo(patches));
      }
    } else if (result.status === 'cancelled') {
      logger.debug(`${INFO} canceled event undo/redo`, action);
    } else {
      logger.error(`${INFO} rejected event undo/redo`, action, result.error);
    }
  }
});
