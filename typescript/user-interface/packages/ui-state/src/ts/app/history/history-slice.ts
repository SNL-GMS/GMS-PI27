import type { SignalDetectionTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Patch } from 'immer/dist/internal';

import type { EventId } from '../../types';
import type { DataState } from '../api/data';
import { ENV_GMS_HISTORY, GMS_HISTORY } from './history-environment';
import type { HistoryListenerActionsTypes } from './middleware/history-middleware';
import { historyAddAction, historyAddReducer } from './reducers/add';
import {
  historyEventRedoAction,
  historyEventRedoByIdAction,
  historyEventRedoByIdReducer,
  historyEventRedoReducer
} from './reducers/event-redo';
import {
  historyEventUndoAction,
  historyEventUndoByIdAction,
  historyEventUndoByIdReducer,
  historyEventUndoReducer
} from './reducers/event-undo';
import {
  historyRedoAction,
  historyRedoByIdAction,
  historyRedoByIdReducer,
  historyRedoReducer
} from './reducers/redo';
import {
  historyUndoAction,
  historyUndoByIdAction,
  historyUndoByIdReducer,
  historyUndoReducer
} from './reducers/undo';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

export type HistoryAction = 'undo' | 'redo';

/** the history mode; can be `global` or `event` */
export type HistoryMode = 'global' | 'event';

/** the history status; can be `applied` or `not applied` */
export type HistoryStatus = 'applied' | 'not applied';

/** the history conflict status; can be `created conflict` or `resolved conflict` or `none` */
export type HistoryConflictStatus = 'created conflict' | 'resolved conflict' | 'none';

/** the event and signal detection data state */
export type EventAndSignalDetectionKeys = keyof Pick<DataState, 'events' | 'signalDetections'>;

/** Provides the patches and inverse patches of a change */
interface Patches {
  /** the patches that can be used to redo the change */
  readonly patches: Patch[];
  /** the patches that can be used to undo the change */
  readonly inversePatches: Patch[];
}
/** represents a boolean that indicates applied or not */
export type Applied = boolean;

/** a record that is used to track associated signal detection ids or event ids */
export type AssociatedIdsRecord = Record<
  EventAndSignalDetectionKeys,
  Record<EventId | SignalDetectionTypes.SignalDetectionIdString, Applied>
>;

/** defines a history entry (or item); manages all of the necessary data for being able to undo/redo changes */
export interface HistoryItem extends Patches {
  /** the unique id of the history item */
  readonly id: string;
  /** the unique id for the entire history entry caused by a single action */
  readonly historyId: string;
  /** the action type */
  readonly type: HistoryListenerActionsTypes;
  /** the time in epoch seconds that the action was recorded */
  readonly time: number;
  /** the label for the history item */
  readonly label: string;
  /** the detailed description of the history item */
  readonly description: string;
  /** the status of the history item; `applied` or `not applied` */
  readonly status: HistoryStatus;
  /** the associated ids for the history item */
  readonly associatedIds?: AssociatedIdsRecord;
  /** indicates whether an action created or resolved a conflict */
  readonly conflictStatus: HistoryConflictStatus;
  /** indicates whether an action was a deletion of an object */
  readonly isDeletion: boolean;
  /** indicates whether an action was a rejection of an object */
  readonly isRejection: boolean;
}

export interface History<T extends HistoryItem = HistoryItem> {
  /** the history items stack (contains all of the changes) */
  readonly stack: T[];
}

/** defines the history state; used for tracking all undoable/redoable changes */
export interface HistoryState {
  /** indicates the history mode: global or event */
  readonly mode: HistoryMode;
  /** the global history stack */
  readonly stack: HistoryItem[];
  /** the signal detections history by event id */
  readonly events: Record<EventId, History>;
  /** the signal detections history by signal detection id */
  readonly signalDetections: Record<SignalDetectionTypes.SignalDetectionIdString, History>;
}

/** defines a history change that was caused by an action */
export interface HistoryChange {
  /** the global history item for the change */
  readonly history: HistoryItem;
  /** the individual event history items for the change */
  readonly events: Record<EventId, HistoryItem>;
  /** the individual signal detection history items for the change */
  readonly signalDetections: Record<SignalDetectionTypes.SignalDetectionIdString, HistoryItem>;
}

/** the initial history state; empty */
export const historyInitialState: HistoryState = {
  mode: 'global',
  stack: [],
  events: {},
  signalDetections: {}
};

/**
 * Defines the history state slice for managing the undo/redo stack and actions.
 */
export const historySlice = createSlice({
  name: 'history',
  initialState: historyInitialState,
  reducers: {
    /** toggle the history mode */
    setHistoryMode(state, action?: PayloadAction<HistoryMode>) {
      if (action) {
        state.mode = action.payload;
      } else {
        // toggle the mode
        state.mode = state.mode === 'global' ? 'event' : 'global';
      }
    },

    /**
     * Clears and resets the undo/redo stack and all of the history.
     * !Wipes out all history!
     *
     * @param state the current state of the slice
     */
    clear(state) {
      logger.debug(`Clearing all of the history (undo/redo)`);
      Object.keys(state).forEach(key => {
        state[key] = historyInitialState[key];
      });
    }
  },

  // add any extra reducers at the data slice level
  extraReducers: builder => {
    builder.addCase(historyAddAction, historyAddReducer);
    builder.addCase(historyUndoAction, historyUndoReducer);
    builder.addCase(historyUndoByIdAction, historyUndoByIdReducer);
    builder.addCase(historyRedoAction, historyRedoReducer);
    builder.addCase(historyRedoByIdAction, historyRedoByIdReducer);
    builder.addCase(historyEventUndoAction, historyEventUndoReducer);
    builder.addCase(historyEventUndoByIdAction, historyEventUndoByIdReducer);
    builder.addCase(historyEventRedoAction, historyEventRedoReducer);
    builder.addCase(historyEventRedoByIdAction, historyEventRedoByIdReducer);
  }
});

export const historyActions = historySlice.actions;
