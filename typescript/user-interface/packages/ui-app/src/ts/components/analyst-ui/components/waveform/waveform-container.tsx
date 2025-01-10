import { compose } from '@gms/common-util';
import type { AppState } from '@gms/ui-state';
import {
  analystActions,
  AnalystWorkspaceOperations,
  commonActions,
  setSelectedStationIds
} from '@gms/ui-state';
import type React from 'react';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import type { WaveformDisplayReduxProps } from './types';
import { WaveformComponent } from './waveform-component';

// map parts of redux state into this component as props
const mapStateToProps = (state: AppState): Partial<WaveformDisplayReduxProps> => ({
  alignWaveformsOn: state.app.analyst.alignWaveformsOn,
  analysisMode: state.app.workflow ? state.app.workflow.analysisMode : undefined,
  channelFilters: state.app.waveform.channelFilters,
  currentOpenEventId: state.app.analyst?.openEventId,
  currentStageName: state.app.workflow.openIntervalName,
  currentTimeInterval: state.app.workflow.timeRange,
  keyPressActionQueue: state.app.common.keyPressActionQueue,
  location: state.app.analyst.location,
  measurementMode: state.app.analyst.measurementMode,
  phaseToAlignOn: state.app.analyst.phaseToAlignOn,
  selectedSdIds: state.app.analyst.selectedSdIds,
  selectedSortType: state.app.analyst.selectedSortType,
  selectedStationIds: state.app.common.selectedStationIds,
  waveformClientState: state.app.waveform.loadingState
});

// map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<WaveformDisplayReduxProps> =>
  bindActionCreators(
    {
      setMode: AnalystWorkspaceOperations.setMode,
      setSelectedSdIds: analystActions.setSelectedSdIds,
      setSelectedStationIds,
      setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries,
      setChannelFilters: analystActions.setChannelFilters,
      setDefaultSignalDetectionPhase: analystActions.setDefaultSignalDetectionPhase,
      setSelectedSortType: analystActions.setSelectedSortType,
      setKeyPressActionQueue: commonActions.setKeyPressActionQueue,
      setPhaseToAlignOn: analystActions.setPhaseToAlignOn,
      setAlignWaveformsOn: analystActions.setAlignWaveformsOn
    },
    dispatch
  );

/**
 * higher-order component Waveform
 */
export const Waveform: React.ComponentClass<Pick<any, never>> = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps)
)(WaveformComponent);
