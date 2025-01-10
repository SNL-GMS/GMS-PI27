import type { WorkflowTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import { epochSecondsNow } from '@gms/common-util';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import type { DataState } from '../types';
import { createWorkingHypothesisAndUpdateAssociations } from './create-working-hypothesis';
import { getWorkingEventHypothesis } from './get-working-event-hypothesis';
import { removeLocationAndMagnitudeBehaviors } from './remove-associated-sd-hypothesis';

export const unassociateSignalDetectionsToEventAction =
  'data/unassociateSignalDetectionsToEvent' as const;

/**
 * The action for unassociating signal detections to an event.
 */
export const unassociateSignalDetectionsToEvent = createAction<
  {
    username: string;
    openIntervalName: string;
    stageId?: WorkflowTypes.IntervalId;
    eventId: string;
    signalDetectionIds: string[];
    rejectAssociations: boolean;
  },
  typeof unassociateSignalDetectionsToEventAction
>(unassociateSignalDetectionsToEventAction);

/**
 * Returns true if the action is of type {@link unassociateSignalDetectionsToEvent}.
 */
export const isUnassociateSignalDetectionsToEventAction = (
  action: AnyAction
): action is ReturnType<typeof unassociateSignalDetectionsToEvent> =>
  action.type === unassociateSignalDetectionsToEventAction;

/**
 * Unassociates the provided signal detections to the provided Event.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const unassociateSignalDetectionToEventReducer: CaseReducer<
  DataState,
  ReturnType<typeof unassociateSignalDetectionsToEvent>
> = (state, action) => {
  const { username, stageId, openIntervalName, eventId, signalDetectionIds, rejectAssociations } =
    action.payload;

  if (!eventId || !openIntervalName || !stageId) return;

  const event = state.events[eventId];
  const currentEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    event,
    openIntervalName
  );

  // filter to only include signal detections that are associated, no reason to attempt to unassociate something that is not associated
  const signalDetectionsToUnassociate = signalDetectionIds
    .map<WritableDraft<SignalDetectionTypes.SignalDetection>>(sdId => state.signalDetections[sdId])
    .filter(sd => {
      const currentSdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
        sd.signalDetectionHypotheses
      );
      if (!currentEventHypothesis) return false;
      return (
        currentEventHypothesis.associatedSignalDetectionHypotheses.find(
          assocSdHypo => assocSdHypo.id.id === currentSdHypothesis.id.id
        ) !== undefined
      );
    });

  createWorkingHypothesisAndUpdateAssociations(state, {
    username,
    openIntervalName,
    stageId,
    eventIds: [eventId],
    signalDetectionIds: signalDetectionsToUnassociate.map(sd => sd.id)
  });

  // ! begin any modifications to the store
  // only attempt to unassociate if there are associated signal detections to unassociate
  if (signalDetectionsToUnassociate.length > 0) {
    const eventHypothesis = getWorkingEventHypothesis(openIntervalName, event);

    signalDetectionsToUnassociate.forEach(sd => {
      const signalDetectionHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
        sd.signalDetectionHypotheses
      );
      eventHypothesis.associatedSignalDetectionHypotheses =
        eventHypothesis.associatedSignalDetectionHypotheses.filter(
          associatedSignalDetectionHypothesis =>
            associatedSignalDetectionHypothesis.id.id !== signalDetectionHypothesis.id.id
        );

      // Used to check against magnitudeBehaviors in the below loop
      const phaseFMValue = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
        signalDetectionHypothesis.featureMeasurements
      );

      // Removing all of the location behaviors that are associated to any
      // of the signalDetectionHypothesis featureMeasurements
      eventHypothesis.locationSolutions = eventHypothesis.locationSolutions.map(locationSolution =>
        removeLocationAndMagnitudeBehaviors(
          locationSolution,
          signalDetectionHypothesis,
          phaseFMValue
        )
      );

      const signalDetection =
        state.signalDetections[signalDetectionHypothesis.id.signalDetectionId];

      signalDetection._uiHasUnsavedEventSdhAssociation = epochSecondsNow();
    });

    event._uiHasUnsavedChanges = epochSecondsNow();

    if (rejectAssociations) {
      // If an sd id that is going to be unassociated is in the rejectedSignalDetectionAssociations add it from the list
      const sdIds = signalDetectionsToUnassociate.map(sd => ({
        id: sd.id
      }));
      event.rejectedSignalDetectionAssociations.push(...sdIds);
    }
  }
};
