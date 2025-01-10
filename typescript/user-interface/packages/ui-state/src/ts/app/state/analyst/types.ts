import type { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { createEnumTypeGuard } from '@gms/common-util';
import Immutable from 'immutable';

export enum AnalystKeyAction {
  ESCAPE = 'Escape',
  SAVE_OPEN_EVENT = 'Save Open Event',
  SAVE_ALL_EVENTS = 'Save All Events in Interval'
}

export const AnalystKeyActions: Immutable.Map<string, AnalystKeyAction> = Immutable.Map([
  ['Control+KeyS', AnalystKeyAction.SAVE_OPEN_EVENT],
  ['Control+Shift+KeyS', AnalystKeyAction.SAVE_ALL_EVENTS],
  ['Escape', AnalystKeyAction.ESCAPE]
]);

/**
 * The display mode options for the waveform display.
 */
export enum WaveformDisplayMode {
  DEFAULT = 'Default',
  MEASUREMENT = 'Measurement'
}
/**
 * Available waveform align types.
 */
export enum AlignWaveformsOn {
  TIME = 'Time',
  PREDICTED_PHASE = 'Predicted',
  OBSERVED_PHASE = 'Observed'
}

/**
 * Available waveform sort types.
 */
export enum WaveformSortType {
  distance = 'Distance',
  stationNameAZ = 'Station: A-Z',
  stationNameZA = 'Station: Z-A'
}

export type DisplayedMagnitudeTypes = Record<string, boolean>;

export const isAnalystKeyAction = createEnumTypeGuard(AnalystKeyAction);

/**
 * Measurement mode state.
 */
export interface MeasurementMode {
  /** The display mode */
  mode: WaveformDisplayMode;

  /**
   * Measurement entries that are manually added or hidden by the user.
   * The key is the signal detection id
   */
  entries: Record<string, boolean>;
}

/**
 * A list such that at each index, it indicates whether the filter at the
 * same index is within the hotkey cycle.
 */
export type HotkeyCycleList = (boolean | null)[];

/**
 * The location solution state.
 * Includes:
 *   * The selected location solution set and solution
 *   * The selected preferred location solution set and solution
 */
export interface LocationSolutionState {
  selectedLocationSolutionId: string;
  selectedLocationSolutionSetId: string;
  selectedPreferredLocationSolutionId: string;
  selectedPreferredLocationSolutionSetId: string;
}

export interface LoadingActionStatus {
  isComplete?: boolean;
  error?: string;
  actionType: 'REQUEST' | 'CLIENT_SIDE_ACTION';
}

export interface RequestStatus extends LoadingActionStatus {
  url?: string;
  actionType: 'REQUEST';
}

export interface ClientActionStatus extends LoadingActionStatus {
  clientAction?: string;
  actionType: 'CLIENT_SIDE_ACTION';
}

export const isRequestStatus = (statusObj: LoadingActionStatus): statusObj is RequestStatus => {
  return statusObj?.actionType === 'REQUEST';
};

export const isClientActionStatus = (
  statusObj: LoadingActionStatus
): statusObj is ClientActionStatus => {
  return statusObj.actionType === 'CLIENT_SIDE_ACTION';
};

/**
 * Type used for determining the analyst action on an event
 */
export type EventActionTypes = 'duplicate' | 'reject' | 'delete' | 'open' | 'close' | 'details';

/**
 * Type used for determining the analyst action on a signal detection
 */
export type SignalDetectionActionTypes =
  | 'reject associate'
  | 'delete'
  | 'details'
  | 'associate'
  | 'unassociate'
  | 'phase'
  | 'default phase'
  | 'current phase'
  | 'fk'
  | 'rotate';

/**
 * union of action types
 */
export type ActionTypes = EventActionTypes | SignalDetectionActionTypes | null;

export interface ActionTarget {
  actionType: ActionTypes; // the type of action the analyst will take on an event or sd
  eventIds: string[]; // The ids of the events that are the target of a user's action
  signalDetectionIds: string[];
}

export interface AnalystState {
  channelFilters: Record<string, WaveformTypes.WaveformFilter>;
  defaultSignalDetectionPhase: string;
  effectiveNowTime: number;
  fileId: {
    workflowUniqueId: string;
    fileHandle: FileSystemFileHandle | null;
  };
  hotkeyCycleOverrides: Record<string, Record<number, boolean>>;
  location: LocationSolutionState;
  measurementMode: MeasurementMode;
  requestTracker: {
    /* record keyed on ids */
    requests: Record<string, RequestStatus | ClientActionStatus>;
    initiatedRequests: number;
    completedRequests: number;
    lastRequestId: string;
  };
  openEventId: string;
  actionTargets: ActionTarget;
  currentPhase: string;
  selectedEventIds: string[];
  selectedFilterIndex: number | null;
  selectedFilterList: string;
  selectedSdIds: string[];
  selectedSortType: WaveformSortType;

  eventListOpenEventTriggered: boolean;
  mapOpenEventTriggered: boolean;
  alignWaveformsOn: AlignWaveformsOn;
  phaseToAlignOn: string;
  phaseSelectorPhaseList: string;
  phaseSelectorFavorites: Record<string, string[]>;
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[];
}
