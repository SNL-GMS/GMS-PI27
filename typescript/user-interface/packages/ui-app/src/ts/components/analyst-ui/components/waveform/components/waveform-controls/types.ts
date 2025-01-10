import type { CommonTypes, ConfigurationTypes, WaveformTypes } from '@gms/common-model';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';
import type { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import { WaveformDisplayedSignalDetectionConfigurationEnum } from '@gms/ui-state/lib/app/state/waveform/types';
import Immutable from 'immutable';
import type React from 'react';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';

import type { AmplitudeScalingOptions, FixedScaleValue } from './scaling-options';

/**
 * Waveform Display Controls Props
 */
export interface WaveformControlsProps {
  defaultSignalDetectionPhase: string;
  currentSortType: AnalystWorkspaceTypes.WaveformSortType;
  currentTimeInterval: CommonTypes.TimeRange;
  viewableTimeInterval: CommonTypes.TimeRange;
  currentOpenEventId: string;
  analystNumberOfWaveforms: number;
  showPredictedPhases: boolean;
  qcMaskDefaultVisibility: Record<ConfigurationTypes.QCMaskTypes, boolean>;
  alignWaveformsOn: AlignWaveformsOn;
  phaseToAlignOn: string | undefined;
  defaultPhaseAlignment: string;
  selectedStationIds: string[];
  isMeasureWindowVisible: boolean;
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  featurePredictionQueryDataUnavailable: boolean;
  setMode(mode: AnalystWorkspaceTypes.WaveformDisplayMode): void;
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
  setCurrentPhaseMenuVisibility(newValue: boolean): void;
  setDefaultSignalDetectionPhase(phase: string): void;
  setSelectedSortType(sortType: AnalystWorkspaceTypes.WaveformSortType): void;
  setAnalystNumberOfWaveforms(value: number): void;
  setWaveformAlignment(
    alignWaveformsOn: AlignWaveformsOn,
    phaseToAlignOn: string,
    showPredictedPhases: boolean
  ): void;
  setAlignWaveformsOn(alignWaveformsOn: AlignWaveformsOn);
  toggleMeasureWindow(): void;
  loadData(loadType: WaveformTypes.LoadType): void;
  zoomAlignSort(): void;
  onKeyPress(
    e: React.KeyboardEvent<HTMLDivElement>,
    clientX?: number,
    clientY?: number,
    channelId?: string,
    timeSecs?: number
  ): void;
  amplitudeScaleOption: AmplitudeScalingOptions;
  fixedScaleVal: FixedScaleValue;
  setAmplitudeScaleOption: (option: AmplitudeScalingOptions) => void;
  setFixedScaleVal: (val: FixedScaleValue) => void;
  setRotationDialogVisibility: (isVisible: boolean) => void;
  setEventBeamDialogVisibility: (isVisible: boolean) => void;
  uiTheme: UITheme;
}

export interface WaveformDisplayControlsState {
  hasMounted: boolean;
}

/**
 * Used to match the display strings to values in the SD sync dropdown.
 */
export const signalDetectionSyncDisplayStrings: Immutable.Map<
  WaveformDisplayedSignalDetectionConfigurationEnum,
  string
> = Immutable.Map<WaveformDisplayedSignalDetectionConfigurationEnum, string>([
  [
    WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionBeforeInterval,
    'Edge detections before interval'
  ],
  [
    WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionAfterInterval,
    'Edge detections after interval'
  ],
  [
    WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToOpenEvent,
    'Associated to open event'
  ],
  [
    WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToCompletedEvent,
    'Associated to completed event'
  ],
  [
    WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToOtherEvent,
    'Associated to other event'
  ],
  [WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionConflicts, 'Conflicts'],
  [WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionUnassociated, 'Unassociated'],
  [WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionDeleted, 'Deleted']
]);

export const signalDetectionSyncLabelStrings: Immutable.Map<
  WaveformDisplayedSignalDetectionConfigurationEnum,
  string
> = Immutable.Map<WaveformDisplayedSignalDetectionConfigurationEnum, string>([
  [
    WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionBeforeInterval,
    'Edge Detections'
  ],
  [
    WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionAssociatedToOpenEvent,
    'Association Status'
  ]
]);

export const signalDetectionSyncRenderDividers: Immutable.Map<
  WaveformDisplayedSignalDetectionConfigurationEnum,
  boolean
> = Immutable.Map<WaveformDisplayedSignalDetectionConfigurationEnum, boolean>([
  [WaveformDisplayedSignalDetectionConfigurationEnum.signalDetectionAfterInterval, true]
]);
