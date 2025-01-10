import type { SignalDetectionTypes } from '@gms/common-model';
import type GoldenLayout from '@gms/golden-layout';
import type { Row } from '@gms/ui-core-components';
import type {
  ArrivalTime,
  SignalDetectionFetchResult,
  StationGroupsByNamesQuery
} from '@gms/ui-state';
import { DisplayedSignalDetectionConfigurationEnum, SignalDetectionColumn } from '@gms/ui-state';
import Immutable from 'immutable';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import { messageConfig } from '~analyst-ui/config/message-config';

import type {
  SignalDetectionCountEntry,
  SignalDetectionCountFilterOptions
} from './toolbar/signal-detection-count-toolbar-item';

export interface SignalDetectionsComponentProps {
  glContainer?: GoldenLayout.Container;
}

export interface SignalDetectionsToolbarProps {
  readonly countEntryRecord: Record<SignalDetectionCountFilterOptions, SignalDetectionCountEntry>;
  setSelectedSDColumnsToDisplay: (args: Immutable.Map<SignalDetectionColumn, boolean>) => void;
  selectedSDColumnsToDisplay: Immutable.Map<SignalDetectionColumn, boolean>;
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
}

export interface SignalDetectionsTableProps {
  isSynced: boolean;
  signalDetectionResults: SignalDetectionFetchResult;
  data: SignalDetectionRow[];
  columnsToDisplay: Immutable.Map<SignalDetectionColumn, boolean>;
  setPhaseMenuVisibility: (visibility: boolean) => void;
  stationsGroupsByNamesQuery: StationGroupsByNamesQuery;
}

export interface SignalDetectionRow extends Row {
  unsavedChanges: boolean;
  assocStatus: SignalDetectionTypes.SignalDetectionStatus;
  conflict: boolean;
  isActionTarget: boolean;
  isUnqualifiedActionTarget: boolean;
  station: string;
  channel: string;
  phase: string;
  phaseConfidence: string;
  time: ArrivalTime;
  azimuth: string;
  azimuthStandardDeviation: string;
  slowness: string;
  slownessStandardDeviation: string;
  amplitude: string;
  period: string;
  sNR: string;
  rectilinearity: string;
  emergenceAngle: string;
  shortPeriodFirstMotion: string;
  longPeriodFirstMotion: string;
  deleted: string;
  edgeType: string;
}

/**
 * Used to match the display strings to values in the SD sync dropdown.
 */
export const signalDetectionSyncDisplayStrings: Immutable.Map<
  DisplayedSignalDetectionConfigurationEnum,
  string
> = Immutable.Map<DisplayedSignalDetectionConfigurationEnum, string>([
  [
    DisplayedSignalDetectionConfigurationEnum.syncWaveform,
    messageConfig.labels.syncToWaveformDisplayVisibleTimeRange
  ],
  [
    DisplayedSignalDetectionConfigurationEnum.signalDetectionBeforeInterval,
    'Edge detections before interval'
  ],
  [
    DisplayedSignalDetectionConfigurationEnum.signalDetectionAfterInterval,
    'Edge detections after interval'
  ],
  [
    DisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToOpenEvent,
    'Associated to open event'
  ],
  [
    DisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToCompletedEvent,
    'Associated to completed event'
  ],
  [
    DisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToOtherEvent,
    'Associated to other event'
  ],
  [DisplayedSignalDetectionConfigurationEnum.signalDetectionConflicts, 'Conflicts'],
  [DisplayedSignalDetectionConfigurationEnum.signalDetectionDeleted, 'Deleted'],
  [DisplayedSignalDetectionConfigurationEnum.signalDetectionUnassociated, 'Unassociated']
]);

export const signalDetectionSyncLabelStrings: Immutable.Map<
  DisplayedSignalDetectionConfigurationEnum,
  string
> = Immutable.Map<DisplayedSignalDetectionConfigurationEnum, string>([
  [DisplayedSignalDetectionConfigurationEnum.signalDetectionBeforeInterval, 'Edge Detections'],
  [
    DisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToOpenEvent,
    'Association Status'
  ]
]);

export const signalDetectionSyncRenderDividers: Immutable.Map<
  DisplayedSignalDetectionConfigurationEnum,
  boolean
> = Immutable.Map<DisplayedSignalDetectionConfigurationEnum, boolean>([
  [DisplayedSignalDetectionConfigurationEnum.syncWaveform, true],
  [DisplayedSignalDetectionConfigurationEnum.signalDetectionAfterInterval, true]
]);

/** TODO add units, have names and units reviewed
 * used to match the display strings to values in the SD table column picker dropdown
 */
export const signalDetectionColumnDisplayStrings: Immutable.Map<SignalDetectionColumn, string> =
  Immutable.Map<SignalDetectionColumn, string>([
    [SignalDetectionColumn.unsavedChanges, 'Unsaved changes'],
    [SignalDetectionColumn.assocStatus, 'Assoc status'],
    [SignalDetectionColumn.conflict, 'Conflict'],
    [SignalDetectionColumn.station, 'Station'],
    [SignalDetectionColumn.channel, 'Channel'],
    [SignalDetectionColumn.phase, 'Phase'],
    [SignalDetectionColumn.phaseConfidence, 'Phase confidence'],
    [SignalDetectionColumn.time, 'Time'],
    [SignalDetectionColumn.timeStandardDeviation, 'Time Std Deviation (s)'],
    [SignalDetectionColumn.azimuth, 'Azimuth (°)'],
    [SignalDetectionColumn.azimuthStandardDeviation, 'Azimuth std dev (°)'],
    [SignalDetectionColumn.slowness, 'Slowness (s/°)'],
    [SignalDetectionColumn.slownessStandardDeviation, 'Slowness std dev (s/°)'],
    [SignalDetectionColumn.amplitude, 'Amplitude'],
    [SignalDetectionColumn.period, 'Period (s)'],
    [SignalDetectionColumn.sNR, 'SNR'],
    [SignalDetectionColumn.rectilinearity, 'Rectilinearity'],
    [SignalDetectionColumn.emergenceAngle, 'Emergence angle (°)'],
    [SignalDetectionColumn.shortPeriodFirstMotion, 'Short period first motion'],
    [SignalDetectionColumn.longPeriodFirstMotion, 'Long period first motion'],
    [SignalDetectionColumn.deleted, 'Deleted']
  ]);
