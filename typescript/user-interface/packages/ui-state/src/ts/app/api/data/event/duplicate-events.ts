import type { EventTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import type { WorkflowDefinitionId } from '@gms/common-model/lib/workflow/types';
import { epochSecondsNow, Logger, uuid4 } from '@gms/common-util';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';
import cloneDeep from 'lodash/cloneDeep';

import type { DataState } from '../types';

export const duplicateEventsAction = 'data/duplicateEvents' as const;

const logger = Logger.create('GMS_LOG_EVENTS', process.env.GMS_LOG_EVENTS);

/**
 * The action for duplicating an event.
 */
export const duplicateEvents = createAction<
  {
    /** the IDs of events to be duplicated */
    eventIds: string[];
    /** the unique ids to use for the duplicated events created */
    newEventIds: string[];
    workflowDefinitionId?: WorkflowDefinitionId;
    username: string;
    openIntervalName: string;
  },
  typeof duplicateEventsAction
>(duplicateEventsAction);

/**
 * Returns true if the action is of type {@link duplicateEvents}.
 */
export const isDuplicateEventsAction = (
  action: AnyAction
): action is ReturnType<typeof duplicateEvents> => action.type === duplicateEventsAction;

/**
 * Duplicates the provided Event.
 *
 * Creates new Event objects that duplicates the EventHypothesis objects in the
 * provided collection. Each new Event contains a single EventHypothesis which is
 * a copy of one of the provided EventHypothesis objects.
 *
 * Updates the _ui only attribute _uiHasUnsavedEventSdhAssociation to true
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const duplicateEventsReducer: CaseReducer<DataState, ReturnType<typeof duplicateEvents>> = (
  state,
  action
) => {
  const { eventIds, newEventIds, workflowDefinitionId, username, openIntervalName } =
    action.payload;

  if (!workflowDefinitionId) {
    throw new Error('No valid workflow definition ID supplied');
  }

  if (eventIds.length !== newEventIds.length) {
    throw new Error('Invalid length for event IDs for duplication');
  }

  const eventsToDuplicateList = eventIds.map<WritableDraft<EventTypes.Event>>(
    eventId => state.events[eventId]
  );

  const signalDetections = Object.values(state.signalDetections);
  const newEvents: EventTypes.Event[] = [];

  eventsToDuplicateList.forEach((event, index) => {
    const newEventId: string = newEventIds[index];
    const newHypothesisId: string = uuid4();

    const originalEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      event,
      openIntervalName
    );

    // Don't include rejected or deleted events
    if (
      !originalEventHypothesis ||
      originalEventHypothesis.deleted ||
      originalEventHypothesis.rejected
    )
      return;

    const newPreferredEventHypothesis: WritableDraft<EventTypes.EventHypothesis> =
      cloneDeep(originalEventHypothesis);
    newPreferredEventHypothesis.id = {
      eventId: newEventId,
      hypothesisId: newHypothesisId
    };

    newPreferredEventHypothesis.parentEventHypotheses = [{ id: originalEventHypothesis.id }];

    // TODO: (Future Work) It is possible the parent EventHypothesis, including its associated Event entity, is unsaved.
    // TODO: (Future Work) If this is the case, the parent parent EventHypothesis must be saved when the duplicate is saved.

    // deleted is copied from the original EventHypothesis.
    // rejected is copied from the original EventHypothesis.
    // associatedSignalDetectionHypotheses is copied from the original EventHypothesis object's associatedSignalDetectionHypotheses collection.

    newPreferredEventHypothesis.associatedSignalDetectionHypotheses.forEach(sdHyp => {
      const sdToUpdate = signalDetections.find(sd => sd.id === sdHyp.id.signalDetectionId);
      if (sdToUpdate) {
        sdToUpdate._uiHasUnsavedEventSdhAssociation = epochSecondsNow();
      } else {
        logger.error(
          'No signal detection found with an ID that matches an associated signal detection hypothesis for the new preferred event hypothesis for the duplicated event'
        );
      }
    });

    newPreferredEventHypothesis.locationSolutions = cloneDeep(
      originalEventHypothesis.locationSolutions
    );
    // eslint-disable-next-line no-return-assign
    newPreferredEventHypothesis.locationSolutions.forEach(loc => (loc.id = uuid4()));
    newPreferredEventHypothesis.preferredLocationSolution = {
      id: newPreferredEventHypothesis.locationSolutions[0].id
    };
    newPreferredEventHypothesis._uiHasUnsavedChanges = epochSecondsNow();

    const newEvent: EventTypes.Event = {
      id: newEventId,
      rejectedSignalDetectionAssociations: [],
      monitoringOrganization: event.monitoringOrganization,
      eventHypotheses: [newPreferredEventHypothesis],
      preferredEventHypothesisByStage: [
        {
          stage: workflowDefinitionId,
          preferredBy: username,
          preferred: { id: newPreferredEventHypothesis.id }
        }
      ],
      finalEventHypothesisHistory: [],
      overallPreferred: { id: newPreferredEventHypothesis.id },
      _uiHasUnsavedChanges: epochSecondsNow()
    };
    newEvents.push(newEvent);
  });

  // update the state
  newEvents.forEach(event => {
    state.events[event.id] = event;
  });
};
