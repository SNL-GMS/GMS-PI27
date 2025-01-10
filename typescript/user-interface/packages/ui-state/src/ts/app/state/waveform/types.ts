import type { CommonTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import type { WeavessTypes } from '@gms/weavess-core';

import type { ChannelFilterRecord } from '../../../types';

/**
 * A record of changes to station visibility from @default defaultStationVisibility.
 * A station is considered "visible" if it appears in the waveform display, even if it
 * is drawn off the screen. If it is hidden from the waveform display, it is not
 * considered "visible".
 */
export interface StationVisibilityChanges {
  /**
   * Whether this station is visible.
   */
  visibility: boolean;

  /**
   * The name of this station. Used to look up the station from the results received from the server,
   * and assumed to be unique.
   */
  stationName: string;

  /**
   * If not set, default to true.
   */
  hiddenChannels?: string[];

  /**
   * Whether the station is expanded to show all visible channels. Defaults to false.
   */
  isStationExpanded?: boolean;
}

/**
 * The type definition for the default station visibility object, sans @param stationName
 */
export type DefaultStationVisibility = Omit<StationVisibilityChanges, 'stationName'>;

/**
 * This is a default @interface StationVisibilityChanges object.
 * It represents the state of all stations that are not tracked with their
 * own @interface StationVisibilityChanges object.
 */
export const defaultStationVisibility: DefaultStationVisibility = {
  visibility: false,
  hiddenChannels: undefined,
  isStationExpanded: false
};

/**
 * An object with station names as keys and StationVisibilityChanges objects as values.
 * The changes objects represent any changes to the default visibility. This object, then,
 * represents the state of all stations, regardless of whether there is a corresponding
 * StationVisibilityChanges object in the dictionary. If not present, then it is assumed
 * to be in the default state. (see @const defaultStationVisibility).
 */
export type StationVisibilityChangesDictionary = Record<string, StationVisibilityChanges>;

// State of loading waveforms
export interface WaveformLoadingState {
  isLoading: boolean;
  total: number;
  completed: number;
  percent: number;
  description: string;
}

/**
 * Split station definition if activeSplitModeType is undefined
 * no split station is active
 */
export interface SplitStation {
  activeSplitModeType: WeavessTypes.SplitMode | undefined;
  stationId: string | undefined;
  timeSecs: number | undefined;
  phase: string | undefined;
}

/**
 * Waveform Redux State
 */
export interface WaveformState {
  /** maps the names of channels and signal detection ids (which have derived channels) to the filter that is applied */
  channelFilters: ChannelFilterRecord;
  /** maskVisibility */
  maskVisibility: Record<string, boolean>;
  /** tracks the changes to the default visibility in the waveform display */
  stationsVisibility: StationVisibilityChangesDictionary;
  /** tracks the station names in the currently open station group */
  currentStationGroupStationNames: string[];
  /** tracks how many requests are in flight, and how many are complete, for loading waveform data */
  loadingState: WaveformLoadingState;
  // whether or not to show the time uncertainty bars in the waveform display.
  shouldShowTimeUncertainty: boolean;
  // whether or not to show predicted phases in the waveform display.
  shouldShowPredictedPhases: boolean;
  // The amount that is currently in on the screen due to zooming.
  zoomInterval: Nullable<CommonTypes.TimeRange>;
  // The amount of time that can be viewed without loading more data.
  // because the user may load more waveform
  // data than the currently opened time interval via panning.
  viewableInterval: Nullable<CommonTypes.TimeRange>;
  // The offsets when not aligned by time
  minimumOffset: number;
  maximumOffset: number;
  baseStationTime: number | undefined;
  // Channel height px used in building weavess stations
  channelHeight: number;
  displayedSignalDetectionConfiguration: Record<
    WaveformDisplayedSignalDetectionConfigurationEnum,
    boolean
  >;
  viewportVisibleStations: string[];
  splitStation: SplitStation;
}

/**
 * Properties for calculating the zoom interval to prevent setting it outside the viewable interval
 * Broken out to reduce function complexity
 */
export interface ZoomIntervalProperties {
  prevZoomInterval: Nullable<CommonTypes.TimeRange>;
  viewableInterval: Nullable<CommonTypes.TimeRange>;
  diffStartTimeSecs: number;
  diffEndTimeSecs: number;
  minOffset: number;
  maxOffset: number;
  startTimeDiff: number;
  endTimeDiff: number;
}

export const ZOOM_INTERVAL_TOO_LARGE_ERROR_MESSAGE =
  'Cannot set a zoom interval if no viewable interval is set' as const;

/**
 * Displayed signal detection configuration options
 */
export enum WaveformDisplayedSignalDetectionConfigurationEnum {
  signalDetectionBeforeInterval = 'signalDetectionBeforeInterval',
  signalDetectionAfterInterval = 'signalDetectionAfterInterval',
  signalDetectionAssociatedToOpenEvent = 'signalDetectionAssociatedToOpenEvent',
  signalDetectionAssociatedToCompletedEvent = 'signalDetectionAssociatedToCompletedEvent',
  signalDetectionAssociatedToOtherEvent = 'signalDetectionAssociatedToOtherEvent',
  signalDetectionConflicts = 'signalDetectionConflicts',
  signalDetectionDeleted = 'signalDetectionDeleted',
  signalDetectionUnassociated = 'signalDetectionUnassociated'
}
