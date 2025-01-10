import type { HistoryAction, HistoryItem, HistoryState, HistoryStatus } from '../history-slice';
import { findHistoriesByHistoryId } from './find-histories-by-history-id';

/** Calculates the undo/redo position for an stack. */
export const getPosition = (
  state: HistoryState,
  stack: HistoryItem[],
  type: HistoryAction,
  searchHistories = false
): number => {
  const status: HistoryStatus = type === 'undo' ? 'applied' : 'not applied';
  let position = type === 'undo' ? -1 : stack.length;
  if (stack) {
    const keys = [...Array(stack.length).keys()];
    if (type === 'undo') keys.reverse();
    keys.some(key => {
      if (stack[key].status === status) {
        position = key;
        return true;
      }
      if (searchHistories) {
        const histories = findHistoriesByHistoryId(state, stack[key].historyId);
        if (histories.some(h => h.historyItem.status === status)) {
          position = key;
          return true;
        }
      }
      return false;
    });
  }
  return position;
};

/** returns the undo position based on the current state. */
export const getUndoPosition = (state: HistoryState): number =>
  getPosition(state, state.stack, 'undo', true);

/** returns the redo position based on the current state. */
export const getRedoPosition = (state: HistoryState): number =>
  getPosition(state, state.stack, 'redo', true);

/** returns the undo/redo positions based on the current state. */
export const getUndoRedoPositions = (state: HistoryState): [number, number] => [
  getUndoPosition(state),
  getRedoPosition(state)
];
