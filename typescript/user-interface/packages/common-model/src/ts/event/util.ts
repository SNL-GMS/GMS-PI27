import { getDistance, getGreatCircleBearing } from 'geolib';
import memoize from 'lodash/memoize';

import { findOrThrow } from '../array-util/array-util';
import type { CommonTypes, EventTypes, SignalDetectionTypes } from '../common-model';
import { getCurrentHypothesis } from '../signal-detection/util';
import type { Event, EventHypothesis, EventLocation, LocationSolution } from './types';

/**
 * Finds preferred event hypothesis for a given event and stage
 * If no preferred hypothesis exists for stage, will return most recent preferred hypothesis by stage
 *
 * @param event Event to search within
 * @param openIntervalName Currently open interval/stage name eg; "AL1"
 * @returns EventHypothesis corresponding to the current open stage, otherwise default stage EventHypothesis.
 */
// TODO: This should NOT return undefined; requires refactoring for other components
export const findPreferredEventHypothesisByOpenStageOrDefaultStage = (
  event: Event | undefined,
  openIntervalName: string
): EventHypothesis | undefined => {
  if (!event) {
    return undefined;
  }
  const { preferredEventHypothesisByStage, eventHypotheses } = event;

  const preferredHypoByStageId =
    preferredEventHypothesisByStage.find(hypo => hypo.stage.name === openIntervalName)?.preferred ??
    preferredEventHypothesisByStage[0].preferred; // Default preferred

  // Should not be capable of returning undefined
  // Should either return hypo by the open stage, or hypo by auto network (default)
  return findOrThrow<EventTypes.EventHypothesis>(
    eventHypotheses,
    hypothesis => hypothesis.id.hypothesisId === preferredHypoByStageId.id.hypothesisId
  );
};

/**
 * Determines if a Signal Detection is associated to an event by searching event hypothesis for
 * the SD id. Stops scanning when the first association is found.
 *
 * @param currentSDHypothesis the current hypothesis from the SD to be checked for event association
 * @param events the events you want to search through to check for SD association
 * @param openIntervalName
 * @returns
 */
export function isSignalDetectionUnassociated(
  sdHypo: SignalDetectionTypes.SignalDetectionHypothesis,
  events: EventTypes.Event[],
  openIntervalName: string
) {
  return !events.find(event => {
    const preferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      event,
      openIntervalName
    );
    if (preferredEventHypothesis) {
      return preferredEventHypothesis.associatedSignalDetectionHypotheses.find(
        associatedSignalDetectionHypothesis => associatedSignalDetectionHypothesis.id === sdHypo.id
      );
    }
    return false;
  });
}

/**
 * Determine if a signal detection is associated to an event.
 *
 * @param detection signal detection to check event association against
 * @param events list of {@link EventTypes.Event} objects to search through
 * @param currentOpenEventId
 * @param openIntervalName eg; Auto Network, AL1, AL2
 * @returns boolean
 */
export function isSignalDetectionOpenAssociated(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  currentOpenEventId: string,
  openIntervalName: string
): boolean {
  if (!currentOpenEventId || !events) {
    return false;
  }
  const currentOpenEvent = events.find(event => event.id === currentOpenEventId);
  const currentPreferredHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    currentOpenEvent,
    openIntervalName
  );

  // Determines if the current SD hypothesis is in the associated SD
  // list for the current preferred event hypothesis
  return !!currentPreferredHypothesis?.associatedSignalDetectionHypotheses?.find(
    sd => sd?.id.id === getCurrentHypothesis(detection?.signalDetectionHypotheses)?.id.id
  );
}

/**
 * Determines if the provided {@link EventHypothesis} object is the
 * preferredEventHypothesis for the current open stage.
 *
 * @param event Event object to check
 * @param openIntervalName Current open stage
 * @param eventHypothesis EventHypothesis object to verify
 * @returns true if the eventHypothesis is preferred
 */
export const isPreferredEventHypothesisByStage = (
  event: Event,
  openIntervalName: string,
  eventHypothesis: EventHypothesis
): boolean => {
  if (!event || !eventHypothesis) {
    return false;
  }

  // Get the preferredEventHypo exists for the open stage (if it exists)
  const maybePreferred = event.preferredEventHypothesisByStage.find(
    hypo => hypo.stage.name === openIntervalName
  );

  // Check if these two have the same identifiers
  return (
    maybePreferred?.preferred.id.eventId === eventHypothesis.id.eventId &&
    maybePreferred?.preferred.id.hypothesisId === eventHypothesis.id.hypothesisId
  );
};

/**
 * Finds the last non rejected parent event hypothesis for a given event and hypothesis
 * if no valid hypothesis is found it returns the first hypothesis
 *
 * @param event
 * @param eventHypothesis
 */
export const findEventHypothesisParent = (
  event: Event,
  /** Can be either the hypothesis for the open stage, or the default stage */
  eventHypothesis: EventHypothesis | undefined
): EventHypothesis | undefined => {
  if (!eventHypothesis) {
    return undefined;
  }

  // loop backwards until we find a non-rejected hypothesis
  for (let i = eventHypothesis.parentEventHypotheses.length - 1; i >= 0; i -= 1) {
    const parentEventHypothesis = event.eventHypotheses.find(
      hypo => hypo.id.hypothesisId === eventHypothesis.parentEventHypotheses[i].id.hypothesisId
    );
    if (parentEventHypothesis) {
      return parentEventHypothesis;
    }
  }

  // nothing was found, return the first hypothesis
  return event.eventHypotheses[0];
};

/**
 * Finds the preferred location solution for a hypothesis falling back to the parents if the hypothesis is rejected
 *
 * @param eventHypothesisId hypothesis id to find the solution for
 * @param eventHypotheses list of hypotheses, if an event is opened
 * @returns a location solution
 */
export const findPreferredLocationSolution = (
  eventHypothesisId: string,
  eventHypotheses: EventHypothesis[]
): LocationSolution | undefined => {
  const eventHypothesis = eventHypotheses.find(
    hypothesis => hypothesis.id.hypothesisId === eventHypothesisId
  );
  if (!eventHypothesis) return undefined;
  if (eventHypothesis.preferredLocationSolution) {
    return eventHypothesis.locationSolutions.find(
      ls => ls.id === eventHypothesis?.preferredLocationSolution?.id
    );
  }

  if (eventHypothesis.parentEventHypotheses) {
    const parentHypothesisId =
      eventHypothesis.parentEventHypotheses[eventHypothesis.parentEventHypotheses.length - 1].id
        .hypothesisId;

    const parentEventHypothesis = eventHypotheses.find(
      hypothesis => hypothesis.id.hypothesisId === parentHypothesisId
    );

    return parentEventHypothesis?.locationSolutions.find(
      ls => ls.id === parentEventHypothesis?.preferredLocationSolution?.id
    );
  }

  return undefined;
};

/**
 * Calculate the distance in kilometers between an event and a station.
 *
 * @param source The source location for which to calculate distance
 * @param destination The destination location for which to calculate distance
 * @returns calculated distance in kilometers
 */
export function getLocationToEventDistance(
  source: CommonTypes.Location,
  destination: EventLocation
): CommonTypes.Distance {
  const accuracy = 1000;
  const degreePrecision = 1000;
  const KM = 1000;

  const KM_TO_DEGREES = 111.1949266;
  const dist: number = getDistance(
    { latitude: source.latitudeDegrees, longitude: source.longitudeDegrees },
    {
      latitude: destination.latitudeDegrees,
      longitude: destination.longitudeDegrees
    },
    accuracy
  );
  const kmDistance = dist / KM;
  // return distance as degrees and km
  return {
    degrees: Math.round((kmDistance / KM_TO_DEGREES) * degreePrecision) / degreePrecision,
    km: kmDistance
  };
}

/**
 * Calculate a location to event location azimuth
 *
 * @param source The source location for which to calculate azimuth
 * @param destination The destination location for which to calculate azimuth
 * @returns calculated distance in kilometers
 */
export function getLocationToLocationAzimuth(
  source: CommonTypes.Location,
  destination: EventLocation
): number {
  const origin = {
    latitude: source.latitudeDegrees,
    longitude: source.longitudeDegrees
  };
  const dest = {
    latitude: destination.latitudeDegrees,
    longitude: destination.longitudeDegrees
  };
  return getGreatCircleBearing(origin, dest);
}

// A function to explicitly set the memoization cache ID.
// This resolves an issue where the cache hitting a false positive
const memoizeRecordResolver = (source, destination) =>
  `${source.latitudeDegrees},${source.longitudeDegrees}; ${destination.latitudeDegrees},${destination.longitudeDegrees}`;

export const memoizedLocationToEventDistance = memoize(
  getLocationToEventDistance,
  memoizeRecordResolver
);

export const memoizedLocationToEventAzimuth = memoize(
  getLocationToLocationAzimuth,
  memoizeRecordResolver
);
