import { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import type { AssociationConflictRecord } from '@gms/ui-state';

import type { ConflictedEventInfo, ConflictedSDInfo } from '../tooltips/conflicts-tooltip-content';

/**
 * Given two objects with a `time` property, sort them in chronological order.
 */
export function sortByTimeChronological(a: { time: number }, b: { time: number }) {
  if (a.time < b.time) return -1;
  if (a.time > b.time) return 1;
  return 0;
}

/**
 *
 * @param allSignalDetectionsInInterval
 * @param allEventsInInterval
 * @param allConflicts
 * @param openIntervalName
 * @param currentEventId
 * @returns the array of signal detections with conflicts associated to the input event
 */
export const getConflictedSDsForEvent = (
  allSignalDetectionsInInterval: SignalDetectionTypes.SignalDetection[],
  allEventsInInterval: EventTypes.Event[],
  allConflicts: AssociationConflictRecord,
  openIntervalName: string,
  currentEventId: string
): ConflictedSDInfo[] => {
  // current event of the row
  const currentEvent: EventTypes.Event = allEventsInInterval?.find(ev => ev.id === currentEventId);
  if (!currentEvent) return [];

  let currentEventHypothesis: EventTypes.EventHypothesis =
    EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
      currentEvent,
      openIntervalName
    );
  if (currentEventHypothesis?.preferredLocationSolution === undefined) {
    currentEventHypothesis = EventTypes.findEventHypothesisParent(
      currentEvent,
      currentEventHypothesis
    );
  }

  const currentEventAssociatedSDIds: string[] =
    currentEventHypothesis?.associatedSignalDetectionHypotheses.map(
      sd => sd.id.signalDetectionId
    ) || [];

  // filter the array to only have sd id's that are associated to the current event
  const associatedSDIdsWithConflicts: string[] =
    currentEventAssociatedSDIds.length > 0
      ? Object.keys(allConflicts).filter(sdid => currentEventAssociatedSDIds.includes(sdid))
      : [];

  const sdConflicts =
    associatedSDIdsWithConflicts.length > 0
      ? allSignalDetectionsInInterval
          ?.filter(sd => associatedSDIdsWithConflicts.includes(sd.id)) // only the sd's associated to the current event with conflicts
          .map<ConflictedSDInfo>(sd => {
            const sdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
              sd.signalDetectionHypotheses
            );
            const sdTime: number = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
              sdHypothesis.featureMeasurements
            )?.arrivalTime?.value;
            const sdPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
              sdHypothesis.featureMeasurements
            )?.value;

            return { station: sd.station.name, phase: sdPhase, time: sdTime };
          })
      : [];

  if (sdConflicts?.length > 1) {
    sdConflicts.sort(sortByTimeChronological);
  }
  return sdConflicts;
};

/**
 * @param allEventsInInterval
 * @param allConflicts
 * @param openIntervalName
 * @param currentSDId
 * @returns the array of events with conflicts because the input SD is signal detections with conflicts associated to the input event
 */
export const getConflictedEventsForSD = (
  allEventsInInterval: EventTypes.Event[],
  allConflicts: AssociationConflictRecord,
  openIntervalName: string,
  currentSDId: string
): ConflictedEventInfo[] => {
  const eventConflicts =
    allConflicts[currentSDId]?.eventHypothesisIds
      .map<ConflictedEventInfo>(ev => {
        const currentEvent = allEventsInInterval?.find(evt => evt.id === ev.eventId);
        if (!currentEvent) return undefined;

        let currentEventHypothesis: EventTypes.EventHypothesis =
          EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
            currentEvent,
            openIntervalName
          );

        // If no preferredHypothesis then default to the parent hypothesis
        if (
          currentEventHypothesis === undefined ||
          currentEventHypothesis.preferredLocationSolution === undefined
        ) {
          currentEventHypothesis = EventTypes.findEventHypothesisParent(
            currentEvent,
            currentEventHypothesis
          );
        }

        if (currentEventHypothesis) {
          const locationSolution = EventTypes.findPreferredLocationSolution(
            currentEventHypothesis.id.hypothesisId,
            currentEvent.eventHypotheses
          );
          return { time: locationSolution?.location?.time };
        }
        return undefined;
      })
      .filter(notEmpty) || [];

  if (eventConflicts?.length > 1) {
    eventConflicts.sort(sortByTimeChronological);
  }
  return eventConflicts;
};
