import type { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { epochSecondsNow } from '@gms/common-util';
import type { WritableDraft } from 'immer/dist/internal';

import { hasWorkingEventHypothesis } from './get-working-event-hypothesis';

/**
 * Marks the associated events for the provided signal detection hypothesis as having changes
 *
 * @param openIntervalName
 * @param sdHypothesis
 * @param events
 */
export const markAssociatedEventsWithUnsavedChanges = (
  openIntervalName: string,
  sdHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
  events: WritableDraft<EventTypes.Event>[]
) => {
  events.forEach(event => {
    const currentEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      event,
      openIntervalName
    );
    if (currentEventHypothesis) {
      if (
        // check to see if the signal detection hypothesis is associated to the event
        currentEventHypothesis.associatedSignalDetectionHypotheses.findIndex(
          sdHypo => sdHypo.id.id === sdHypothesis.id.id
        ) >= 0
      ) {
        if (hasWorkingEventHypothesis(event)) {
          event._uiHasUnsavedChanges = epochSecondsNow();
        } else {
          throw new Error(
            `Unable to mark event with unsaved changes, must have a working hypothesis: ${event.id}`
          );
        }
      }
    }
  });
};
