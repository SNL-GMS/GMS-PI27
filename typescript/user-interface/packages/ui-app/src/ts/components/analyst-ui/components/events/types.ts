import type { EventTypes } from '@gms/common-model';
import type { CellRendererParams, Row } from '@gms/ui-core-components';
import type { ArrivalTime } from '@gms/ui-state';
import {
  DisplayedEventsConfigurationEnum,
  EventFilterDropdownOptions,
  EventsColumn
} from '@gms/ui-state';
import Immutable from 'immutable';
/**
 * Event Table generic CellRendererParams type
 */
export type EventTableCellRendererParams<T> = CellRendererParams<
  EventRow,
  unknown,
  T,
  unknown,
  unknown
>;

/**
 * used to match the display strings to values in the site table column picker dropdown
 */
export const eventColumnDisplayStrings: Immutable.Map<EventsColumn, string> = Immutable.Map<
  EventsColumn,
  string
>([
  [EventsColumn.unsavedChanges, 'Unsaved changes'],
  [EventsColumn.conflict, 'Conflict'],
  [EventsColumn.time, 'Time'],
  [EventsColumn.timeUncertainty, 'Time Std Deviation (s)'],
  [EventsColumn.latitudeDegrees, 'Lat (°)'],
  [EventsColumn.longitudeDegrees, 'Lon (°)'],
  [EventsColumn.depthKm, 'Depth (km)'],
  [EventsColumn.depthUncertainty, 'Depth Std Deviation (km)'],
  [EventsColumn.magnitudeMb, 'mb'],
  [EventsColumn.magnitudeMs, 'ms'],
  [EventsColumn.magnitudeMl, 'ml'],
  [EventsColumn.numberAssociated, '# Associated'],
  [EventsColumn.numberDefining, '# Defining'],
  [EventsColumn.observationsStandardDeviation, 'Sdobs'],
  [EventsColumn.coverageSemiMajorAxis, 'Coverage semi-major (km)'],
  [EventsColumn.coverageSemiMinorAxis, 'Coverage semi-minor (km)'],
  [EventsColumn.coverageSemiMajorTrend, 'Coverage semi-major trend (°)'],
  [EventsColumn.confidenceSemiMajorAxis, 'Confidence semi-major (km)'],
  [EventsColumn.confidenceSemiMinorAxis, 'Confidence semi-minor (km)'],
  [EventsColumn.confidenceSemiMajorTrend, 'Confidence semi-major trend (°)'],
  [EventsColumn.region, 'Region'],
  [EventsColumn.activeAnalysts, 'Active analysts'],
  [EventsColumn.preferred, 'Preferred in stage'],
  [EventsColumn.status, 'Workflow status'],
  [EventsColumn.deleted, 'Deleted'],
  [EventsColumn.rejected, 'Rejected']
]);

/**
 * Used to match the display strings to values in the events dropdown.
 */
export const displayedEventsDropdownDisplayStrings: Immutable.Map<
  DisplayedEventsConfigurationEnum,
  string
> = Immutable.Map<DisplayedEventsConfigurationEnum, string>([
  [DisplayedEventsConfigurationEnum.edgeEventsBeforeInterval, EventFilterDropdownOptions.BEFORE],
  [DisplayedEventsConfigurationEnum.edgeEventsAfterInterval, EventFilterDropdownOptions.AFTER],
  [DisplayedEventsConfigurationEnum.eventsCompleted, EventFilterDropdownOptions.COMPLETE],
  [DisplayedEventsConfigurationEnum.eventsRemaining, EventFilterDropdownOptions.REMAINING],
  [DisplayedEventsConfigurationEnum.eventsConflict, EventFilterDropdownOptions.CONFLICTS],
  [DisplayedEventsConfigurationEnum.eventsDeleted, EventFilterDropdownOptions.DELETED],
  [DisplayedEventsConfigurationEnum.eventsRejected, EventFilterDropdownOptions.REJECTED]
]);

export const displayedEventsLabelStrings: Immutable.Map<DisplayedEventsConfigurationEnum, string> =
  Immutable.Map<DisplayedEventsConfigurationEnum, string>([
    [DisplayedEventsConfigurationEnum.edgeEventsBeforeInterval, 'Edge Events'],
    [DisplayedEventsConfigurationEnum.eventsCompleted, 'Event Status']
  ]);

export const displayedEventsRenderDividers: Immutable.Map<
  DisplayedEventsConfigurationEnum,
  boolean
> = Immutable.Map<DisplayedEventsConfigurationEnum, boolean>([
  [DisplayedEventsConfigurationEnum.edgeEventsAfterInterval, true]
]);

/**
 * Enumerated
 *  - time types based on whether event or signal detection is within the interval or a before/after edge event
 *  - and Deleted or Rejected types
 */
export enum EventFilterOptions {
  BEFORE = 'Before',
  AFTER = 'After',
  INTERVAL = 'Interval',
  COMPLETE = 'Complete',
  DELETED = 'Deleted',
  CONFLICTS = 'Conflicts',
  REJECTED = 'Rejected'
}

export enum EventLifecycle {
  DELETED = 'Deleted',
  REJECTED = 'Rejected',
  ACTIVE = 'Active'
}

/**
 * Event row for event display.  Everything optional
 */
export interface EventRow extends Row {
  readonly id: string;
  readonly unsavedChanges: boolean;
  readonly eventFilterOptions: EventFilterOptions[];
  readonly isOpen: boolean;
  readonly conflict: boolean;
  readonly time: ArrivalTime;
  readonly latitudeDegrees: number;
  readonly longitudeDegrees: number;
  readonly depthKm: EventTypes.Depth;
  readonly region: string;
  readonly numberAssociated: number;
  readonly numberDefining: number;
  readonly observationsStandardDeviation?: number;
  readonly confidenceSemiMajorAxis?: number;
  readonly confidenceSemiMinorAxis?: number;
  readonly confidenceSemiMajorTrend?: number;
  readonly coverageSemiMajorAxis?: number;
  readonly coverageSemiMinorAxis?: number;
  readonly coverageSemiMajorTrend?: number;
  readonly magnitudeMb: number;
  readonly magnitudeMs: number;
  readonly magnitudeMl: number;
  readonly activeAnalysts: string[];
  readonly preferred: boolean;
  readonly status: EventTypes.EventStatus | null;
  readonly deleted: boolean;
  readonly rejected: boolean;
  readonly isActionTarget: boolean;
  readonly isUnqualifiedActionTarget: boolean;
}
