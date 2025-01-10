/**
 * Enumerated column names for the event table
 */
export enum EventsColumn {
  unsavedChanges = 'unsavedChanges',
  conflict = 'conflict',
  time = 'time',
  timeUncertainty = 'timeUncertainty',
  latitudeDegrees = 'latitudeDegrees',
  longitudeDegrees = 'longitudeDegrees',
  depthKm = 'depthKm',
  depthUncertainty = 'depthUncertainty',
  magnitudeMb = 'magnitudeMb',
  magnitudeMs = 'magnitudeMs',
  magnitudeMl = 'magnitudeMl',
  numberAssociated = 'numberAssociated',
  numberDefining = 'numberDefining',
  observationsStandardDeviation = 'observationsStandardDeviation',
  coverageSemiMajorAxis = 'coverageSemiMajorAxis',
  coverageSemiMinorAxis = 'coverageSemiMinorAxis',
  coverageSemiMajorTrend = 'coverageSemiMajorTrend',
  confidenceSemiMajorAxis = 'confidenceSemiMajorAxis',
  confidenceSemiMinorAxis = 'confidenceSemiMinorAxis',
  confidenceSemiMajorTrend = 'confidenceSemiMajorTrend',
  region = 'region',
  activeAnalysts = 'activeAnalysts',
  preferred = 'preferred',
  status = 'status',
  rejected = 'rejected',
  deleted = 'deleted'
}

/**
 * Displayed events configuration options
 */
export enum DisplayedEventsConfigurationEnum {
  edgeEventsBeforeInterval = 'edgeEventsBeforeInterval',
  edgeEventsAfterInterval = 'edgeEventsAfterInterval',
  eventsCompleted = 'eventsCompleted',
  eventsRemaining = 'eventsRemaining',
  eventsConflict = 'eventsConflict',
  eventsDeleted = 'eventsDeleted',
  eventsRejected = 'eventsRejected'
}

/**
 * Enumerated event filter options for the event table
 */
export enum EventFilterDropdownOptions {
  BEFORE = 'Edge events before interval',
  AFTER = 'Edge events after interval',
  COMPLETE = 'Complete',
  REMAINING = 'Remaining',
  CONFLICTS = 'Conflicts',
  DELETED = 'Deleted',
  REJECTED = 'Rejected'
}

export interface EventsState {
  eventsColumns: Record<EventsColumn, boolean>;
  displayedEventsConfiguration: Record<DisplayedEventsConfigurationEnum, boolean>;
}
