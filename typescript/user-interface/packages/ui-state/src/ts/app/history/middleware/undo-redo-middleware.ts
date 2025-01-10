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
  historyRedoAction,
  historyRedoByIdAction,
  historyUndoAction,
  historyUndoByIdAction,
  undoRedo
} from '../reducers';
import { findHistoriesByHistoryId } from '../utils/find-histories-by-history-id';
import { getRedoPosition, getUndoPosition } from '../utils/get-undo-redo-position';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

const INFO = 'Undo/Redo Middleware:' as const;

const onError: ListenerErrorHandler = (error: unknown, errorInfo: ListenerErrorInfo) => {
  logger.error(`${INFO} error occurred`, error, errorInfo);
};

const registeredActions = {
  historyUndoAction,
  historyUndoByIdAction,
  historyRedoAction,
  historyRedoByIdAction
} as const;

type UndoRedoListenerActions = ReturnType<
  (typeof registeredActions)[keyof typeof registeredActions]
>;

const undoRedoListenerActions: string[] = Object.values(registeredActions).map(a => a.type);

type UndoRedoActions = typeof undoRedo.type;

type UndoRedoListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<UndoRedoActions>>,
  unknown
>;

const undoRedoMiddlewareOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError,
  extra: {}
};

/**
 * Performs the undo operation.
 *
 * @param action the action performed by the user for undo
 * @param original the original state prior to executing the action
 * @param state the updated state after executing the action
 * @returns the patches, the ids effected, and the status to update
 */
const performUndo = (
  action: ReturnType<typeof historyUndoAction | typeof historyUndoByIdAction>,
  original: AppState,
  state: AppState
): Patch[] => {
  logger.debug(`${INFO} undo action`, action);
  const inversePatches: Patch[] = [];
  const originalPosition = getUndoPosition(original.history);
  const position = getUndoPosition(state.history);
  for (let i = originalPosition; i > position; i -= 1) {
    const originalHistoryItem = original.history.stack[i];
    const historyItem = state.history.stack[i];
    if (originalHistoryItem.status === 'applied' && historyItem.status === 'not applied') {
      inversePatches.push(...originalHistoryItem.inversePatches);
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
 * Performs the redo operation.
 *
 * @param action the action performed by the user for redo
 * @param original the original state prior to executing the action
 * @param state the updated state after executing the action
 * @returns the patches, the ids effected, and the status to update
 */
const performRedo = (
  action: ReturnType<typeof historyRedoAction | typeof historyRedoByIdAction>,
  original: AppState,
  state: AppState
): Patch[] => {
  logger.debug(`${INFO} redo action`, action);
  const patches: Patch[] = [];
  const originalPosition = getRedoPosition(original.history);
  const position = getRedoPosition(state.history);
  for (let i = originalPosition; i < position; i += 1) {
    const originalHistoryItem = original.history.stack[i];
    const historyItem = state.history.stack[i];
    if (originalHistoryItem.status === 'not applied' && historyItem.status === 'applied') {
      patches.push(...originalHistoryItem.patches);
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
 * Performs the undo/redo operation.
 *
 * @param action the action performed by the user for undo/redo
 * @param original the original state prior to executing the action
 * @param state the updated state after executing the action
 * @returns the patches of the undo/redo action
 */
const performUndoRedo = (
  action: UndoRedoListenerActions,
  original: AppState,
  state: AppState
): Patch[] => {
  let patches: Patch[];
  if (action.type === 'history/undo' || action.type === 'history/undoById') {
    patches = performUndo(action, original, state);
  } else if (action.type === 'history/redo' || action.type === 'history/redoById') {
    patches = performRedo(action, original, state);
  } else {
    const error = `${INFO} invalid action`;
    logger.error(`${error}`, action);
    throw new Error(`${error}`);
  }
  return patches;
};

export const undoRedoMiddleware: UndoRedoListener =
  createListenerMiddleware(undoRedoMiddlewareOptions);
undoRedoMiddleware.startListening({
  predicate: function undoRedoMiddlewarePredicate(
    action: AnyAction
  ): action is UndoRedoListenerActions {
    if (includes(undoRedoListenerActions, action.type)) {
      logger.debug(`${INFO} received action for undo/redo`, action);
      return true;
    }
    return false;
  },
  effect: async function undoRedoMiddlewareEffect(action: UndoRedoListenerActions, listenerApi) {
    const original = listenerApi.getOriginalState();
    const state = listenerApi.getState();

    const task = listenerApi.fork(() => performUndoRedo(action, original, state));
    const result = await task.result;

    if (result.status === 'ok') {
      logger.debug(`${INFO} completed undo/redo`, action);
      const patches = result.value;
      if (patches.length > 0) {
        // only send what changed for the dispatch; i.e. the patches
        listenerApi.dispatch(undoRedo(patches));
      }
    } else if (result.status === 'cancelled') {
      logger.debug(`${INFO} canceled undo/redo`, action);
    } else {
      logger.error(`${INFO} rejected undo/redo`, action, result.error);
    }
  }
});
