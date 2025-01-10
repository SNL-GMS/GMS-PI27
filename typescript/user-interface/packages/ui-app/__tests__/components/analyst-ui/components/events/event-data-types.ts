import { EventTypes } from '@gms/common-model';
import { Units } from '@gms/common-model/lib/common/types';
import { SECONDS_IN_HOUR } from '@gms/common-util';
import type {
  EventsFetchResult,
  FindEventStatusInfoByStageIdAndEventIdsQuery
} from '@gms/ui-state';

import { eventsStatusRecord } from './event-table-mock-data';

const eventId = 'eventID';
const hypothesisId = 'hypothesisID';
const locationSolutionId = 'locationSolutionID';
const workflowDefinitionId = { name: 'AL1', effectiveTime: 0 };

export const eventHypothesisId: EventTypes.EventHypothesisId = {
  eventId,
  hypothesisId
};

export const networkMagnitudeSolutionMB: EventTypes.NetworkMagnitudeSolution = {
  magnitude: { value: 1.2, standardDeviation: 0, units: Units.MAGNITUDE },
  magnitudeBehaviors: [],
  type: EventTypes.MagnitudeType.MB
};

export const location: EventTypes.EventLocation = {
  latitudeDegrees: 1.1,
  longitudeDegrees: 2.2,
  depthKm: 3.3,
  time: SECONDS_IN_HOUR
};

export const locationSolution: EventTypes.LocationSolution = {
  id: locationSolutionId,
  networkMagnitudeSolutions: [networkMagnitudeSolutionMB],
  featurePredictions: { featurePredictions: [] },
  locationBehaviors: [],
  location,
  locationRestraint: undefined
};

export const eventHypothesis: EventTypes.EventHypothesis = {
  id: eventHypothesisId,
  rejected: false,
  deleted: false,
  parentEventHypotheses: [],
  associatedSignalDetectionHypotheses: [
    {
      id: {
        id: 'associatedSignalDetectionHypothesesTestId',
        signalDetectionId: 'signalDetectionTestId'
      }
    }
  ],
  preferredLocationSolution: locationSolution,
  locationSolutions: [locationSolution]
};

export const preferredEventHypothesis: EventTypes.PreferredEventHypothesis = {
  preferredBy: 'preferredAnalyst',
  stage: workflowDefinitionId,
  preferred: { id: eventHypothesis.id }
};

export const rejectedEventHypothesis: EventTypes.EventHypothesis = {
  id: eventHypothesisId,
  rejected: true,
  deleted: false,
  parentEventHypotheses: [{ id: eventHypothesis.id }],
  associatedSignalDetectionHypotheses: [],
  preferredLocationSolution: null,
  locationSolutions: []
};

export const preferredEventHypothesisRejected: EventTypes.PreferredEventHypothesis = {
  preferredBy: 'preferredAnalyst',
  stage: workflowDefinitionId,
  preferred: { id: rejectedEventHypothesis.id }
};

export const event: EventTypes.Event = {
  id: eventId,
  rejectedSignalDetectionAssociations: [],
  monitoringOrganization: 'testOrg',
  overallPreferred: { id: eventHypothesis.id },
  eventHypotheses: [eventHypothesis],
  preferredEventHypothesisByStage: [preferredEventHypothesis],
  finalEventHypothesisHistory: []
};

export const rejectedEvent: EventTypes.Event = {
  id: eventId,
  rejectedSignalDetectionAssociations: [],
  monitoringOrganization: 'testOrg',
  overallPreferred: { id: rejectedEventHypothesis.id },
  eventHypotheses: [eventHypothesis, rejectedEventHypothesis],
  preferredEventHypothesisByStage: [preferredEventHypothesisRejected],
  finalEventHypothesisHistory: []
};

export const eventResults: EventsFetchResult = {
  fulfilled: 1,
  isError: false,
  isLoading: false,
  pending: 0,
  rejected: 0,
  data: [event]
};

export const eventStatusQuery: FindEventStatusInfoByStageIdAndEventIdsQuery = {
  isError: false,
  isFetching: false,
  isLoading: false,
  isSuccess: true,
  isUninitialized: true,
  currentData: undefined,
  data: eventsStatusRecord,
  endpointName: undefined,
  error: undefined,
  fulfilledTimeStamp: undefined,
  originalArgs: undefined,
  requestId: undefined,
  startedTimeStamp: undefined,
  status: undefined
};

export const eventResultsWithRejected: EventsFetchResult = {
  fulfilled: 1,
  isError: true,
  isLoading: false,
  pending: 0,
  rejected: 0,
  data: [event, rejectedEvent]
};
