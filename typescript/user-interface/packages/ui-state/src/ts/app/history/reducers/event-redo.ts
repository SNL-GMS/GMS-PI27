import { UILogger } from '@gms/ui-util';
import type { CaseReducer, PayloadAction } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import type { History, HistoryItem, HistoryState } from '../history-slice';
import {
  findHistoriesByHistoryId,
  findHistoriesByHistoryIdWithAssociation
} from '../utils/find-histories-by-history-id';
import { getEventRedoPosition } from '../utils/get-event-undo-redo-position';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

/** validates the payload for the action event redo */
export const validateEventRedoPayload = (
  action: PayloadAction<{ eventId: string; increment: number }>
) => {
  if (action.payload == null) {
    const error = `Invalid event undo action, provided undefined action`;
    logger.error(error, action);
    throw new Error(error);
  }

  if (action.payload.eventId === '' || action.payload.eventId == null) {
    const error = `Invalid event redo action, provided undefined event id`;
    logger.error(error, action);
    throw new Error(error);
  }

  if (action?.payload.increment == null || action.payload.increment <= 0) {
    const error = `Invalid event undo action, provided increment ${action.payload.increment}`;
    logger.error(error, action);
    throw new Error(error);
  }
};

/** validates the event redo action */
export const validateEventRedoAction = (state: HistoryState, eventId: string) => {
  const position = getEventRedoPosition(state, eventId);
  if (position < 0) {
    const error = `Event redo position indicates that everything is unapplied`;
    logger.error(error, state);
    throw new Error(error);
  }

  if (position > state.stack.length) {
    const error = `Event redo stack position is greater than stack length after redo action`;
    logger.error(error, state);
    throw new Error(error);
  }
};

/** The action for event redoing */
export const historyEventRedoAction = createAction<
  { eventId: string; increment: number },
  'history/eventRedo'
>('history/eventRedo');

/** The action for event redoing by id */
export const historyEventRedoByIdAction = createAction<
  { eventId: string; id: string },
  'history/eventRedoById'
>('history/eventRedoById');

/**
 * Performs the event redo action for redoing an event snapshot.
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of containing the event id of the event
 * being redone and the number of histories to redo.
 */
export const historyEventRedoReducer: CaseReducer<
  HistoryState,
  ReturnType<typeof historyEventRedoAction>
> = (state, action) => {
  validateEventRedoPayload(action);
  const { eventId, increment } = action.payload;
  let position = getEventRedoPosition(state, eventId);
  for (let i = 0; position < state.stack.length && i < increment; i += 1) {
    const { historyId } = state.stack[position];
    findHistoriesByHistoryIdWithAssociation(
      state,
      state.stack[position].historyId,
      eventId
    ).forEach((entry: WritableDraft<{ historyItem: HistoryItem; history: History }>) => {
      entry.historyItem.status = 'applied';
    });

    // update if everything is undone
    if (findHistoriesByHistoryId(state, historyId).every(h => h.historyItem.status === 'applied')) {
      state.stack[position].status = 'applied';
    }
    position = getEventRedoPosition(state, eventId);
  }
  validateEventRedoAction(state, eventId);
};

/**
 * Performs the event redo action for redoing an event snapshot by id.
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of containing the event id of the event
 * being redone and the id to redo too
 */
export const historyEventRedoByIdReducer: CaseReducer<
  HistoryState,
  ReturnType<typeof historyEventRedoByIdAction>
> = (state, action) => {
  const { id, eventId } = action.payload;
  const index = state.stack.findIndex(h => h.id === id);

  let position = getEventRedoPosition(state, eventId);
  let initialPosition = position;

  if (index === -1) {
    throw new Error(`Invalid id provided to event redo by id, ${id}`);
  }

  if (initialPosition > index) {
    throw new Error(`Unable to event redo by id, id is not applied`);
  }

  while (position <= index) {
    historyEventRedoReducer(state, {
      payload: { eventId, increment: 1 },
      type: 'history/eventRedo'
    });
    position = getEventRedoPosition(state, eventId);
    if (initialPosition === position) {
      throw new Error(`Failed to event redo by id, ${initialPosition} ${position}`);
    }
    initialPosition = position;
  }
};
