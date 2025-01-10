import { createSelector } from '@reduxjs/toolkit';

import { selectOpenEventId } from '../api/data/selectors';
import type { AppState } from '../store';
import type { HistoryMode, HistoryState } from './history-slice';
import { getEventRedoPosition, getEventUndoPosition } from './utils/get-event-undo-redo-position';
import { getRedoPosition, getUndoPosition } from './utils/get-undo-redo-position';

/**
 * @returns the undo/redo history state
 */
export const selectHistory = (state: AppState): HistoryState => state.history;

/**
 * @returns the undo/redo history state size
 */
export const selectHistorySize = (state: AppState): number => state.history.stack.length;

/**
 * @returns the history mode
 */
export const selectHistoryMode = (state: AppState): HistoryMode => state.history.mode;

/**
 * @returns returns the current global undo position
 */
export const selectUndoPosition: (state: AppState) => number = createSelector(
  [selectHistory],
  history => {
    return getUndoPosition(history);
  }
);

/**
 * @returns returns the current global redo position
 */
export const selectRedoPosition: (state: AppState) => number = createSelector(
  [selectHistory],
  history => {
    return getRedoPosition(history);
  }
);

/**
 * @returns returns the current global undo/redo positions
 */
export const selectUndoRedoPositions: (state: AppState) => [number, number] = createSelector(
  [selectUndoPosition, selectRedoPosition],
  (undoPosition, redoPosition) => {
    return [undoPosition, redoPosition];
  }
);

/**
 * @returns returns the current event undo position
 */
export const selectEventUndoPosition: (state: AppState) => number = createSelector(
  [selectHistory, selectOpenEventId, selectUndoPosition],
  (history, openEventId) => getEventUndoPosition(history, openEventId)
);

/**
 * @returns returns the current event redo position
 */
export const selectEventRedoPosition: (state: AppState) => number = createSelector(
  [selectHistory, selectOpenEventId],
  (history, openEventId) => getEventRedoPosition(history, openEventId)
);

/**
 * @returns returns the current event undo/redo positions
 */
export const selectEventUndoRedoPositions: (state: AppState) => [number, number] = createSelector(
  [selectEventUndoPosition, selectEventRedoPosition],
  (eventUndoPosition, eventRedoPosition) => {
    return [eventUndoPosition, eventRedoPosition];
  }
);
