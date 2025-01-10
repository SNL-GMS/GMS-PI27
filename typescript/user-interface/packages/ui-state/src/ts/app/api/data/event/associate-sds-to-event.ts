import type { EventTypes, SignalDetectionTypes, WorkflowTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import {
  findArrivalTimeFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import { epochSecondsNow } from '@gms/common-util';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';
import includes from 'lodash/includes';

import type { DataState } from '../types';
import { createWorkingHypothesisAndUpdateAssociations } from './create-working-hypothesis';
import { getWorkingEventHypothesis } from './get-working-event-hypothesis';

export const associateSignalDetectionsToEventAction =
  'data/associateSignalDetectionsToEvent' as const;

/**
 * The action for associating signal detections to an event.
 */
export const associateSignalDetectionsToEvent = createAction<
  {
    username: string;
    openIntervalName: string;
    stageId?: WorkflowTypes.IntervalId;
    eventId: string;
    signalDetectionIds: string[];
  },
  typeof associateSignalDetectionsToEventAction
>(associateSignalDetectionsToEventAction);

/**
 * Returns true if the action is of type {@link associateSignalDetectionsToEvent}.
 */
export const isAssociateSignalDetectionsToEventAction = (
  action: AnyAction
): action is ReturnType<typeof associateSignalDetectionsToEvent> =>
  action.type === associateSignalDetectionsToEventAction;

/**
 * Associates the provided signal detections to the provided Event.
 *
 * Uses the arrivalTimeFeatureMeasurement to create a new location behavior, then updates
 * each of the location solutions to add the newly created location behavior
 *
 * Removes any signal detections that are in the rejectedSignalDetectionAssociations that are
 * being associated
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const associateSignalDetectionToEventReducer: CaseReducer<
  DataState,
  ReturnType<typeof associateSignalDetectionsToEvent>
> = (state, action) => {
  const { username, stageId, openIntervalName, eventId, signalDetectionIds } = action.payload;

  if (!eventId || !openIntervalName || !stageId) return;

  const event = state.events[eventId];
  const currentEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    event,
    openIntervalName
  );

  // filter to only include signal detections that are unassociated, no reason to attempt to associate something that is not associated
  const signalDetectionsToAssociate = signalDetectionIds
    .map<WritableDraft<SignalDetectionTypes.SignalDetection>>(sdId => state.signalDetections[sdId])
    .filter(sd => {
      const currentSdHypothesis = getCurrentHypothesis(sd.signalDetectionHypotheses);
      if (!currentEventHypothesis) return false;
      return (
        currentEventHypothesis.associatedSignalDetectionHypotheses.find(
          assocSdHypo => assocSdHypo.id.id === currentSdHypothesis.id.id
        ) === undefined
      );
    });

  const sdIdsToAssociate = signalDetectionsToAssociate.map(sd => sd.id);

  createWorkingHypothesisAndUpdateAssociations(state, {
    username,
    openIntervalName,
    stageId,
    eventIds: [eventId],
    signalDetectionIds: sdIdsToAssociate
  });

  // ! begin any modifications to the store
  // only attempt to associate if there are unassociated signal detections to associate
  if (signalDetectionsToAssociate.length > 0) {
    const eventHypothesis = getWorkingEventHypothesis(openIntervalName, event);

    signalDetectionsToAssociate.forEach(sd => {
      const signalDetectionHypothesis = getCurrentHypothesis(sd.signalDetectionHypotheses);
      eventHypothesis.associatedSignalDetectionHypotheses.push({
        id: signalDetectionHypothesis.id
      });

      const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurement(
        signalDetectionHypothesis.featureMeasurements
      );

      if (arrivalTimeFeatureMeasurement) {
        const newLocationBehavior: EventTypes.LocationBehavior = {
          defining: true,
          measurement: arrivalTimeFeatureMeasurement
        };

        eventHypothesis.locationSolutions.forEach(locationSolution => {
          locationSolution.locationBehaviors.push(newLocationBehavior);
        });
      }

      const signalDetection =
        state.signalDetections[signalDetectionHypothesis.id.signalDetectionId];
      signalDetection._uiHasUnsavedEventSdhAssociation = epochSecondsNow();
    });

    event._uiHasUnsavedChanges = epochSecondsNow();

    // If an sd id that is going to be associated is in the rejectedSignalDetectionAssociations remove it from the list
    event.rejectedSignalDetectionAssociations = event.rejectedSignalDetectionAssociations?.filter(
      rejectedSignalDetectionAssociation =>
        !includes(sdIdsToAssociate, rejectedSignalDetectionAssociation.id)
    );
  }
};
