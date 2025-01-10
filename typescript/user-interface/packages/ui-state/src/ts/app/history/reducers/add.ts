import { UILogger } from '@gms/ui-util';
import type { CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import { eventsKey, maxHistory, signalDetectionsKey } from '../constants';
import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import type { History, HistoryChange, HistoryItem, HistoryState } from '../history-slice';
import { findHistoriesByHistoryId } from '../utils/find-histories-by-history-id';
import { getRedoPosition, getUndoRedoPositions } from '../utils/get-undo-redo-position';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

/** validates the add action */
export const validateAddAction = (state: HistoryState) => {
  const [undoPosition] = getUndoRedoPositions(state);

  if (undoPosition !== state.stack.length - 1) {
    const error = `Undo position is incorrect after add action`;
    logger.error(error, state);
    throw new Error(error);
  }

  if (undoPosition < 0) {
    const error = `Undo position is incorrect after add action, cannot be zero`;
    logger.error(error, state);
    throw new Error(error);
  }

  if (undoPosition > maxHistory) {
    const error = `Undo position is greater than max history size after add action`;
    logger.error(error, state, maxHistory);
    throw new Error(error);
  }
};

/** utility function to remove undone state (global and histories) */
const removeUndoneState = (state: WritableDraft<HistoryState>) => {
  let position = getRedoPosition(state);
  while (position < state.stack.length) {
    const { historyId } = state.stack[position];

    findHistoriesByHistoryId(state, historyId).forEach(
      (h: WritableDraft<{ historyItem: HistoryItem; history: History }>) => {
        h.history.stack = h.history.stack.filter(entry => entry.status === 'applied');
      }
    );

    if (
      state.stack[position].status === 'not applied' &&
      findHistoriesByHistoryId(state, historyId).length === 0
    ) {
      state.stack = state.stack.filter(entry => entry.historyId !== historyId);
    }
    position = getRedoPosition(state);
  }
};

/** cleans up the history state and removes all stale entries that exceed the maximum set history size */
const cleanupState = (state: WritableDraft<HistoryState>) => {
  // keep the stack size less than the maximum allowed history
  while (state.stack.length >= maxHistory) {
    logger.debug(`Cleaning up old action from undo/redo stack`);
    const lastEntry = state.stack[state.stack.length - 1];
    [eventsKey, signalDetectionsKey].forEach(dataKey => {
      Object.keys(state[dataKey]).forEach(k => {
        state[dataKey][k].stack = state[dataKey][k].stack.filter(
          historyItem => historyItem.historyId !== lastEntry.historyId
        );
      });
    });
    state.stack.shift();
  }
};

export const historyAddAction = createAction<HistoryChange, 'history/add'>('history/add');

export const historyAddReducer: CaseReducer<HistoryState, ReturnType<typeof historyAddAction>> = (
  state,
  action
) => {
  // remove dead history that had been undone
  removeUndoneState(state);

  state.stack.push(action.payload.history);

  [eventsKey, signalDetectionsKey].forEach(dataKey => {
    Object.keys(action.payload[dataKey]).forEach(k => {
      if (action.payload[dataKey][k] && action.payload[dataKey][k].status !== 'applied') {
        const error = `Undo/redo ${dataKey}/${k} should be marked as applied when adding`;
        logger.error(error, state);
        throw new Error(error);
      }

      if (state[dataKey][k]) {
        state[dataKey][k].stack.push(action.payload[dataKey][k]);
      } else {
        state[dataKey][k] = {
          stack: [action.payload[dataKey][k]]
        };
      }
    });
  });

  cleanupState(state);
  validateAddAction(state);
};
