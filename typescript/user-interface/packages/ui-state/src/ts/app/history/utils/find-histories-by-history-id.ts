import flatMap from 'lodash/flatMap';

import { eventsKey, signalDetectionsKey } from '../constants';
import type { History, HistoryItem, HistoryState } from '../history-slice';

/**
 * Returns the history items for the provided history id.
 *
 * @param state the current state
 * @param historyId the history id (commit or transaction id) to search the histories
 * @returns the histories associated to the provided history id
 */
export const findHistoriesByHistoryId = (
  state: HistoryState,
  historyId: string
): { historyItem: HistoryItem; history: History }[] => {
  const histories = flatMap(
    flatMap(
      [eventsKey, signalDetectionsKey].map(dataKey =>
        Object.keys(state[dataKey]).map(k =>
          state[dataKey][k].stack.map(historyItem => {
            if (historyItem.historyId === historyId) {
              return { historyItem, history: state[dataKey][k] };
            }
            return undefined;
          })
        )
      )
    )
  )
    .filter(entry => entry !== undefined && entry.historyItem.time)
    // sort the history items by time to ensure that they are in chronological order

    .sort((a, b) => (a?.historyItem.time as number) - (b?.historyItem.time as number));
  return histories.includes(undefined)
    ? []
    : (histories as { historyItem: HistoryItem; history: History }[]);
};

/**
 * Returns the associated history items.
 *
 * @param state the current state
 * @param historyId the history id (commit or transaction id) to search the histories
 * @param id the id to be associated too
 * @returns the histories associated to the provided history item
 */
export const findHistoriesByHistoryIdWithAssociation = (
  state: HistoryState,
  historyId: string,
  id: string
): { historyItem: HistoryItem; history: History }[] => {
  return findHistoriesByHistoryId(state, historyId).filter(
    entry =>
      entry.historyItem.associatedIds?.events[id] != null ||
      entry.historyItem.associatedIds?.signalDetections[id] != null
  );
};
