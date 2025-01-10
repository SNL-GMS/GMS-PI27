import { UILogger } from '@gms/ui-util';
import type { CaseReducer, PayloadAction } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import type { History, HistoryItem, HistoryState } from '../history-slice';
import { findHistoriesByHistoryId } from '../utils/find-histories-by-history-id';
import { getUndoPosition } from '../utils/get-undo-redo-position';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

/** validates the payload for the action undo */
export const validateUndoPayload = (action: PayloadAction<number>) => {
  if (action?.payload == null || action.payload <= 0) {
    const error = `Invalid undo action, provided ${action.payload}`;
    logger.error(error, action);
    throw new Error(error);
  }
};

/** validates the undo action */
export const validateUndoAction = (state: HistoryState) => {
  const position = getUndoPosition(state);

  if (position < -1) {
    const error = `Undo position is less than -1 after undo action`;
    logger.error(error, state);
    throw new Error(error);
  }

  if (position === state.stack.length - 1) {
    const error = `Undo position indicates that everything is applied`;
    logger.error(error, state);
    throw new Error(error);
  }
};

/** The action for undoing */
export const historyUndoAction = createAction<number, 'history/undo'>('history/undo');

/** The action for undoing by id */
export const historyUndoByIdAction = createAction<string, 'history/undoById'>('history/undoById');

/**
 * Performs the undo action for undoing an action(s).
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of a single number;
 * the provided payload specifies how many actions to undo
 */
export const historyUndoReducer: CaseReducer<HistoryState, ReturnType<typeof historyUndoAction>> = (
  state,
  action
) => {
  validateUndoPayload(action);
  const decrement = action.payload;
  let position = getUndoPosition(state);
  for (let i = 0; position >= 0 && i < decrement; i += 1) {
    const history = state.stack[position];
    history.status = 'not applied';
    findHistoriesByHistoryId(state, history.historyId).forEach(
      (h: WritableDraft<{ historyItem: HistoryItem; history: History }>) => {
        h.historyItem.status = 'not applied';
      }
    );
    position -= 1;
  }
  validateUndoAction(state);
};

/**
 * Performs the undo action for undoing an action(s) by id.
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of a single id;
 * the provided payload specifies the id to undo too
 */
export const historyUndoByIdReducer: CaseReducer<
  HistoryState,
  ReturnType<typeof historyUndoByIdAction>
> = (state, action) => {
  const id = action.payload;
  const index = state.stack.findIndex(h => h.id === id);

  let position = getUndoPosition(state);
  let initialPosition = position;

  if (index === -1) {
    throw new Error(`Invalid id provided to undo by id, ${id}`);
  }

  if (initialPosition < index) {
    throw new Error(`Unable to undo by id, id is not applied`);
  }

  while (position >= index) {
    historyUndoReducer(state, { payload: 1, type: 'history/undo' });
    position = getUndoPosition(state);
    if (initialPosition === position) {
      throw new Error(`Failed to undo by id, ${initialPosition} ${position}`);
    }
    initialPosition = position;
  }
};
