import { notEmpty } from '@gms/common-model/lib/array-util';
import type { Event } from '@gms/common-model/lib/event';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { epochSecondsNow, uuid4 } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type { Action, AnyAction, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type {
  CreateListenerMiddlewareOptions,
  ListenerErrorHandler,
  ListenerErrorInfo,
  TaskResolved,
  TaskResult
} from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import type { Patch } from 'immer';
import { produceWithPatches } from 'immer';
import type { Immutable } from 'immer/dist/internal';
import difference from 'lodash/difference';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import type { ThunkDispatch } from 'redux-thunk';

import { associateSignalDetectionsToEvent } from '../../api/data/event/associate-sds-to-event';
import { createEventFromSignalDetections } from '../../api/data/event/create-event-from-sds';
import { createVirtualEvent } from '../../api/data/event/create-virtual-event';
import { deleteEvents } from '../../api/data/event/delete-events';
import { duplicateEvents } from '../../api/data/event/duplicate-events';
import { findAllAssociationEventConflicts } from '../../api/data/event/event-conflict-middleware';
import { rejectEvents } from '../../api/data/event/reject-events';
import { unassociateSignalDetectionsToEvent } from '../../api/data/event/unassociate-sds-to-event';
import { acceptFk } from '../../api/data/signal-detection/accept-fk-reducer';
import {
  createSignalDetection,
  createSignalDetectionAndAssociate,
  deleteSignalDetection,
  updateArrivalTimeSignalDetection,
  updatePhaseSignalDetection
} from '../../api/data/signal-detection/update-signal-detection-reducers';
import { addEventBeamsAndChannels } from '../../api/data/waveform';
import type { AppDispatch, AppState } from '../../store';
import {
  additionalEventAndSignalDetectionDataKeys,
  eventsKey,
  signalDetectionsKey
} from '../constants';
import { ENV_GMS_HISTORY, GMS_HISTORY, IS_HISTORY_DEBUG } from '../history-environment';
import type {
  AssociatedIdsRecord,
  EventAndSignalDetectionKeys,
  HistoryChange,
  HistoryConflictStatus,
  HistoryItem,
  HistoryStatus
} from '../history-slice';
import { historyAddAction } from '../reducers/add';
import type { HistoryLabelDescription } from '../utils/get-history-label-description';
import { getHistoryLabelDescriptions } from '../utils/get-history-label-description';
import { combineKeys } from '../utils/update-replace-values';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

const INFO = 'History Middleware:' as const;

const onError: ListenerErrorHandler = (error: unknown, errorInfo: ListenerErrorInfo) => {
  logger.error(`${INFO} error occurred`, error, errorInfo);
};

/** defines the event registered actions that will be used for capturing undoable changes  */
const registeredEventActions = {
  // Event related actions
  associateSignalDetectionsToEvent,
  unassociateSignalDetectionsToEvent,
  duplicateEvents,
  createEventFromSignalDetections,
  createVirtualEvent,
  rejectEvents,
  deleteEvents,
  addEventBeamsAndChannels
} as const;

/** defines the signal detection registered actions that will be used for capturing undoable changes  */
const registeredSignalDetectionActions = {
  // Signal Detection related actions
  updateArrivalTimeSignalDetection,
  updatePhaseSignalDetection,
  rejectSignalDetection: deleteSignalDetection,
  createSignalDetection,
  createSignalDetectionAndAssociate,
  acceptFk
} as const;

/** defines the registered event and signal detection actions that will be used for capturing undoable changes  */
const registeredEventAndSignalDetectionActions = {
  // Event related actions
  ...registeredEventActions,
  // Signal Detection related actions
  ...registeredSignalDetectionActions
} as const;

/** defines the registered actions that will be used for capturing undoable changes  */
const registeredActions = {
  // Event and Signal Detection related actions
  ...registeredEventAndSignalDetectionActions
  // Additional registered actions
} as const;

type HistoryListenerSignalDetectionActions = ReturnType<
  (typeof registeredActions)[keyof typeof registeredSignalDetectionActions]
>;

type HistoryListenerEventActions = ReturnType<
  (typeof registeredActions)[keyof typeof registeredEventActions]
>;

type HistoryListenerEventAndSignalDetectionActions = ReturnType<
  (typeof registeredActions)[keyof typeof registeredEventAndSignalDetectionActions]
>;

export type HistoryListenerActions = ReturnType<
  (typeof registeredActions)[keyof typeof registeredActions]
>;

const historyListenerActions: string[] = Object.values(registeredActions).map(a => a.type);

const registeredActionTypes = Object.values(registeredActions).map(v => v.type);

const registeredEventActionTypes = Object.values(registeredEventActions).map(v => v.type);

const registeredSignalDetectionActionTypes = Object.values(registeredSignalDetectionActions).map(
  v => v.type
);

const registeredEventAndSignalDetectionActionTypes = Object.values(
  registeredEventAndSignalDetectionActions
).map(v => v.type);

export type HistoryListenerActionsTypes = (typeof registeredActionTypes)[number];

type HistoryActions = typeof historyAddAction.type;

type HistoryListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<HistoryActions>>,
  unknown
>;

const historyMiddlewareOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError,
  extra: {}
};

/** validates the undo/redo changes */
const validateUndoRedoChanges = (state: AppState, nextState: Immutable<AppState>): void => {
  if (IS_HISTORY_DEBUG) {
    if (state.app === nextState.app && !isEqual(state.app, nextState.app)) {
      const error = `${INFO} produced app state does not match expected state`;
      logger.error(error);
      throw new Error(error);
    }

    if (state.data === nextState.data && !isEqual(state.data, nextState.data)) {
      const error = `${INFO} produced data state does not match expected state`;
      logger.error(error);
      throw new Error(error);
    }
  }
};

/** returns the associated event ids for the provided signal detection id */
const getAssociatedEventIds = (
  openIntervalName: string,
  signalDetectionId: string,
  events: Event[]
) =>
  flatMap(
    Object.values(events).map(event => {
      const preferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
        event,
        openIntervalName
      );
      if (
        preferredEventHypothesis &&
        includes(
          preferredEventHypothesis.associatedSignalDetectionHypotheses.map(
            s => s.id.signalDetectionId
          ),
          signalDetectionId
        )
      ) {
        return event.id;
      }
      return undefined;
    })
  )
    .filter(notEmpty)
    .sort();

/** determines the conflict status based on the state change */
const determineConflictStatus = (original: AppState, state: AppState): HistoryConflictStatus => {
  const originalConflicts = findAllAssociationEventConflicts(original);
  const conflicts = findAllAssociationEventConflicts(state);

  const originalIds = Object.keys(originalConflicts).sort();
  const ids = Object.keys(conflicts).sort();

  // determine the conflict status
  if (isEqual(ids, originalIds)) {
    return 'none';
  }

  const diff = difference(ids, originalIds);
  if (ids.length > originalIds.length || diff.length > 0) {
    return 'created conflict';
  }

  if (ids.length < originalIds.length) {
    return 'resolved conflict';
  }
  return 'none';
};

/** type guard returns true if the action is an event related action */
export function isEventAction(
  action: HistoryListenerActions
): action is HistoryListenerEventActions {
  return includes([...registeredEventActionTypes], action.type);
}

/** type guard returns true if the action is a signal detection related action */
export function isSignalDetectionAction(
  action: HistoryListenerActions
): action is HistoryListenerSignalDetectionActions {
  return includes([...registeredSignalDetectionActionTypes], action.type);
}

/** type guard returns true if the action is an event or signal detection related action */
export function isEventOrSignalDetectionAction(
  action: HistoryListenerActions
): action is HistoryListenerEventAndSignalDetectionActions {
  return includes([...registeredEventAndSignalDetectionActionTypes], action.type);
}

/**
 * Captures the state changes to the state from the provided action.
 *
 * @param action the action that triggered the response to capture undoable changes
 * @param original the original change before the track action was dispatched
 * @param state the current state (or result) of the state after dispatching the action
 * @returns the captured state and patches from the state changes
 */
const captureStateUndoRedoChanges = (
  action: HistoryListenerActions,
  original: AppState,
  state: AppState
): [Immutable<AppState>, Patch[], Patch[]] => {
  const [nextState, patches, inversePatches] = produceWithPatches<AppState>(original, draft => {
    // do not track event and signal detections changes at the global stack level
    if (!isEventOrSignalDetectionAction(action)) {
      Object.keys(draft.app).forEach(key => {
        draft.app[key] = state.app[key];
      });

      Object.keys(draft.data)
        .filter(key => key !== eventsKey && key !== signalDetectionsKey)
        .forEach(key => {
          draft.data[key] = state.data[key];
        });
    }
  });
  return [nextState, patches, inversePatches];
};

/**
 * Determines the event associations based on the state change of a event.
 *
 * @param original the original change before the track action was dispatched
 * @param state the current state (or result) of the state after dispatching the action
 * @param key the unique event key
 * @returns the associations record and conflict status
 */
const getEventAssociations = (
  original: AppState,
  state: AppState,
  key: string
): AssociatedIdsRecord => {
  const associatedIds: AssociatedIdsRecord = {
    events: {},
    signalDetections: {}
  };

  const originalPreferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    original.data.events[key],
    original.app.workflow.openIntervalName
  );
  // add original event and signal detection associations but track as not active
  const originalAssociatedSdIds =
    original.data.events[key] && originalPreferredEventHypothesis
      ? originalPreferredEventHypothesis.associatedSignalDetectionHypotheses.map(
          s => s.id.signalDetectionId
        )
      : [];
  originalAssociatedSdIds.forEach(oSdId => {
    associatedIds.signalDetections[oSdId] = false;

    const originalAssociatedEventIds = getAssociatedEventIds(
      original.app.workflow.openIntervalName,
      oSdId,
      Object.values(original.data.events)
    );

    originalAssociatedEventIds.forEach(oEvtId => {
      if (oEvtId) {
        associatedIds.events[oEvtId] = false;
      }
    });
  });

  const statePreferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    state.data.events[key],
    state.app.workflow.openIntervalName
  );
  // add current event and signal detection associations but track as active
  const associatedSdIds =
    state.data.events[key] && statePreferredEventHypothesis
      ? statePreferredEventHypothesis.associatedSignalDetectionHypotheses.map(
          s => s.id.signalDetectionId
        )
      : [];
  associatedSdIds.forEach(sdId => {
    associatedIds.signalDetections[sdId] = true;

    const associatedEventIds = getAssociatedEventIds(
      state.app.workflow.openIntervalName,
      sdId,
      Object.values(state.data.events)
    );

    associatedEventIds.forEach(evtId => {
      if (evtId) {
        associatedIds.events[evtId] = true;
      }
    });
  });

  // track event as active
  associatedIds.events[key] = true;
  return associatedIds;
};

/**
 * Determines the signal detection associations based on the state change of a signal detection.
 *
 * @param original the original change before the track action was dispatched
 * @param state the current state (or result) of the state after dispatching the action
 * @param key the unique signal detection key
 * @returns the associations record and conflict status
 */
const getSignalDetectionAssociations = (
  original: AppState,
  state: AppState,
  key: string
): AssociatedIdsRecord => {
  const associatedIds: AssociatedIdsRecord = {
    events: {},
    signalDetections: {}
  };

  // add original event and signal detection associations but track as not active
  const originalAssociatedEventIds = getAssociatedEventIds(
    original.app.workflow.openIntervalName,
    key,
    Object.values(original.data.events)
  );
  originalAssociatedEventIds.forEach(oEvtId => {
    if (oEvtId) {
      associatedIds.events[oEvtId] = false;
      const originalPreferredEventHypothesis =
        findPreferredEventHypothesisByOpenStageOrDefaultStage(
          original.data.events[oEvtId],
          original.app.workflow.openIntervalName
        );
      const originalAssociatedSdIds =
        original.data.events[oEvtId] && originalPreferredEventHypothesis
          ? originalPreferredEventHypothesis.associatedSignalDetectionHypotheses.map(
              s => s.id.signalDetectionId
            )
          : [];
      originalAssociatedSdIds.forEach(oSdId => {
        associatedIds.signalDetections[oSdId] = false;
      });
    }
  });

  // add current event and signal detection associations but track as active
  const associatedEventIds = getAssociatedEventIds(
    state.app.workflow.openIntervalName,
    key,
    Object.values(state.data.events)
  );
  associatedEventIds.forEach(evtId => {
    if (evtId) {
      const statePreferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
        state.data.events[evtId],
        state.app.workflow.openIntervalName
      );
      associatedIds.events[evtId] = true;
      const associatedSdIds =
        state.data.events[evtId] && statePreferredEventHypothesis
          ? statePreferredEventHypothesis.associatedSignalDetectionHypotheses.map(
              s => s.id.signalDetectionId
            )
          : [];
      associatedSdIds.forEach(sdId => {
        associatedIds.signalDetections[sdId] = false;
      });
    }
  });

  // track signal detection as active
  associatedIds.signalDetections[key] = true;
  return associatedIds;
};

/**
 * Determines the associations based on the state change of an event or signal detection.
 *
 * @param original the original change before the track action was dispatched
 * @param state the current state (or result) of the state after dispatching the action
 * @param dataKey the data key (`events` or `signalDetections`)
 * @param key the unique event or signal detection key
 * @returns the associations record and conflict status
 */
const getAssociations = (
  original: AppState,
  state: AppState,
  dataKey: EventAndSignalDetectionKeys,
  key: string
): AssociatedIdsRecord => {
  if (dataKey === 'events') {
    return getEventAssociations(original, state, key);
  }
  return getSignalDetectionAssociations(original, state, key);
};

/** returns true if the action is a flagged as a deletion action (deletes some object) */
const isDeletionAction = (action: HistoryListenerActions): boolean =>
  action.type === 'data/deleteEvents' || action.type === 'data/deleteSignalDetection';

/** returns true if the action is a flagged as a rejection action (rejects some object) */
const isRejectionAction = (action: HistoryListenerActions): boolean =>
  action.type === 'data/rejectEvent';

/** helper function to capture event and signal detection associated changes, i.e. additional related data */
const captureEventAndSignalDetectionAssociatedChanges = (
  action: HistoryListenerActions,
  params: {
    original: AppState;
    state: AppState;
    nextState: Immutable<AppState>;
    result: HistoryChange;
    dataKey: EventAndSignalDetectionKeys;
    change: HistoryItem;
  }
): void => {
  const { original, state, dataKey, change } = params;
  let { nextState } = params;

  // track any associated data changes
  // add the changes to either the event or signal detection stacks based on the action type
  if (
    (isEventAction(action) && dataKey === eventsKey) ||
    (isSignalDetectionAction(action) && dataKey === signalDetectionsKey)
  ) {
    let patches: Patch[];
    let inversePatches: Patch[];

    additionalEventAndSignalDetectionDataKeys.forEach(additionalKey => {
      const additionalKeys = combineKeys(original.data[additionalKey], state.data[additionalKey]);
      additionalKeys.forEach(k => {
        // track only if there are changes
        if (nextState.data[additionalKey][k] !== state.data[additionalKey][k]) {
          [nextState, patches, inversePatches] = produceWithPatches(nextState, draft => {
            draft.data[additionalKey][k] = state.data[additionalKey][k];
          });
          change.patches.push(...patches);
          change.inversePatches.push(...inversePatches);
        }
      });
    });
  }
};

/** helper function to capture event and signal detection changes */
const captureUndoRedoEventAndSignalDetectionChanges = (
  action: HistoryListenerActions,
  params: {
    original: AppState;
    state: AppState;
    nextState: Immutable<AppState>;
    historyId: string;
    historyLabelDescriptions: HistoryLabelDescription;
    type: HistoryListenerActionsTypes;
    time: number;
    label: string;
    description: string;
    status: HistoryStatus;
    isDeletion: boolean;
    isRejection: boolean;
    result: HistoryChange;
  }
): void => {
  // only track event and signal detection changes for the event and signal detection related actions
  if (isEventOrSignalDetectionAction(action)) {
    const { original, state, historyId, historyLabelDescriptions, type } = params;
    const { time, status, isDeletion, isRejection, result } = params;
    let { label, description, nextState } = params;

    let patches: Patch[];
    let inversePatches: Patch[];

    [eventsKey, signalDetectionsKey].forEach(dataKey => {
      const keys = combineKeys(original.data[dataKey], state.data[dataKey]);

      keys.forEach(key => {
        // track only if there are changes
        if (nextState.data[dataKey][key] !== state.data[dataKey][key]) {
          [nextState, patches, inversePatches] = produceWithPatches(nextState, draft => {
            draft.data[dataKey][key] = state.data[dataKey][key];
          });
          [label, description] = historyLabelDescriptions[dataKey][key] || [undefined, undefined];

          const associatedIds = getAssociations(original, state, dataKey, key);
          const conflictStatus = determineConflictStatus(original, state);

          const change: HistoryItem = {
            id: uuid4(),
            historyId,
            type,
            time,
            label,
            description,
            patches,
            inversePatches,
            status,
            associatedIds,
            conflictStatus,
            isDeletion,
            isRejection
          };

          captureEventAndSignalDetectionAssociatedChanges(action, {
            original,
            state,
            nextState,
            result,
            dataKey,
            change
          });

          result[dataKey][key] = change;
        }
      });
    });
  }
};

/**
 * Captures the changes to the state from the provided action.
 *
 * @param action the action that triggered the response to capture undoable changes
 * @param original the original change before the track action was dispatched
 * @param state the current state (or result) of the state after dispatching the action
 * @returns the history change that was captured
 */
const captureUndoRedoChanges = (
  action: HistoryListenerActions,
  original: AppState,
  state: AppState
): HistoryChange => {
  const historyId = uuid4();
  const { type } = action;
  const status: HistoryStatus = 'applied';
  const time = epochSecondsNow();
  const historyLabelDescriptions = getHistoryLabelDescriptions(action, original, state);
  const isDeletion = isDeletionAction(action);
  const isRejection = isRejectionAction(action);

  const [nextState, patches, inversePatches] = captureStateUndoRedoChanges(action, original, state);

  const [label, description] = historyLabelDescriptions.history || [undefined, undefined];
  const result: HistoryChange = {
    history: {
      id: uuid4(),
      historyId,
      type,
      time,
      label,
      description,
      patches,
      inversePatches,
      status,
      conflictStatus: 'none',
      isDeletion,
      isRejection
    },
    events: {},
    signalDetections: {}
  };

  // track event and signal detection changes for the event and signal detection related actions
  captureUndoRedoEventAndSignalDetectionChanges(action, {
    original,
    state,
    nextState,
    historyId,
    historyLabelDescriptions,
    type,
    time,
    label,
    description,
    status,
    isDeletion,
    isRejection,
    result
  });

  validateUndoRedoChanges(state, nextState);
  return result;
};

/**
 * Handles the result of a successful resolved task.
 *
 * !Dispatches events to update the state history for tracking undo/redo changes.
 *
 * @param action the action that was dispatched
 * @param result the result of the completed task
 * @param dispatch redux dispatch function
 */
const handleTaskResolved = (
  action: HistoryListenerActions,
  result: TaskResolved<HistoryChange>,
  dispatch: AppDispatch
): void => {
  if (
    result.value.history.patches.length > 0 ||
    Object.values(result.value.events).some(h => h.patches.length > 0) ||
    Object.values(result.value.signalDetections).some(h => h.patches.length > 0)
  ) {
    logger.debug(`${INFO} adding to undo/redo history`, action);
    dispatch(
      historyAddAction({
        history: result.value.history,
        events: result.value.events,
        signalDetections: result.value.signalDetections
      })
    );
  }
};

/** handles the microtask result from the middleware  */
const handleTaskResult = (
  action: HistoryListenerActions,
  result: TaskResult<HistoryChange>,
  dispatch: AppDispatch
): void => {
  if (result.status === 'ok') {
    handleTaskResolved(action, result, dispatch);
  } else if (result.status === 'cancelled') {
    logger.debug(`${INFO} canceled undo/redo history`, action);
  } else {
    logger.error(`${INFO} rejected undo/redo history`, action, result.error);
  }
};

/** the history middleware - responsible for capturing undoable changes caused by the registered actions */
export const historyMiddleware: HistoryListener =
  createListenerMiddleware(historyMiddlewareOptions);
historyMiddleware.startListening({
  predicate: function historyMiddlewarePredicate(
    action: AnyAction
  ): action is HistoryListenerActions {
    if (includes(historyListenerActions, action.type)) {
      logger.debug(`${INFO} received action to be tracked with undo/redo history`, action);
      return true;
    }
    return false;
  },
  effect: async function historyMiddlewareEffect(action: HistoryListenerActions, listenerApi) {
    const original = listenerApi.getOriginalState();
    const state = listenerApi.getState();

    if (original !== state) {
      const task = listenerApi.fork(() => captureUndoRedoChanges(action, original, state));
      const result = await task.result;
      handleTaskResult(action, result, listenerApi.dispatch);
    } else {
      logger.debug(`${INFO} zero state changes`);
    }
  }
});
