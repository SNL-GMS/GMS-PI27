import type { EventHypothesis } from '@gms/common-model/lib/event';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { UILogger } from '@gms/ui-util';
import type {
  Action,
  AnyAction,
  CreateListenerMiddlewareOptions,
  ListenerErrorHandler,
  ListenerMiddlewareInstance,
  ThunkDispatch
} from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { ListenerErrorInfo } from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import includes from 'lodash/includes';
import intersectionWith from 'lodash/intersectionWith';
import isEqual from 'lodash/isEqual';
import uniq from 'lodash/uniq';

import type { AssociationConflictRecord } from '../../../../types';
import { undoRedo } from '../../../history/reducers';
import type { AppState } from '../../../store';
import {
  deleteSignalDetection,
  updateArrivalTimeSignalDetection,
  updatePhaseSignalDetection
} from '../signal-detection';
import { associateSignalDetectionsToEvent } from './associate-sds-to-event';
import { createEventFromSignalDetections } from './create-event-from-sds';
import { createVirtualEvent } from './create-virtual-event';
import { deleteEvents } from './delete-events';
import { duplicateEvents } from './duplicate-events';
import { eventAssociationConflict } from './event-conflict';
import { rejectEvents } from './reject-events';
import { unassociateSignalDetectionsToEvent } from './unassociate-sds-to-event';

const INFO = 'Event Conflict Middleware:' as const;
const logger = UILogger.create('GMS_EVENT_CONFLICT', process.env.GMS_EVENT_CONFLICT);

const registeredActions = {
  associateSignalDetectionsToEvent,
  unassociateSignalDetectionsToEvent,
  duplicateEvents,
  createEventFromSignalDetections,
  createVirtualEvent,
  undoRedo,
  rejectEvents,
  deleteEvents,
  updateArrivalTimeSignalDetection,
  updatePhaseSignalDetection,
  deleteSignalDetection
} as const;

const onError: ListenerErrorHandler = (error: unknown, errorInfo: ListenerErrorInfo) => {
  logger.error(`${INFO} error occurred`, error, errorInfo);
};

type EventConflictListenerActions = ReturnType<
  (typeof registeredActions)[keyof typeof registeredActions]
>;

const eventConflictListenerActions: string[] = Object.values(registeredActions).map(a => a.type);

type EventConflictActions = typeof eventAssociationConflict.type;

type EventConflictListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<EventConflictActions>>,
  unknown
>;

const eventConflictMiddlewareOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError,
  extra: {}
};

/**
 * Finds all the conflicts for event associations
 *
 * @param state current state
 * @returns an AssociationConflictRecord for all event association conflicts
 */
export const findAllAssociationEventConflicts = (state: AppState) => {
  const conflictRecord: AssociationConflictRecord = {};
  const eventHypotheses = Object.values(state.data.events).reduce<EventHypothesis[]>(
    (accumulator, event) => {
      // Map
      const eventHypo = findPreferredEventHypothesisByOpenStageOrDefaultStage(
        event,
        state.app.workflow.openIntervalName
      );
      // Filter
      if (eventHypo && eventHypo.associatedSignalDetectionHypotheses.length > 0) {
        accumulator.push(eventHypo);
      }
      return accumulator;
    },
    []
  );
  eventHypotheses.forEach(eventHypothesis => {
    eventHypotheses.forEach(eventHypothesis2 => {
      if (eventHypothesis.id.hypothesisId !== eventHypothesis2.id.hypothesisId) {
        const sdIdsWithConflict = intersectionWith(
          eventHypothesis.associatedSignalDetectionHypotheses,
          eventHypothesis2.associatedSignalDetectionHypotheses,
          (a, b) => a.id.id === b.id.id
        );
        if (sdIdsWithConflict.length !== 0) {
          sdIdsWithConflict.forEach(sdConflictId => {
            if (!conflictRecord[sdConflictId.id.signalDetectionId]) {
              conflictRecord[sdConflictId.id.signalDetectionId] = {
                signalDetectionHypothesisId: sdConflictId.id,
                eventHypothesisIds: [eventHypothesis.id, eventHypothesis2.id]
              };
            } else {
              conflictRecord[sdConflictId.id.signalDetectionId] = {
                signalDetectionHypothesisId: sdConflictId.id,
                eventHypothesisIds: uniq([
                  ...conflictRecord[sdConflictId.id.signalDetectionId].eventHypothesisIds,
                  eventHypothesis.id,
                  eventHypothesis2.id
                ])
              };
            }
          });
        }
      }
    });
  });
  return conflictRecord;
};

export const eventConflictMiddleware: EventConflictListener = createListenerMiddleware(
  eventConflictMiddlewareOptions
);
eventConflictMiddleware.startListening({
  predicate: (action: AnyAction): action is EventConflictListenerActions => {
    if (includes(eventConflictListenerActions, action.type)) {
      logger.debug(`${INFO} received action for event conflict`, action);
      return true;
    }
    return false;
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState();
    const task = listenerApi.fork(() => findAllAssociationEventConflicts(state));
    const result = await task.result;

    if (result.status === 'ok') {
      logger.debug(`${INFO} completed event conflict`, action);

      // TODO: potentially remove this check; upcoming work to improve referential stability
      if (!isEqual(result.value, state.data.associationConflict)) {
        listenerApi.dispatch(
          eventAssociationConflict({ eventAssociationConflictRecord: result.value })
        );
      }
    } else if (result.status === 'cancelled') {
      logger.debug(`${INFO} canceled event conflict`, action);
    } else {
      logger.error(`${INFO} rejected event conflict`, action, result.error);
    }
  }
});
