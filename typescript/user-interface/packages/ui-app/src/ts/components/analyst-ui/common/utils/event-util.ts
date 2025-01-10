import type { ChannelTypes, CommonTypes, LegacyEventTypes, StationTypes } from '@gms/common-model';
import { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import {
  memoizedLocationToEventAzimuth,
  memoizedLocationToEventDistance
} from '@gms/common-model/lib/event/util';
import { getCurrentHypothesis } from '@gms/common-model/lib/signal-detection/util';
import type { EventStatus } from '@gms/ui-state';
import flatMap from 'lodash/flatMap';

import { userPreferences } from '~analyst-ui/config/user-preferences';

/**
 * Return a list of preferred EventHypotheses associated with the detection or an empty list
 *
 * @param detection signal detection to check event association against
 * @param events list of {@link EventTypes.Event} objects to search through
 * @param openIntervalName eg; Auto Network, AL1, AL2
 * @return list of {@link EventTypes.EventHypothesis}
 */
export function findEventHypothesesForDetection(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  openIntervalName: string
): EventTypes.EventHypothesis[] {
  if (
    events &&
    detection?.signalDetectionHypotheses &&
    detection?.signalDetectionHypotheses?.length > 0
  ) {
    const allPreferredEventHypotheses = events.map(evt =>
      findPreferredEventHypothesisByOpenStageOrDefaultStage(evt, openIntervalName)
    );
    // If the event has the detection in its associated signal detection
    return flatMap(allPreferredEventHypotheses).filter(
      eventHypothesis =>
        eventHypothesis?.associatedSignalDetectionHypotheses.find(
          sdHypo =>
            sdHypo.id.id ===
            SignalDetectionTypes.Util.getCurrentHypothesis(detection.signalDetectionHypotheses).id
              .id
        )
    );
  }
  return [];
}

/**
 * Gets the distance and azimuth to all stations and channels for the given location solution id
 *
 * @param event event with a preferred location solution
 * @param stations array of stations to calculated distances for
 * @param openStageName string name of the open stage in order to find the preferred hypothesis
 */
export function getDistanceToStationsForPreferredLocationSolutionId(
  event: EventTypes.Event | undefined,
  stations: StationTypes.Station[],
  openStageName: string,
  allChannels: ChannelTypes.Channel[]
): EventTypes.LocationDistance[] {
  if (!event) {
    return [];
  }
  const distances: EventTypes.LocationDistance[] = [];

  const preferredEventHypothesisByStage = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    event,
    openStageName
  );

  if (preferredEventHypothesisByStage) {
    const locationSolution = EventTypes.findPreferredLocationSolution(
      preferredEventHypothesisByStage.id.hypothesisId,
      event.eventHypotheses
    );
    if (stations && locationSolution) {
      stations.forEach(station => {
        distances.push({
          azimuth: memoizedLocationToEventAzimuth(station.location, locationSolution.location),
          distance: memoizedLocationToEventDistance(station.location, locationSolution.location),
          id: station.name
        });
        if (allChannels.length > 0) {
          station.allRawChannels.forEach(channel => {
            const fullChannel = allChannels.find(c => channel.name === c.name);
            if (fullChannel !== undefined) {
              distances.push({
                azimuth: memoizedLocationToEventAzimuth(
                  station.location,
                  locationSolution.location
                ),
                distance: memoizedLocationToEventDistance(
                  fullChannel.location,
                  locationSolution.location
                ),
                id: fullChannel.name
              });
            }
          });
        }
      });
    }
  }
  return distances;
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
 * Determine if a signal detection is complete.
 *
 * @param detection signal detection to check event association against
 * @param events list of {@link EventTypes.Event} objects to search through
 * @param eventsStatuses record of {@link EventStatus} objects
 * @param openIntervalName eg; Auto Network, AL1, AL2
 * @returns boolean
 */
export function isSignalDetectionCompleteAssociated(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  eventsStatuses: Record<string, EventStatus>,
  openIntervalName: string
): boolean {
  if (!events) {
    return false;
  }
  const associatedEventIds = findEventHypothesesForDetection(
    detection,
    events,
    openIntervalName
  ).map(hypo => hypo.id.eventId);
  let isComplete = false;
  events.forEach(event => {
    isComplete =
      isComplete ||
      (associatedEventIds.find(id => event.id === id) !== undefined &&
        eventsStatuses &&
        eventsStatuses[event.id] !== undefined &&
        eventsStatuses[event.id] !== null &&
        eventsStatuses[event.id].eventStatusInfo.eventStatus === EventTypes.EventStatus.COMPLETE);
  });
  return isComplete;
}

/**
 * Search the events if an association is found to an event (but not the currently open event)
 * then return true
 *
 * @param detection signal detection to check event association against
 * @param events list of {@link EventTypes.Event} objects to search through
 * @param currentOpenEventId
 * @param openIntervalName eg; Auto Network, AL1, AL2
 * @return boolean
 */
export function isSignalDetectionOtherAssociated(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  currentOpenEventId: string,
  openIntervalName: string
): boolean {
  // If any of the events has the detection in it's associated signal detection
  if (events) {
    const associatedEventHypo = findEventHypothesesForDetection(
      detection,
      events,
      openIntervalName
    );
    return associatedEventHypo.find(assoc => assoc.id.eventId !== currentOpenEventId) !== undefined;
  }
  return false;
}

/**
 * Search the events if an association is found to an event (but not the currently open event)
 * then return true
 *
 * @param detection signal detection to check event association against
 * @param events list of {@link EventTypes.Event} objects to search through
 * @param openIntervalName eg; Auto Network, AL1, AL2
 * @return boolean
 */
export function isSignalDetectionAssociated(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  openIntervalName: string
): boolean {
  // If any of the events has the detection in it's associated signal detection
  if (events) {
    const associatedEventHypo = findEventHypothesesForDetection(
      detection,
      events,
      openIntervalName
    );
    return associatedEventHypo.length > 0;
  }
  return false;
}

/**
 * Find all signal detections associated to the event
 *
 * @param event openEvent
 * @param signalDetections all signal detections
 * @returns associated signal detections
 */
export const getAssociatedDetections = (
  event: EventTypes.Event | undefined,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  openIntervalName: string
): SignalDetectionTypes.SignalDetection[] => {
  if (event) {
    return signalDetections.filter(
      sd =>
        sd &&
        isSignalDetectionOpenAssociated(sd, [event], event.id, openIntervalName) &&
        !SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).deleted
    );
  }
  return [];
};

/**
 * Returns a CONST string representing the provided signal detection association status
 */
export function getSignalDetectionStatus(
  signalDetection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  openEventId: string,
  eventsStatuses: Record<string, EventStatus>,
  openIntervalName: string
): SignalDetectionTypes.SignalDetectionStatus {
  const sdHyp = SignalDetectionTypes.Util.getCurrentHypothesis(
    signalDetection?.signalDetectionHypotheses
  );
  if (sdHyp && sdHyp.deleted) {
    return SignalDetectionTypes.SignalDetectionStatus.DELETED;
  }
  if (isSignalDetectionOpenAssociated(signalDetection, events, openEventId, openIntervalName)) {
    return SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED;
  }
  // determine if associated to a complete event
  if (
    isSignalDetectionCompleteAssociated(signalDetection, events, eventsStatuses, openIntervalName)
  ) {
    return SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED;
  }
  // determine if associated to another event
  if (isSignalDetectionOtherAssociated(signalDetection, events, openEventId, openIntervalName)) {
    return SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED;
  }
  // else it is unassociated
  return SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED;
}

/**
 * Returns a list of signal detection association statuses and their signal detection id
 */
export function getSignalDetectionStatuses(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  events: EventTypes.Event[],
  openEventId: string,
  eventsStatuses: Record<string, EventStatus>,
  openIntervalName: string
): SignalDetectionTypes.SignalDetectionAssociationStatus[] {
  return signalDetections.map(sd => {
    const sdAssociation: SignalDetectionTypes.SignalDetectionAssociationStatus = {
      signalDetectionId: sd.id,
      associationStatus: getSignalDetectionStatus(
        sd,
        events,
        openEventId,
        eventsStatuses,
        openIntervalName
      )
    };
    return sdAssociation;
  });
}
/**
 * Checks if a given {@link SignalDetectionTypes.SignalDetectionHypothesis} is
 * associated with a given {@link EventTypes.EventHypothesis}.
 *
 * @returns true if associated, false otherwise.
 */
export function isSdHypothesisAssociatedToEventHypothesis(
  sdHypothesis: SignalDetectionTypes.SignalDetectionHypothesisFaceted,
  eventHypothesis: EventTypes.EventHypothesis
) {
  let isAssociated = false;
  if (!eventHypothesis || !sdHypothesis) return isAssociated;

  eventHypothesis.associatedSignalDetectionHypotheses.forEach(sdAssoc => {
    if (sdAssoc.id.id === sdHypothesis.id.id) isAssociated = true;
  });

  return isAssociated;
}

/**
 * Returns distance based on distance units
 *
 * @returns distance in degrees or km
 */
export function getDistanceUsingDistanceUnits(
  distance: CommonTypes.Distance | undefined,
  distanceUnits: CommonTypes.DistanceUnits
): number {
  if (!distance) {
    return 0;
  }
  return distanceUnits === 'degrees' ? distance.degrees : distance.km;
}

/* LegacyEvent Methods
 * Methods below are saved for use in legacy components
 */

/**
 * Get the current open event using the legacy COI to maintain legacy code build
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param openEventId Id of open event
 * @param events the events
 */
export function getLegacyOpenEvent(
  openEventId: string | undefined,
  events: LegacyEventTypes.Event[]
): LegacyEventTypes.Event | undefined {
  const event =
    openEventId && events && events.length > 0 ? events.find(e => e.id === openEventId) : undefined;
  return event && event.currentEventHypothesis && event.currentEventHypothesis.eventHypothesis
    ? event
    : undefined;
}

/**
 * Gets the signal detections associated to the given event
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param event the open even to get sd's for
 * @param signalDetections signalDetections to look through
 */
export function getAssocSdsLegacy(
  event: LegacyEventTypes.Event,
  signalDetections: SignalDetectionTypes.SignalDetection[]
): SignalDetectionTypes.SignalDetection[] {
  return event && event.currentEventHypothesis && event.currentEventHypothesis.eventHypothesis
    ? flatMap(event.currentEventHypothesis.eventHypothesis.signalDetectionAssociations, assocSD => {
        const maybeSD = signalDetections.find(
          sd =>
            assocSD.signalDetectionHypothesis.id ===
              SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).id.id &&
            !assocSD.deleted
        );
        if (maybeSD) {
          return maybeSD;
        }
        return undefined;
      }).filter(notEmpty)
    : [];
}

/**
 * Returns the latest location solution set for the provided event.
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param event an event
 */
export function getLatestLocationSolutionSetLegacy(
  event: LegacyEventTypes.Event
): LegacyEventTypes.LocationSolutionSet | undefined {
  return event && event.currentEventHypothesis && event.currentEventHypothesis.eventHypothesis
    ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
      getLatestLocationSolutionSetForEventHypothesisLegacy(
        event.currentEventHypothesis.eventHypothesis
      )
    : undefined;
}

/**
 * Returns the latest location solution set for the provided event hypothesis.
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param eventHypothesis an event hypothesis
 */
export function getLatestLocationSolutionSetForEventHypothesisLegacy(
  eventHypothesis: LegacyEventTypes.EventHypothesis
): LegacyEventTypes.LocationSolutionSet {
  return eventHypothesis &&
    eventHypothesis.locationSolutionSets &&
    eventHypothesis.locationSolutionSets.length > 0
    ? eventHypothesis.locationSolutionSets.reduce((prev, curr) => {
        if (curr.count > prev.count) {
          return curr;
        }
        return prev;
      }, eventHypothesis.locationSolutionSets[0])
    : undefined;
}

/**
 * Gets the default preferred location id for an event based off the config
 * Or if not found returns the id for the preferred location solution
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param locationSolutionSet Location Solution Set to  get default preferred location solution from
 */
export function getPreferredDefaultLocationIdLegacy(
  locationSolutionSet: LegacyEventTypes.LocationSolutionSet
): string | undefined {
  if (!locationSolutionSet.locationSolutions || locationSolutionSet.locationSolutions.length < 1) {
    return undefined;
  }

  let toReturn: string;
  // A for loop is used so we can break
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (
    let i = 0;
    i < userPreferences.location.preferredLocationSolutionRestraintOrder.length;
    // eslint-disable-next-line no-plusplus
    i++
  ) {
    const dr = userPreferences.location.preferredLocationSolutionRestraintOrder[i];
    const maybeLS = locationSolutionSet.locationSolutions.find(
      ls => ls.locationRestraint.depthRestraintType === dr
    );
    if (maybeLS) {
      toReturn = maybeLS.id;
      break;
    }
  }
  if (toReturn) {
    return toReturn;
  }
  return locationSolutionSet[0].id;
}

/**
 * Gets the default preferred location id for an event based off the config
 * Or if not found returns the id for the preferred location solution
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param eventHypothesis Event hypothesis to get default preferred location solution from
 */
export function getPreferredLocationSolutionIdFromEventHypothesisLegacy(
  eventHypothesis: LegacyEventTypes.EventHypothesis
): string {
  if (!eventHypothesis.locationSolutionSets || eventHypothesis.locationSolutionSets.length < 1) {
    return undefined;
  }
  const set = getLatestLocationSolutionSetForEventHypothesisLegacy(eventHypothesis);
  return getPreferredDefaultLocationIdLegacy(set);
}

/**
 * Gets the distance to all stations for the given location solution id
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param event event with location solution
 * @param locationSolutionId location solution id
 */
export function getDistanceToStationsForLocationSolutionIdLegacy(
  event: LegacyEventTypes.Event,
  locationSolutionId: string
): LegacyEventTypes.LocationToStationDistance[] {
  if (!event) {
    return [];
  }
  const locationSolutions = flatMap(
    event.currentEventHypothesis.eventHypothesis.locationSolutionSets,
    lss => lss.locationSolutions
  );
  const maybeLs = locationSolutions.find(ls => ls.id === locationSolutionId);
  if (maybeLs) {
    return maybeLs.locationToStationDistances;
  }
  return event.currentEventHypothesis.eventHypothesis.preferredLocationSolution.locationSolution
    .locationToStationDistances;
}

/**
 * Checks if event hypothesis has changed or if the number of location solution sets has changed
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param event current props event
 * @param prevEvent previous props event
 *
 * @returns boolean if changes have occurred
 */
export function shouldUpdateSelectedLocationSolutionLegacy(
  prevEvent: LegacyEventTypes.Event,
  event: LegacyEventTypes.Event
): boolean {
  return (
    prevEvent.currentEventHypothesis.eventHypothesis.id !==
      event.currentEventHypothesis.eventHypothesis.id ||
    prevEvent.currentEventHypothesis.eventHypothesis.locationSolutionSets.length !==
      event.currentEventHypothesis.eventHypothesis.locationSolutionSets.length
  );
}

/**
 * Search the associated event hypothesis for one pointing at the open event id,
 * else return first in list or undefined
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param detection signal detection
 * @return EventHypothesis | undefined
 */
export function findEventHypothesisForDetectionLegacy(
  detection: SignalDetectionTypes.SignalDetection,
  events: LegacyEventTypes.Event[]
): LegacyEventTypes.EventHypothesis[] {
  if (events) {
    // If the event has the detection in it's associated signal detection
    return flatMap(events.map(evt => evt.currentEventHypothesis.eventHypothesis)).filter(event =>
      event.signalDetectionAssociations.find(
        assoc =>
          assoc.signalDetectionHypothesis.id ===
          SignalDetectionTypes.Util.getCurrentHypothesis(detection.signalDetectionHypotheses).id.id
      )
    );
  }
  return [];
}

/**
 * Determine if a signal detection is associated to an event.
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param detection signal detection
 * @returns boolean
 */
export function determineIfAssociatedLegacy(
  detection: SignalDetectionTypes.SignalDetection,
  events: LegacyEventTypes.Event[],
  currentOpenEventId: string
): boolean {
  if (!currentOpenEventId || !events) {
    return false;
  }
  const associatedEventHypo = findEventHypothesisForDetectionLegacy(detection, events);
  return (
    associatedEventHypo.find(assoc => assoc.event.id === currentOpenEventId && !assoc.rejected) !==
    undefined
  );
}

/**
 * Determine if a signal detection is complete.
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param detection signal detection
 * @returns boolean
 */
export function determineIfCompleteLegacy(
  detection: SignalDetectionTypes.SignalDetection,
  events: LegacyEventTypes.Event[]
): boolean {
  if (!events) {
    return false;
  }
  const associatedEventHypos = findEventHypothesisForDetectionLegacy(detection, events);
  let isComplete = false;
  associatedEventHypos.forEach(assocEvent => {
    isComplete = isComplete || assocEvent.event.status === 'Complete';
  });
  return isComplete;
}

/**
 * Search the events if no event association is found then the SD is unassociated
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param detection signal detection
 * @param events The events in time range
 * @return boolean
 */
export function isSignalDetectionUnassociatedLegacy(
  detection: SignalDetectionTypes.SignalDetection,
  events: LegacyEventTypes.Event[]
): boolean {
  // If any of the events has the detection in it's associated signal detection
  if (events) {
    // Look through the event's signalDetectionAssociations to find a reference to the SD Hypo
    return (
      events.find(
        event =>
          event.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.find(
            assoc =>
              assoc.signalDetectionHypothesis.id ===
              SignalDetectionTypes.Util.getCurrentHypothesis(detection.signalDetectionHypotheses).id
                .id
          ) !== undefined
      ) === undefined
    );
  }
  return true;
}

/**
 * Search the events if an association is found to an event (but not the currently open event)
 * then return true
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param detection signal detection
 * @param events The events in time range
 * @return boolean
 */
export function isSignalDetectionOtherAssociatedLegacy(
  detection: SignalDetectionTypes.SignalDetection,
  events: LegacyEventTypes.Event[],
  currentOpenEventId: string
): boolean {
  // If any of the events has the detection in it's associated signal detection
  if (events) {
    // Look through the event's signalDetectionAssociations to find a reference to the SD Hypo
    return (
      events.find(
        event =>
          event.id !== currentOpenEventId &&
          event.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.find(
            assoc =>
              assoc.signalDetectionHypothesis.id ===
              SignalDetectionTypes.Util.getCurrentHypothesis(detection.signalDetectionHypotheses).id
                .id
          ) !== undefined
      ) !== undefined
    );
  }
  return false;
}

/**
 * Returns true if te provided signal detection hypothesis is associated
 * to the provided event; false otherwise.
 *
 * @deprecated: This needs to be redone with the new COI but is currently used in legacy components
 *
 * @param sdHypothesis the signal detection hypothesis to check
 * @param event the event to check association status
 * @returns true if the signal detection hypothesis is associated
 * to the provided event; false otherwise.
 */
export function isAssociatedToCurrentEventHypothesisLegacy(
  sdHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
  event: LegacyEventTypes.Event
): boolean {
  if (!event) {
    return false;
  }
  let isAssociated = false;
  event.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.forEach(sdAssoc => {
    if (sdAssoc.signalDetectionHypothesis.id === sdHypothesis.id.id && !sdAssoc.deleted) {
      isAssociated = true;
    }
  });
  return isAssociated;
}
