import flatMap from 'lodash/flatMap';
import max from 'lodash/max';
import min from 'lodash/min';

import { eventsKey, signalDetectionsKey } from '../constants';
import type { HistoryAction, HistoryState } from '../history-slice';
import { getPosition } from './get-undo-redo-position';

/** Calculates the event undo/redo position. */
const getEventPosition = (state: HistoryState, eventId: string, type: HistoryAction): number => {
  const histories = flatMap(
    [eventsKey, signalDetectionsKey].map(key => Object.values(state[key]))
  ).filter(h => h.stack.some(e => e?.associatedIds?.events[eventId] != null));

  if (state.events[eventId] != null) {
    histories.push(state.events[eventId]);
  }

  if (type === 'undo') {
    const eventPosition = max(
      histories.map(h => {
        const position = getPosition(state, h.stack, type);
        // check for undoable position and that it is related to the event
        if (position > -1 && h.stack[position].associatedIds?.events[eventId] != null) {
          return state.stack.findIndex(e => e.historyId === h.stack[position].historyId);
        }
        return -1;
      })
    );
    return eventPosition != null ? eventPosition : -1;
  }
  const eventPosition = min(
    histories.map(h => {
      const position = getPosition(state, h.stack, type);
      // check for redoable position and that it is related to the event
      if (position < h.stack.length && h.stack[position].associatedIds?.events[eventId] != null) {
        return state.stack.findIndex(e => e.historyId === h.stack[position].historyId);
      }
      return state.stack.length;
    })
  );
  return eventPosition != null ? eventPosition : 0;
};

/** returns the event undo position based on the current state for the provided event id */
export const getEventUndoPosition = (state: HistoryState, eventId: string): number =>
  getEventPosition(state, eventId, 'undo');

/** returns the event redo position based on the current state for the provided event id */
export const getEventRedoPosition = (state: HistoryState, eventId: string): number =>
  getEventPosition(state, eventId, 'redo');

/** returns the event undo/redo positions based on the current state for the provided event id */
export const getEventUndoRedoPositions = (
  state: HistoryState,
  eventId: string
): [number, number] => [getEventUndoPosition(state, eventId), getEventRedoPosition(state, eventId)];
