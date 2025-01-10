import type {
  ChannelTypes,
  CommonTypes,
  ConfigurationTypes,
  EventTypes,
  FilterTypes,
  SignalDetectionTypes,
  StationTypes,
  WaveformTypes,
  WorkflowTypes
} from '@gms/common-model';
import type {
  KeyboardShortcutConfigurations,
  ProcessingAnalystConfiguration
} from '@gms/common-model/lib/ui-configuration/types';
import type GoldenLayout from '@gms/golden-layout';
import type {
  AnalystWaveformTypes,
  AnalystWorkspaceTypes,
  BeamformingTemplateFetchResult,
  LoadDataOptions,
  StationGroupsByNamesQueryProps,
  StationQueryProps,
  UIChannelSegmentRecord
} from '@gms/ui-state';
import type { PredictFeaturesForEventLocationQueryProps } from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import type { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import type { WeavessTypes } from '@gms/weavess-core';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';

import type { RotationDialogState } from './components/waveform-controls/rotation-dialog/types';
import type {
  AmplitudeScalingOptions,
  FixedScaleValue
} from './components/waveform-controls/scaling-options';

export enum KeyDirection {
  UP = 'Up',
  DOWN = 'Down',
  LEFT = 'Left',
  RIGHT = 'Right'
}

/**
 * Waveform Display display state.
 * keep track of selected channels & signal detections
 */
export interface WaveformDisplayState {
  currentTimeInterval: CommonTypes.TimeRange;
  analystNumberOfWaveforms: number;
  currentOpenEventId: string | undefined;
  isMeasureWindowVisible: boolean;
  amplitudeScaleOption: AmplitudeScalingOptions;
  fixedScaleVal: FixedScaleValue;
  scaleAmplitudeChannelName: string | undefined;
  scaledAmplitudeChannelMinValue: number;
  scaledAmplitudeChannelMaxValue: number;
}

/**
 * Props mapped in from Redux state
 */
export interface WaveformDisplayReduxProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
  currentTimeInterval: CommonTypes.TimeRange;
  currentStageName: string;
  defaultSignalDetectionPhase: string;
  currentOpenEventId: string;
  selectedSdIds: string[];
  selectedStationIds: string[];
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType;
  analysisMode: WorkflowTypes.AnalysisMode;
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  location: AnalystWorkspaceTypes.LocationSolutionState;
  channelFilters: Record<string, FilterTypes.Filter>;
  keyPressActionQueue: Record<string, number>;
  // because the user may load more waveform
  // data than the currently opened time interval
  viewableInterval: WeavessTypes.TimeRange;
  zoomInterval: WeavessTypes.TimeRange;
  minimumOffset: number;
  maximumOffset: number;
  baseStationTime: number | undefined;
  shouldShowTimeUncertainty: boolean;
  shouldShowPredictedPhases: boolean;
  phaseToAlignOn: string | undefined;
  alignWaveformsOn: AnalystWorkspaceTypes.AlignWaveformsOn;
  waveformClientState: AnalystWaveformTypes.WaveformLoadingState;
  createEventMenuState: CreateEventMenuState;
  phaseMenuVisibility: boolean;
  currentPhaseMenuVisibility: boolean;
  currentPhase: string;
  phaseHotkeys: PhaseHotkey[];
  clickedSdId: string;
  weavessStations: WeavessTypes.Station[];
  channelHeight: number;
  splitStation: AnalystWaveformTypes.SplitStation;
  setChannelHeight(channelHeight: number): void;
  // callbacks
  isStationVisible(station: StationTypes.Station | string): boolean;
  getVisibleStationsFromStationList(stations: StationTypes.Station[]): StationTypes.Station[];
  loadData(loadType: WaveformTypes.LoadType, options?: LoadDataOptions): void;
  setDefaultSignalDetectionPhase(phase: string): void;
  setMode(mode: AnalystWorkspaceTypes.WaveformDisplayMode): void;
  setSelectedSdIds(idx: string[]): void;
  setSelectedSortType(selectedSortType: AnalystWorkspaceTypes.WaveformSortType): void;
  setKeyPressActionQueue(actions: Record<string, number>): void;
  setStationVisibility(station: StationTypes.Station | string, isVisible: boolean): void;
  setStationExpanded(station: StationTypes.Station | string, isExpanded?: boolean): void;
  setChannelVisibility(
    station: StationTypes.Station | string,
    channel: ChannelTypes.Channel | string,
    isVisible: boolean
  ): void;
  setMinimumOffset(minimumOffset: number): void;
  setMaximumOffset(maximumOffset: number): void;
  setBaseStationTime(baseStationTime: number | undefined): void;
  setZoomInterval(zoomInterval: CommonTypes.TimeRange): void;
  showAllChannels(station: StationTypes.Station | string): void;
  setShouldShowTimeUncertainty(newValue: boolean): void;
  setShouldShowPredictedPhases(newValue: boolean): void;
  onWeavessMount?(weavessInstance: WeavessTypes.WeavessInstance): void;
  onWeavessUnmount?(): void;
  setAlignWaveformsOn(alignWaveformsOn: AnalystWorkspaceTypes.AlignWaveformsOn): void;
  setPhaseToAlignOn(phaseToAlignOn: string): void;
  signalDetectionPhaseUpdate(selectedSdIds: string[], phase: string);
  createSignalDetection: (
    stationId: string,
    channelName: string,
    timeSecs: number,
    phase?: string,
    isTemporary?: boolean
  ) => Promise<void>;
  showCreateSignalDetectionPhaseSelector: (
    stationId: string,
    channelName: string,
    timeSecs: number,
    isTemporary?: boolean
  ) => void;
  // TODO remove after hoisting hotkeys
  setPhaseMenuVisibility(newValue: boolean): void;
  // TODO remove after hoisting hotkeys
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
  // TODO remove after hoisting hotkeys
  setCurrentPhaseMenuVisibility(newValue: boolean): void;
  setCurrentPhase: (phase: string[]) => void;
  setClickedSdId(clickedSdId: string): void;
  setSignalDetectionActionTargets(signalDetectionIds: string[]): void;
  updateSelectedWaveforms: (
    stationId: string,
    timeSecs: number,
    channelSegments: WeavessTypes.ChannelSegment[],
    signalDetections: SignalDetectionTypes.SignalDetection[],
    isMultiSelect: boolean,
    isMeasureWindow?: boolean,
    phase?: string,
    isTemporary?: boolean
  ) => Promise<void>;
  setSplitStation(splitStation: AnalystWaveformTypes.SplitStation): void;
  updateWaveformAlignment(
    phase: string | undefined,
    alignWaveformsOn: AlignWaveformsOn,
    shouldShowPredictedPhases: boolean,
    waveformProps: WaveformDisplayProps
  ): void;
}

/**
 * Consolidated props type for waveform display.
 */
export type WaveformDisplayProps = React.PropsWithChildren<
  {
    rotate: (newState: RotationDialogState) => void;
    setRotationDialogVisibility: (isVisible: boolean) => void;
    setEventBeamDialogVisibility: (isVisible: boolean) => void;
  } & WaveformDisplayReduxProps &
    PredictFeaturesForEventLocationQueryProps &
    StationQueryProps &
    StationGroupsByNamesQueryProps & {
      processingAnalystConfiguration: ProcessingAnalystConfiguration;
      events: EventTypes.Event[];
      signalDetections: SignalDetectionTypes.SignalDetection[];
      channelSegments: UIChannelSegmentRecord;
      uiTheme: ConfigurationTypes.UITheme;
      distances: EventTypes.LocationDistance[];
      weavessHotkeyDefinitions: WeavessTypes.HotKeysConfiguration;
      keyboardShortcuts: KeyboardShortcutConfigurations;
      populatedChannels: ChannelTypes.Channel[];
      beamformingTemplates: BeamformingTemplateFetchResult;
      createPreconfiguredEventBeams: (
        stations: StationTypes.Station[],
        channels?: ChannelTypes.Channel[]
      ) => Promise<void>;
    }
>;

/**
 * The props for the {@link WaveformComponent}.
 * We omit the signalDetectionResults and channelSegmentResults and replace them with
 * the modified fetch results type, because the non-ideal state component consumes
 * and removes the metadata (such as isLoading and isError). This is a performance
 * optimization, since it reduces the number of times the {@link WaveformPanel} renders
 */
export type WaveformComponentProps = Omit<
  WaveformDisplayProps,
  'channelSegments' | 'events' | 'signalDetections'
>;

/**
 * Used to build the phase hotkeys for display and their tooltip
 * in the phase selector popup
 */
export interface PhaseHotkey {
  phase: string;
  hotkey: string;
  tooltip: JSX.Element;
}
