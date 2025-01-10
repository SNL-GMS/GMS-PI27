import { UILogger } from '@gms/ui-util';
import type { CaseReducer, PayloadAction } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import type { History, HistoryItem, HistoryState } from '../history-slice';
import { findHistoriesByHistoryId } from '../utils/find-histories-by-history-id';
import { getRedoPosition } from '../utils/get-undo-redo-position';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

/** validates the payload for the action redo */
export const validateRedoPayload = (action: PayloadAction<number>) => {
  if (action?.payload == null || action.payload <= 0) {
    const error = `Invalid redo action, provided ${action.payload}`;
    logger.error(error, action);
    throw new Error(error);
  }
};

/** validates the redo action */
export const validateRedoAction = (state: HistoryState) => {
  const position = getRedoPosition(state);
  if (position < 0) {
    const error = `Redo position indicates that everything is unapplied`;
    logger.error(error, state);
    throw new Error(error);
  }

  if (position > state.stack.length) {
    const error = `Redo position is greater than stack length after redo action`;
    logger.error(error, state);
    throw new Error(error);
  }
};

/** The action for redoing */
export const historyRedoAction = createAction<number, 'history/redo'>('history/redo');

/** The action for redoing by id */
export const historyRedoByIdAction = createAction<string, 'history/redoById'>('history/redoById');

/**
 * Performs the redo action for redoing an action(s).
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of a single number;
 * the provided payload specifies how many actions to redo
 */
export const historyRedoReducer: CaseReducer<HistoryState, ReturnType<typeof historyRedoAction>> = (
  state,
  action
) => {
  validateRedoPayload(action);
  const increment = action.payload;
  let position = getRedoPosition(state);
  for (let i = 0; position < state.stack.length && i < increment; i += 1) {
    const history = state.stack[position];
    history.status = 'applied';
    findHistoriesByHistoryId(state, history.historyId).forEach(
      (h: WritableDraft<{ historyItem: HistoryItem; history: History }>) => {
        h.historyItem.status = 'applied';
      }
    );
    position += 1;
  }
  validateRedoAction(state);
};

/**
 * Performs the redo action for undoing an action(s) by id.
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of a single id;
 * the provided payload specifies the id to redo too
 */
export const historyRedoByIdReducer: CaseReducer<
  HistoryState,
  ReturnType<typeof historyRedoByIdAction>
> = (state, action) => {
  const id = action.payload;
  const index = state.stack.findIndex(h => h.id === id);

  let position = getRedoPosition(state);
  let initialPosition = position;

  if (index === -1) {
    throw new Error(`Invalid id provided to redo by id, ${id}`);
  }

  if (initialPosition > index) {
    throw new Error(`Unable to redo by id, id is not applied`);
  }

  while (position <= index) {
    historyRedoReducer(state, { payload: 1, type: 'history/redo' });
    position = getRedoPosition(state);
    if (initialPosition === position) {
      throw new Error(`Failed to redo by id, ${initialPosition} ${position}`);
    }
    initialPosition = position;
  }
};
