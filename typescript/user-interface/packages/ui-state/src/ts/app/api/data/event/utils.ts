import type { EventTypes, StationTypes, WorkflowTypes } from '@gms/common-model';
import {
  DepthRestraintReason,
  findPreferredEventHypothesisByOpenStageOrDefaultStage,
  findPreferredLocationSolution,
  RestraintType
} from '@gms/common-model/lib/event';
import type {
  FeatureMeasurement,
  SignalDetectionHypothesis
} from '@gms/common-model/lib/signal-detection';
import { findArrivalTimeFeatureMeasurement } from '@gms/common-model/lib/signal-detection/util';
import { epochSecondsNow, Logger, toEpochSeconds, uuid4 } from '@gms/common-util';
import type { WritableDraft } from 'immer/dist/internal';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';

import type { DataState } from '../types';

const logger = Logger.create('GMS_LOG_EVENTS', process.env.GMS_LOG_EVENTS);

export enum RejectOrDeleteAction {
  REJECT = 'reject',
  DELETE = 'delete'
}

/**
 * helper function to determine if a feature measurement exists using deep equality
 *
 * @param featureMeasurements List of feature measurements to check
 * @param featureMeasurement the feature measurement to check for
 * */
export const includesFeatureMeasurement = (
  featureMeasurements: FeatureMeasurement[],
  featureMeasurement: FeatureMeasurement
) =>
  featureMeasurements.find(fm => isEqual(fm?.channel, featureMeasurement?.channel)) !== undefined;

/**
 * Using a provided {@link EventTypes.EventHypothesis} as a base, creates a new hypothesis
 * with a new {@link EventTypes.LocationSolution} that is either rejected or deleted.
 *
 * @param event Event object to build the new hypothesis upon
 * @param originalEventHypothesis Event hypothesis to build the new hypothesis upon.\
 * @param action Reject or Delete
 * @return New {@link EventTypes.EventHypothesis} object that is either rejected or deleted
 */
function createRejectedOrDeletedEventHypothesis(
  event: EventTypes.Event,
  originalEventHypothesis: EventTypes.EventHypothesis,
  action: RejectOrDeleteAction
): EventTypes.EventHypothesis {
  // Create new location solution
  const originalPreferredLocationSolution = findPreferredLocationSolution(
    originalEventHypothesis.id.hypothesisId,
    event.eventHypotheses
  );

  if (!originalPreferredLocationSolution)
    throw new Error('Failed to find preferred location solution');

  const newLocationSolutions: EventTypes.LocationSolution = {
    id: uuid4(),
    networkMagnitudeSolutions: [],
    featurePredictions: {
      featurePredictions: []
    },
    locationBehaviors: [],
    location: cloneDeep(originalPreferredLocationSolution.location),
    locationRestraint: cloneDeep(originalPreferredLocationSolution.locationRestraint)
  };

  // Create new event hypothesis
  return {
    id: {
      eventId: event.id,
      hypothesisId: uuid4()
    },
    rejected: action === RejectOrDeleteAction.REJECT,
    deleted: action === RejectOrDeleteAction.DELETE,
    parentEventHypotheses: [{ id: cloneDeep(originalEventHypothesis.id) }],
    associatedSignalDetectionHypotheses: [],
    locationSolutions: [newLocationSolutions],
    preferredLocationSolution: {
      id: newLocationSolutions.id
    },
    _uiHasUnsavedChanges: epochSecondsNow()
  };
}

/**
 * !This function should only be used within a Redux Reducer
 *
 * Given an array of EventIds, this function updates each corresponding {@link EventTypes.Event} to be
 * deleted or rejected.
 *
 * @param state Mutable Redux state
 * @param eventIds IDs of events to be rejected/deleted
 * @param stageId StageID for the currently open interval
 * @param username Active user
 * @param openIntervalName eg; AL1, AL2, Auto Network
 * @param action Reject or Delete
 */
export function rejectOrDeleteEvent(
  state: WritableDraft<DataState>,
  eventIds: string[],
  stageId: WorkflowTypes.IntervalId,
  username: string,
  openIntervalName: string,
  action: RejectOrDeleteAction
) {
  eventIds.forEach(eventID => {
    const event = state.events[eventID];

    const preferredEventHypothesisByStage = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      event,
      openIntervalName
    );

    // don't allow deleting or rejecting an event which is already deleted or rejected
    if (
      !preferredEventHypothesisByStage ||
      preferredEventHypothesisByStage.deleted ||
      preferredEventHypothesisByStage.rejected
    )
      return;

    // create the new event hypo with the appropriate rejected/deleted attribute
    const newEventHypothesis = createRejectedOrDeletedEventHypothesis(
      event,
      preferredEventHypothesisByStage,
      action
    );

    // Update the collection to contain an entry for the new EventHypothesis.
    event.eventHypotheses.push(newEventHypothesis);

    preferredEventHypothesisByStage.associatedSignalDetectionHypotheses.forEach(sd => {
      const sdToUpdate = state.signalDetections[sd.id.signalDetectionId];
      if (sdToUpdate) {
        sdToUpdate._uiHasUnsavedEventSdhAssociation = epochSecondsNow();
      } else {
        logger.error(
          `No signal detection found with an ID of ${sd.id.signalDetectionId}. Cannot set _uiHasUnsavedEventSdhAssociation.`
        );
      }
    });

    const newEventHypothesisIdOnly = { id: cloneDeep(newEventHypothesis.id) };

    // event.preferredEventHypothesisByStage[0].stage.name
    const existingPreferred = event.preferredEventHypothesisByStage.find(
      hypo => hypo.stage.name === stageId.definitionId.name
    );
    // if the preferredEventHypothesisByStage exists with the same stage name, update that one
    if (existingPreferred) {
      existingPreferred.stage = stageId.definitionId;
      existingPreferred.preferredBy = username;
      existingPreferred.preferred = newEventHypothesisIdOnly;
    } else {
      // otherwise add a new one to the array
      event.preferredEventHypothesisByStage.push({
        stage: stageId.definitionId, // Assign to the WorkflowDefinitionId for the Analyst's current Stage.
        preferredBy: username, // The Analyst's identifier
        preferred: newEventHypothesisIdOnly // Assign to an id-only instance of the new EventHypothesis
      });
    }

    // Update the event's overall preferred with an id-only instance of the newEventHypothesis
    event.overallPreferred = newEventHypothesisIdOnly; // Assign to an id-only instance of the new EventHypothesis.
    // Add an id-only instance of the new EventHypothesis to the end of the collection.
    event.finalEventHypothesisHistory.push(newEventHypothesisIdOnly);
    event._uiHasUnsavedChanges = epochSecondsNow();
  });
}

/**
 * !This function should only be used within a Redux Reducer
 *
 * Given a list of {@link SignalDetectionHypothesis} objects and a list of
 * {@link StationTypes.Station} objects, this function creates a new
 * {@link EventTypes.EventHypothesis} structured for a completely new
 * {@link EventTypes.Event}
 *
 * @returns EventHypothesis built according to the standards for a new Event
 */
export function createEventHypothesisForNewEvent(
  eventId: string,
  currentSdHypotheses: WritableDraft<SignalDetectionHypothesis>[],
  stations: StationTypes.Station[]
): EventTypes.EventHypothesis {
  /** Sorted by arrivalTimeFeatureMeasurement earliest -> latest */
  const sortedCurrentSdHypotheses = sortBy(currentSdHypotheses, sdHypo => {
    const fm = findArrivalTimeFeatureMeasurement(sdHypo.featureMeasurements);
    return fm?.measurementValue.arrivalTime.value;
  });

  const locationStation = stations.find(
    station => station.name === sortedCurrentSdHypotheses[0].station.name
  );

  if (!locationStation) throw new Error('Failed to find location station');

  let time;
  const arrivalTimeFm = findArrivalTimeFeatureMeasurement(
    sortedCurrentSdHypotheses[0].featureMeasurements
  );

  if (arrivalTimeFm) {
    time = arrivalTimeFm.measurementValue.arrivalTime.value;
  }

  const newLocation: EventTypes.EventLocation = {
    latitudeDegrees: locationStation.location.latitudeDegrees,
    longitudeDegrees: locationStation.location.longitudeDegrees,
    depthKm: 0.0,
    time
  };

  /** Create new LocationSolution */
  const newLocationSolution: EventTypes.LocationSolution = {
    id: uuid4(),
    locationUncertainty: undefined,
    networkMagnitudeSolutions: [],
    featurePredictions: {
      featurePredictions: []
    },
    locationBehaviors: sortedCurrentSdHypotheses.map<EventTypes.LocationBehavior>(sdHypo => {
      const measurement = findArrivalTimeFeatureMeasurement(sdHypo.featureMeasurements);
      if (!measurement) throw new Error('Failed to find arrival time FM');
      return {
        residual: undefined,
        weight: undefined,
        defining: true,
        prediction: undefined,
        measurement
      };
    }),
    location: newLocation,
    locationRestraint: {
      depthRestraintType: RestraintType.FIXED,
      depthRestraintReason: DepthRestraintReason.OTHER,
      depthRestraintKm: newLocation.depthKm,
      positionRestraintType: RestraintType.FIXED,
      latitudeRestraintDegrees: newLocation.latitudeDegrees,
      longitudeRestraintDegrees: newLocation.longitudeDegrees,
      timeRestraintType: RestraintType.FIXED,
      timeRestraint: newLocation.time
    }
  };

  /** Create new EventHypothesis */
  const newEventHypothesis: EventTypes.EventHypothesis = {
    id: {
      eventId,
      hypothesisId: uuid4()
    },
    // Empty collection
    parentEventHypotheses: [],
    deleted: false,
    rejected: false,
    // Collection of id-only instances of each SDHypothesis
    associatedSignalDetectionHypotheses: currentSdHypotheses.map(sdHypo => ({ id: sdHypo.id })),
    // Collection with single entry,
    locationSolutions: [newLocationSolution],
    preferredLocationSolution: { id: newLocationSolution.id },
    _uiHasUnsavedChanges: epochSecondsNow()
  };

  return newEventHypothesis;
}

/**
 * !This function should only be used within a Redux Reducer
 *
 * Creates a new {@link EventTypes.EventHypothesis} structured for a new
 * "virtual" {@link EventTypes.Event} that is not associated to any signal detections.
 *
 * @returns EventHypothesis built according to the standards for a virtual event
 */
export function createEventHypothesisForNewVirtualEvent(
  eventId: string,
  eventDate: Date,
  latitudeDegrees: number,
  longitudeDegrees: number,
  depthKm: number
) {
  const newLocation: EventTypes.EventLocation = {
    latitudeDegrees,
    longitudeDegrees,
    depthKm,
    time: toEpochSeconds(eventDate.toISOString())
  };

  /** Create new LocationSolution */
  const newLocationSolution: EventTypes.LocationSolution = {
    id: uuid4(),
    locationUncertainty: undefined,
    networkMagnitudeSolutions: [],
    featurePredictions: {
      featurePredictions: []
    },
    // Empty collection
    locationBehaviors: [],
    location: newLocation,
    locationRestraint: {
      depthRestraintType: RestraintType.FIXED,
      depthRestraintReason: DepthRestraintReason.FIXED_BY_ANALYST,
      depthRestraintKm: newLocation.depthKm,
      positionRestraintType: RestraintType.FIXED,
      latitudeRestraintDegrees: newLocation.latitudeDegrees,
      longitudeRestraintDegrees: newLocation.longitudeDegrees,
      timeRestraintType: RestraintType.FIXED,
      timeRestraint: newLocation.time
    }
  };

  const newEventHypothesis: EventTypes.EventHypothesis = {
    id: {
      eventId,
      hypothesisId: uuid4()
    },
    // Empty collection
    parentEventHypotheses: [],
    deleted: false,
    rejected: false,
    // Empty collection
    associatedSignalDetectionHypotheses: [],
    // Collection with single entry,
    locationSolutions: [newLocationSolution],
    preferredLocationSolution: { id: newLocationSolution.id },
    _uiHasUnsavedChanges: epochSecondsNow()
  };

  return newEventHypothesis;
}
