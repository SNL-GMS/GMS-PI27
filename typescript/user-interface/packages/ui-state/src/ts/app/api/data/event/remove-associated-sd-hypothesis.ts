import type { EventTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import type { WritableDraft } from 'immer/dist/internal';

import { getWorkingEventHypothesis } from './get-working-event-hypothesis';
import { includesFeatureMeasurement } from './utils';

/**
 * Callback function to be used when mapping over a list of {@link EventTypes.LocationSolution}s.
 * Removes any magnitudeBehaviors and locationBehaviors that are associated with a
 * given target {@link SignalDetectionTypes.SignalDetectionHypothesis}
 *
 * @param locationSolution Base locationSolution object to updated
 * @param targetSdHypothesis Used to determine which properties should be removed.
 * @param targetSdPhaseValue Used to determine magnitudeBehavior association.
 * @returns Updated locationSolution
 */
export const removeLocationAndMagnitudeBehaviors = (
  locationSolution: EventTypes.LocationSolution,
  targetSdHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
  targetSdPhaseValue: SignalDetectionTypes.PhaseTypeMeasurementValue | undefined
) => {
  const networkMagnitudeSolutions = locationSolution.networkMagnitudeSolutions.map(
    networkMagnitudeSolution => {
      return {
        ...networkMagnitudeSolution,
        magnitudeBehaviors: networkMagnitudeSolution.magnitudeBehaviors.filter(
          magnitudeBehavior => {
            const { stationMagnitudeSolution } = magnitudeBehavior;
            // If the SDHypothesis phase/station matches with a pre-existing magnitudeBehavior then that
            // magnitudeBehavior must be removed in the new object.
            return !(
              stationMagnitudeSolution.station.name === targetSdHypothesis.station.name &&
              stationMagnitudeSolution.phase === targetSdPhaseValue?.value
            );
          }
        )
      };
    }
  );

  const locationBehaviors = locationSolution.locationBehaviors.filter(
    locationBehavior =>
      !includesFeatureMeasurement(
        targetSdHypothesis.featureMeasurements,
        locationBehavior.measurement
      )
  );

  return {
    ...locationSolution,
    networkMagnitudeSolutions,
    locationBehaviors
  };
};

/**
 * Removes any associated signal detection hypothesis where the Signal Detection has been deleted
 *
 * @param openIntervalName the open interval name
 * @param targetSdHypothesis target SD hypothesis
 * @param events to update
 */
export const removeSignalDetectionHypothesisFromEvents = (
  openIntervalName: string,
  targetSdHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
  events: WritableDraft<EventTypes.Event>[]
) => {
  events.forEach(event => {
    const currentEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      event,
      openIntervalName
    );
    if (currentEventHypothesis) {
      const index = currentEventHypothesis.associatedSignalDetectionHypotheses.findIndex(
        sdHypo => sdHypo.id.id === targetSdHypothesis.id.id
      );

      // Used to check against magnitudeBehaviors in the below loop
      const phaseFMValue = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
        targetSdHypothesis?.featureMeasurements
      );

      if (index >= 0) {
        const eventHypothesis = getWorkingEventHypothesis(openIntervalName, event);
        eventHypothesis.associatedSignalDetectionHypotheses.splice(index, 1);

        eventHypothesis.locationSolutions = eventHypothesis.locationSolutions.map(
          locationSolution =>
            removeLocationAndMagnitudeBehaviors(locationSolution, targetSdHypothesis, phaseFMValue)
        );
      }
    }
  });
};
