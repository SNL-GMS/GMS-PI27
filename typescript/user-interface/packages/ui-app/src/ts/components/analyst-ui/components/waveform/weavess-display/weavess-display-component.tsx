import type { SignalDetectionTypes } from '@gms/common-model';
import type GoldenLayout from '@gms/golden-layout';
import {
  AnalystWaveformSelectors,
  AnalystWorkspaceOperations,
  commonActions,
  selectCurrentPhase,
  selectDefaultPhase,
  selectValidActionTargetSignalDetectionIds,
  selectWorkflowTimeRange,
  useAppDispatch,
  useAppSelector,
  useAssociateSignalDetections,
  useEventStatusQuery,
  useGetEvents,
  useGetSignalDetections,
  useSetSdIdsToShowFk,
  useSetSelectedSdIds,
  useSetSignalDetectionActionTargets,
  useUiTheme,
  useUnassociateSignalDetections,
  useViewportVisibleStations
} from '@gms/ui-state';
import type { WeavessProps } from '@gms/weavess';
import type { WeavessTypes } from '@gms/weavess-core';
import React from 'react';

import { useSignalDetectionEventHandlers } from '~analyst-ui/common/hooks/signal-detection-hooks';

import type {
  AmplitudeScalingOptions,
  FixedScaleValue
} from '../components/waveform-controls/scaling-options';
import { setFocusToWaveformDisplay } from '../utils';
import {
  useMaskVisibility,
  useProcessingMasksForWaveformDisplay,
  useQcMasksForWaveformDisplay,
  useWaveformStations
} from '../waveform-hooks';
import { WeavessDisplayPanel } from './weavess-display-panel';

/**
 * Returns setter to dispatch selected station ids in redux
 */
export const useSetSelectedStationIds = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (selectedStationIds: string[]) => {
      dispatch(commonActions.setSelectedStationIds(selectedStationIds));
    },
    [dispatch]
  );
};
export interface WeavessDisplayComponentProps {
  weavessProps: WeavessProps;
  closeSplitChannelOverlayCallback?: () => void;
  amplitudeScaleOption?: AmplitudeScalingOptions;
  fixedScaleVal?: FixedScaleValue;
  scaleAmplitudeChannelName?: string;
  scaledAmplitudeChannelMinValue?: number;
  scaledAmplitudeChannelMaxValue?: number;
  activeSplitModeType: WeavessTypes.SplitMode | null;
  isSplitChannelOverlayOpen: boolean;
  createSignalDetection(
    stationId: string,
    channelName: string,
    timeSecs: number,
    phase?: string,
    isTemporary?: boolean
  );
  showCreateSignalDetectionPhaseSelector(
    stationId: string,
    channelName: string,
    timeSecs: number,
    isTemporary?: boolean
  ): void;
  setClickedSdId(clickedSdId: string): void;
  updateSelectedWaveforms: (
    stationId: string,
    timeSecs: number,
    channelSegments: WeavessTypes.ChannelSegment[],
    signalDetections: SignalDetectionTypes.SignalDetection[],
    isMultiSelect: boolean,
    optionalParam: { isMeasureWindow?: boolean; phase?: string; isTemporary?: boolean }
  ) => Promise<void>;
  phaseMenuVisibility: boolean;
  setPhaseMenuVisibility(visibility: boolean): void;
  // From WeavessDisplayReduxProps
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
}

/**
 * Wrapper component that pull in Redux state and hooks
 */
export function WeavessDisplayComponent({
  setPhaseMenuVisibility,
  setClickedSdId,
  ...rest
}: WeavessDisplayComponentProps) {
  const unassociateSignalDetections = useUnassociateSignalDetections();
  const signalDetectionEventHandlers = useSignalDetectionEventHandlers(
    rest.isSplitChannelOverlayOpen,
    false,
    setFocusToWaveformDisplay,
    setPhaseMenuVisibility,
    setClickedSdId
  );
  const stationQuery = useWaveformStations();
  const defaultStations = stationQuery?.data ? stationQuery?.data : [];
  const defaultSignalDetectionPhase = useAppSelector(selectDefaultPhase);
  const sdIdsToShowFk = useAppSelector(state => state.app.fks.sdIdsToShowFk);
  const setSdIdsToShowFk = useSetSdIdsToShowFk();
  const signalDetectionResults = useGetSignalDetections();
  const processingMasks = useProcessingMasksForWaveformDisplay();
  const qcSegments = useQcMasksForWaveformDisplay();
  const maskVisibility = useMaskVisibility();
  const eventResults = useGetEvents();
  const eventStatusQuery = useEventStatusQuery();
  const currentPhase = useAppSelector(selectCurrentPhase);
  const [uiTheme] = useUiTheme();
  // TODO: no prop spreading
  const [, setViewportVisibleStations] = useViewportVisibleStations();
  return (
    <WeavessDisplayPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      defaultStations={defaultStations}
      defaultSignalDetectionPhase={defaultSignalDetectionPhase}
      currentPhase={currentPhase}
      sdIdsToShowFk={sdIdsToShowFk}
      setSdIdsToShowFk={setSdIdsToShowFk}
      signalDetections={signalDetectionResults.data ?? []}
      processingMasks={processingMasks}
      maskVisibility={maskVisibility}
      qcSegmentsByChannelName={qcSegments.data}
      events={eventResults.data}
      eventStatuses={eventStatusQuery.data}
      measurementMode={useAppSelector(state => state.app.analyst.measurementMode)}
      analysisMode={useAppSelector(state => state.app.workflow.analysisMode)}
      selectedSdIds={useAppSelector(state => state.app.analyst.selectedSdIds)}
      setSelectedSdIds={useSetSelectedSdIds()}
      associateSignalDetections={useAssociateSignalDetections()}
      signalDetectionActionTargets={useAppSelector(selectValidActionTargetSignalDetectionIds)}
      selectedStationIds={useAppSelector(state => state.app.common.selectedStationIds)}
      setSelectedStationIds={useSetSelectedStationIds()}
      setMeasurementModeEntries={AnalystWorkspaceOperations.setMeasurementModeEntries}
      currentOpenEventId={useAppSelector(state => state.app.analyst?.openEventId)}
      openIntervalName={useAppSelector(state => state.app.workflow.openIntervalName)}
      currentTimeInterval={useAppSelector(selectWorkflowTimeRange)}
      uiTheme={uiTheme}
      channelFilters={useAppSelector(AnalystWaveformSelectors.selectChannelFilters)}
      setViewportVisibleStations={setViewportVisibleStations}
      unassociateSignalDetections={unassociateSignalDetections}
      signalDetectionHandlers={signalDetectionEventHandlers}
      setSignalDetectionActionTargets={useSetSignalDetectionActionTargets()}
    />
  );
}
