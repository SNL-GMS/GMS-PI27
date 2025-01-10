import type { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import type { WritableDraft } from 'immer/dist/internal';

import { getWorkingEventHypothesis } from './get-working-event-hypothesis';

/**
 * Updates any associated signal detection hypothesis with newly created signal detection hypothesis
 * due to changes to a signal detection
 *
 * @param openIntervalName the open interval name
 * @param existingSDHypothesis target SD hypothesis
 * @param newSDHypothesis replacement SD hypothesis
 * @param events to update
 */
export const updateSignalDetectionHypothesisToEvents = (
  openIntervalName: string,
  existingSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
  events: WritableDraft<EventTypes.Event>[],
  newSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesisFaceted
) => {
  events.forEach(event => {
    const currentEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      event,
      openIntervalName
    );
    if (currentEventHypothesis) {
      const index = currentEventHypothesis.associatedSignalDetectionHypotheses.findIndex(
        sdHypo => sdHypo.id.id === existingSDHypothesis.id.id
      );

      if (index >= 0) {
        const eventHypothesis = getWorkingEventHypothesis(openIntervalName, event);
        eventHypothesis.associatedSignalDetectionHypotheses[index] = newSDHypothesis;
      }
    }
  });
};
