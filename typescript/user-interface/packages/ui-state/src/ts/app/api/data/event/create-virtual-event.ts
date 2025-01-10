import type { EventTypes } from '@gms/common-model';
import type { WorkflowDefinitionId } from '@gms/common-model/lib/workflow/types';
import { epochSecondsNow } from '@gms/common-util';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { DataState } from '../types';
import { createEventHypothesisForNewVirtualEvent } from './utils';

export const createVirtualEventAction = 'data/createVirtualEvent' as const;

export const createVirtualEvent = createAction<
  {
    newEventId: string;
    eventDate: Date;
    latitudeDegrees: number;
    longitudeDegrees: number;
    depthKm: number;
    monitoringOrganization: string;
    workflowDefinitionId?: WorkflowDefinitionId;
    username: string;
  },
  typeof createVirtualEventAction
>(createVirtualEventAction);

/**
 * Returns true if the action is of type {@link createVirtualEvent}.
 */
export const isCreateVirtualEventAction = (
  action: AnyAction
): action is ReturnType<typeof createVirtualEvent> => action.type === createVirtualEventAction;

/**
 * Creates a new "virtual" event based on the provided event date, lat/lon,
 * and depth.
 *
 * @param state the current redux state of the data slice
 * @param action the action being invoked
 */
export const createVirtualEventReducer: CaseReducer<
  DataState,
  ReturnType<typeof createVirtualEvent>
> = (state, action) => {
  const {
    newEventId,
    eventDate,
    latitudeDegrees,
    longitudeDegrees,
    depthKm,
    monitoringOrganization,
    workflowDefinitionId,
    username
  } = action.payload;

  if (!workflowDefinitionId) {
    throw new Error('No valid workflow definition ID supplied');
  }

  /** New EventHypothesis, added to the new event */
  const newEventHypothesis = createEventHypothesisForNewVirtualEvent(
    newEventId,
    eventDate,
    latitudeDegrees,
    longitudeDegrees,
    depthKm
  );

  /** New event to be added to the Redux state */
  const newEvent: EventTypes.Event = {
    id: newEventId,
    // empty collection
    rejectedSignalDetectionAssociations: [],
    // set to the configured monitoring organization
    monitoringOrganization,
    eventHypotheses: [newEventHypothesis],
    // id-only instance of the new EventHypothesis
    overallPreferred: { id: newEventHypothesis.id },
    preferredEventHypothesisByStage: [
      {
        stage: workflowDefinitionId,
        preferredBy: username,
        // id-only instance of the new EventHypothesis
        preferred: { id: newEventHypothesis.id }
      }
    ],
    // Empty collection
    finalEventHypothesisHistory: [],
    _uiHasUnsavedChanges: epochSecondsNow()
  };

  // update the state with this new event
  state.events[newEvent.id] = newEvent;
};
