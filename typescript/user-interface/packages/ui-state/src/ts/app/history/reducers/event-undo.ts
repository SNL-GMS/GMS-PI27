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
import { getEventUndoPosition } from '../utils/get-event-undo-redo-position';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

/** validates the payload for the action event undo */
export const validateEventUndoPayload = (
  action: PayloadAction<{ eventId: string; decrement: number }>
) => {
  if (action.payload == null) {
    const error = `Invalid event undo action, provided undefined action`;
    logger.error(error, action);
    throw new Error(error);
  }

  if (action.payload.eventId === '' || action.payload.eventId == null) {
    const error = `Invalid event undo action, provided undefined event id`;
    logger.error(error, action);
    throw new Error(error);
  }

  if (action?.payload.decrement == null || action.payload.decrement <= 0) {
    const error = `Invalid event undo action, provided decrement ${action.payload.decrement}`;
    logger.error(error, action);
    throw new Error(error);
  }
};

/** validates the event redo action */
export const validateEventUndoAction = (state: HistoryState, eventId: string) => {
  const position = getEventUndoPosition(state, eventId);
  if (position < -1) {
    const error = `Event undo/redo position is less than -1 after undo action`;
    logger.error(error, state);
    throw new Error(error);
  }

  if (position === state.stack.length - 1) {
    const error = `Event undo position indicates that everything is applied`;
    logger.error(error, state);
    throw new Error(error);
  }
};

/** The action for event undoing */
export const historyEventUndoAction = createAction<
  { eventId: string; decrement: number },
  'history/eventUndo'
>('history/eventUndo');

/** The action for event undoing by id */
export const historyEventUndoByIdAction = createAction<
  { eventId: string; id: string },
  'history/eventUndoById'
>('history/eventUndoById');

/**
 * Performs the event undo action for reverting an event snapshot.
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of containing the event id of the event
 * being undone and the number of histories to revert.
 */
export const historyEventUndoReducer: CaseReducer<
  HistoryState,
  ReturnType<typeof historyEventUndoAction>
> = (state, action) => {
  validateEventUndoPayload(action);
  const { eventId, decrement } = action.payload;
  let position = getEventUndoPosition(state, eventId);
  for (let i = 0; position >= 0 && i < decrement; i += 1) {
    const { historyId } = state.stack[position];
    findHistoriesByHistoryIdWithAssociation(
      state,
      state.stack[position].historyId,
      eventId
    ).forEach((entry: WritableDraft<{ historyItem: HistoryItem; history: History }>) => {
      entry.historyItem.status = 'not applied';
    });

    // update if everything is undone
    if (
      findHistoriesByHistoryId(state, historyId).every(h => h.historyItem.status === 'not applied')
    ) {
      state.stack[position].status = 'not applied';
    }
    position = getEventUndoPosition(state, eventId);
  }
  validateEventUndoAction(state, eventId);
};

/**
 * Performs the event undo action for reverting an event snapshot by id.
 *
 * @param state the current state of the slice
 * @param action the action being performed, with payload of containing the event id of the event
 * being undone and the id to undo too
 */
export const historyEventUndoByIdReducer: CaseReducer<
  HistoryState,
  ReturnType<typeof historyEventUndoByIdAction>
> = (state, action) => {
  const { id, eventId } = action.payload;
  const index = state.stack.findIndex(h => h.id === id);

  let position = getEventUndoPosition(state, eventId);
  let initialPosition = position;

  if (index === -1) {
    throw new Error(`Invalid id provided to event undo by id, ${id}`);
  }

  if (initialPosition < index) {
    throw new Error(`Unable to event undo by id, id is not applied`);
  }

  while (position >= index) {
    historyEventUndoReducer(state, {
      payload: { eventId, decrement: 1 },
      type: 'history/eventUndo'
    });
    position = getEventUndoPosition(state, eventId);
    if (initialPosition === position) {
      throw new Error(`Failed to event undo by id, ${initialPosition} ${position}`);
    }
    initialPosition = position;
  }
};
