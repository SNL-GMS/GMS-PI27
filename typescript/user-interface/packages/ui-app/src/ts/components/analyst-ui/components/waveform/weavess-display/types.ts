import type {
  ChannelSegmentTypes,
  CommonTypes,
  ConfigurationTypes,
  EventTypes,
  SignalDetectionTypes,
  StationTypes,
  WorkflowTypes
} from '@gms/common-model';
import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type GoldenLayout from '@gms/golden-layout';
import type { AnalystWorkspaceTypes, ChannelFilterRecord, EventStatus } from '@gms/ui-state';
import type { WeavessWaveformDisplayProps } from '@gms/weavess/lib/components/weavess-waveform-display/types';
import type { WeavessTypes } from '@gms/weavess-core';

import type { SignalDetectionHandlers } from '~analyst-ui/common/hooks/signal-detection-hooks';

import type {
  AmplitudeScalingOptions,
  FixedScaleValue
} from '../components/waveform-controls/scaling-options';

export interface WeavessDisplayState {
  qcSegmentModifyInterval?: CommonTypes.TimeRange;
  selectedQcSegment?: QcSegment;
  /**
   * The anchor for the channel selection range: this defines the starting point for a range selection.
   */
  selectionRangeAnchor: string | undefined;
}

interface WeavessDisplayReduxProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
}

export interface WeavessDisplayPanelProps {
  weavessProps: WeavessWaveformDisplayProps;
  closeSplitChannelOverlayCallback?: () => void;
  defaultStations: StationTypes.Station[];
  currentPhase?: string;
  defaultSignalDetectionPhase?: string;
  events: EventTypes.Event[];
  qcSegmentsByChannelName: Record<string, Record<string, QcSegment>>;
  processingMasks: ChannelSegmentTypes.ProcessingMask[];
  maskVisibility: Record<string, boolean>;
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  signalDetections: SignalDetectionTypes.SignalDetection[];
  selectedSdIds: string[];
  setSelectedSdIds(id: string[]): void;
  associateSignalDetections: (selectedSdIds: string[]) => void;
  unassociateSignalDetections: (selectedSdIds: string[], rejectAssociations?: boolean) => void;
  selectedStationIds: string[];
  signalDetectionActionTargets: string[];
  setSelectedStationIds(ids: string[]);
  setMeasurementModeEntries(entries: Record<string, boolean>): void;
  amplitudeScaleOption?: AmplitudeScalingOptions;
  fixedScaleVal?: FixedScaleValue;
  scaleAmplitudeChannelName?: string;
  scaledAmplitudeChannelMinValue?: number;
  scaledAmplitudeChannelMaxValue?: number;
  currentTimeInterval: CommonTypes.TimeRange;
  currentOpenEventId: string;
  openIntervalName: string;
  analysisMode: WorkflowTypes.AnalysisMode;
  sdIdsToShowFk: string[];
  setSdIdsToShowFk(signalDetections: string[]): void;
  eventStatuses: Record<string, EventStatus>;
  uiTheme: ConfigurationTypes.UITheme;
  stationsAssociatedToCurrentOpenEvent?: string[];
  activeSplitModeType: WeavessTypes.SplitMode;
  isSplitChannelOverlayOpen: boolean;
  createSignalDetection(
    stationId: string,
    channelName: string | undefined,
    timeSecs: number,
    phase?: string,
    isTemporary?: boolean
  );
  showCreateSignalDetectionPhaseSelector(
    stationId: string,
    channelName: string | undefined,
    timeSecs: number,
    isTemporary?: boolean
  ): void;
  phaseMenuVisibility: boolean;
  setSignalDetectionActionTargets(signalDetectionIds: string[]): void;
  channelFilters: ChannelFilterRecord;
  setViewportVisibleStations(
    channels: WeavessTypes.Channel[],
    indexStart: number,
    indexEnd: number
  ): void;
  updateSelectedWaveforms: (
    stationId: string,
    timeSecs: number,
    channelSegments: WeavessTypes.ChannelSegment[],
    signalDetections: SignalDetectionTypes.SignalDetection[],
    isMultiSelect: boolean,
    optionalParam: { isMeasureWindow?: boolean; phase?: string; isTemporary?: boolean }
  ) => Promise<void>;
  signalDetectionHandlers: SignalDetectionHandlers;
}

export type WeavessDisplayProps = WeavessDisplayReduxProps & WeavessDisplayPanelProps;
