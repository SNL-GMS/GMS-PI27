import type { EventTypes, StationTypes } from '@gms/common-model';
import type { SignalDetectionHypothesis } from '@gms/common-model/lib/signal-detection';
import { getCurrentHypothesis } from '@gms/common-model/lib/signal-detection/util';
import type { WorkflowDefinitionId } from '@gms/common-model/lib/workflow/types';
import { epochSecondsNow } from '@gms/common-util';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import type { DataState } from '../types';
import { createEventHypothesisForNewEvent } from './utils';

export const createEventFromSignalDetectionsAction =
  'data/createEventFromSignalDetections' as const;

export const createEventFromSignalDetections = createAction<
  {
    newEventId: string;
    signalDetectionIds: string[];
    monitoringOrganization: string;
    workflowDefinitionId?: WorkflowDefinitionId;
    username: string;
    stations: StationTypes.Station[];
  },
  typeof createEventFromSignalDetectionsAction
>(createEventFromSignalDetectionsAction);

/**
 * Returns true if the action is of type {@link createEventFromSignalDetections}.
 */
export const isCreateEventFromSignalDetectionsAction = (
  action: AnyAction
): action is ReturnType<typeof createEventFromSignalDetections> =>
  action.type === createEventFromSignalDetectionsAction;

/**
 * Creates a new event based on the provided signal detection IDs
 *
 * @param state the current redux state of the data slice
 * @param action the action being invoked
 */
export const createEventFromSignalDetectionsReducer: CaseReducer<
  DataState,
  ReturnType<typeof createEventFromSignalDetections>
> = (state, action) => {
  const {
    newEventId,
    signalDetectionIds,
    monitoringOrganization,
    workflowDefinitionId,
    username,
    stations
  } = action.payload;

  const currentSdHypotheses = signalDetectionIds
    .map<WritableDraft<SignalDetectionHypothesis>>(sdId => {
      const sd = state.signalDetections[sdId];
      const sdHypo = getCurrentHypothesis(sd.signalDetectionHypotheses);
      // Update unsaved changes if not rejected
      if (!sdHypo.deleted) sd._uiHasUnsavedEventSdhAssociation = epochSecondsNow();
      return sdHypo;
    })
    .filter(sd => !sd.deleted); // filter out any selected rejected sd's

  /** New EventHypothesis, added to the new event */
  const newEventHypothesis = createEventHypothesisForNewEvent(
    newEventId,
    currentSdHypotheses,
    stations
  );

  if (!workflowDefinitionId) {
    throw new Error('Undefined workflow definition id');
  } else {
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
  }
};
