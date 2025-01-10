import { Radio, RadioGroup } from '@blueprintjs/core';
import { Displays } from '@gms/common-model';
import type { ToolbarTypes } from '@gms/ui-core-components';
import { Tooltip2Wrapper } from '@gms/ui-core-components';
import { useAppDispatch, waveformActions } from '@gms/ui-state';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import defer from 'lodash/defer';
import React from 'react';

import { PhaseSelectorDialog } from '~analyst-ui/common/dialogs/phase-selector/phase-selector-dialog';
import { useSelectionInformationControl } from '~common-ui/common/selection-information';
import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';

import { useCreateEventControl } from '../../../../common/toolbar-items/create-event-control';
import { setFocusToWaveformDisplay } from '../../utils';
import { useAlignmentControl } from './alignment-control';
import { useCreateQcSegmentControl } from './create-qc-segment-btn';
import { useCurrentPhaseControl } from './current-phase-control';
import { useEventBeamControl } from './event-beam-dialog/event-beam-controls';
import { useLoadingDataGroupControl } from './load-data-group-control';
import { useMeasureWindowControl } from './measure-window-control';
import { useModeControl } from './mode-selector-control';
import { useNumWaveformControl } from './num-waveform-control';
import { usePhaseControl } from './phase-selector-control';
import { usePredictedControl } from './predicted-control';
import { useQcMaskControl } from './qc-mask-control';
import { useRotationControl } from './rotation-dialog/rotation-control';
import { useScalingOptions } from './scaling-options';
import { useShowDetectionsControl } from './show-detections-control';
import { useStationSortControl } from './station-sort-control';
import { useStationsDropdownControl } from './stations-control';
import { useTimeUncertaintySwitch } from './time-uncertainty-switch';
import type { WaveformControlsProps } from './types';
import { WaveformToolbar } from './waveform-toolbar';
import { useZASControl } from './zas-control';

/**
 * Waveform Display Controls Component
 * Builds and renders the waveform toolbar and loading spinner (absolutely positioned to appear at
 * a different location on the screen).
 */
export const WaveformControls = React.memo(function InternalWaveformControls({
  measurementMode,
  currentOpenEventId,
  currentTimeInterval,
  viewableTimeInterval,
  setMode,
  defaultSignalDetectionPhase,
  setCreateEventMenuState,
  setCurrentPhaseMenuVisibility,
  setDefaultSignalDetectionPhase,
  analystNumberOfWaveforms,
  setAnalystNumberOfWaveforms,
  alignWaveformsOn,
  selectedStationIds,
  phaseToAlignOn,
  showPredictedPhases,
  setAlignWaveformsOn,
  currentSortType,
  setSelectedSortType,
  isMeasureWindowVisible,
  toggleMeasureWindow,
  loadData,
  zoomAlignSort,
  amplitudeScaleOption,
  fixedScaleVal,
  setAmplitudeScaleOption,
  setFixedScaleVal,
  featurePredictionQueryDataUnavailable,
  qcMaskDefaultVisibility,
  uiTheme,
  setRotationDialogVisibility,
  setEventBeamDialogVisibility,
  setWaveformAlignment
}: WaveformControlsProps) {
  const dispatch = useAppDispatch();

  const [alignedOn, setAlignedOn] = React.useState(alignWaveformsOn);
  const [isOpen, setIsOpen] = React.useState(false);
  const onPhaseSubmit = React.useCallback(
    (phases: string[]) => {
      // Manually call this because setWaveformAlignment is a slow operation and the pop stays open too long
      setIsOpen(false);

      setWaveformAlignment(
        alignedOn,
        phases[0],
        alignedOn !== AlignWaveformsOn.TIME ? true : showPredictedPhases
      );
      if (alignedOn === AlignWaveformsOn.PREDICTED_PHASE) {
        dispatch(waveformActions.setShouldShowPredictedPhases(true));
      }
    },
    [alignedOn, dispatch, setWaveformAlignment, showPredictedPhases]
  );

  const onRadioClick = React.useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      setAlignedOn(event.currentTarget.value as AlignWaveformsOn);
      if (event.currentTarget.value === 'Time') {
        setIsOpen(false);
        setWaveformAlignment(AlignWaveformsOn.TIME, undefined, showPredictedPhases);
      }
    },
    [setWaveformAlignment, showPredictedPhases]
  );

  const closeCallback = React.useCallback(() => {
    setIsOpen(false);
    defer(() => {
      setFocusToWaveformDisplay();
    });
  }, []);

  const [widthPx] = useBaseDisplaySize();

  const loadDataGroup = useLoadingDataGroupControl(
    loadData,
    currentTimeInterval,
    viewableTimeInterval,
    'wfdataloadgroup'
  );

  const createEventControl = useCreateEventControl(setCreateEventMenuState, 'wfcreateevent');

  const zoomAlignSortGroup = useZASControl(
    zoomAlignSort,
    currentOpenEventId,
    featurePredictionQueryDataUnavailable,
    'wfzasgroup'
  );

  const selectionInformation = useSelectionInformationControl(
    'wfselectioninfo',
    Displays.IanDisplays.WAVEFORM,
    setFocusToWaveformDisplay
  );

  const currentPhaseMenu = useCurrentPhaseControl(
    setCurrentPhaseMenuVisibility,
    'wfcurrentphasemenu'
  );

  const stationSelector = useStationsDropdownControl('wfstationselect');

  const numWaveformsSelector = useNumWaveformControl(
    analystNumberOfWaveforms,
    setAnalystNumberOfWaveforms,
    'wfnumwaveformselect'
  );

  const { toolbarItem: scalingOptions } = useScalingOptions(
    amplitudeScaleOption,
    fixedScaleVal,
    setAmplitudeScaleOption,
    setFixedScaleVal,
    'wfscaling'
  );

  const timeUncertaintySwitch = useTimeUncertaintySwitch('wftimeuncertainty');

  const modeSelector = useModeControl(measurementMode, setMode, 'wfmodeselect');

  const sdPhaseSelector = usePhaseControl(
    defaultSignalDetectionPhase,
    setDefaultSignalDetectionPhase,
    'wfsdphaseselect'
  );

  const alignmentSelector = useAlignmentControl(
    alignWaveformsOn,
    phaseToAlignOn,
    setAlignedOn,
    setIsOpen,
    currentOpenEventId,
    'wfalignment'
  );

  const stationSort = useStationSortControl(
    currentSortType,
    currentOpenEventId,
    setSelectedSortType,
    'wfstationsort'
  );

  const predictedDropdown = usePredictedControl(
    currentOpenEventId,
    'wfpredicted',
    setAlignWaveformsOn
  );

  const showDetectionsDropdown = useShowDetectionsControl('wfshowdets');

  const qcMaskPicker = useQcMaskControl(qcMaskDefaultVisibility, uiTheme);

  const createQcSegment = useCreateQcSegmentControl(
    selectedStationIds,
    viewableTimeInterval,
    'wfcreateseg'
  );

  const measureWindowSwitch = useMeasureWindowControl(
    isMeasureWindowVisible,
    toggleMeasureWindow,
    'wfmeasurewindow'
  );

  const rotation = useRotationControl(setRotationDialogVisibility, 'wfrotation');

  const eventBeam = useEventBeamControl(
    setEventBeamDialogVisibility,
    currentOpenEventId,
    'wfeventbeam'
  );

  const leftItems: ToolbarTypes.ToolbarItemElement[] = React.useMemo(() => {
    return [zoomAlignSortGroup, createEventControl, selectionInformation];
  }, [createEventControl, zoomAlignSortGroup, selectionInformation]);

  const rightItems: ToolbarTypes.ToolbarItemElement[] = React.useMemo(() => {
    return [
      eventBeam,
      rotation,
      stationSelector,
      currentPhaseMenu,
      modeSelector,
      scalingOptions,
      sdPhaseSelector,
      numWaveformsSelector,
      alignmentSelector,
      stationSort,
      timeUncertaintySwitch,
      predictedDropdown,
      showDetectionsDropdown,
      qcMaskPicker,
      createQcSegment,
      measureWindowSwitch,
      loadDataGroup
    ];
  }, [
    eventBeam,
    rotation,
    stationSelector,
    currentPhaseMenu,
    modeSelector,
    scalingOptions,
    sdPhaseSelector,
    numWaveformsSelector,
    alignmentSelector,
    stationSort,
    timeUncertaintySwitch,
    predictedDropdown,
    showDetectionsDropdown,
    qcMaskPicker,
    createQcSegment,
    measureWindowSwitch,
    loadDataGroup
  ]);

  return (
    <>
      <PhaseSelectorDialog
        isOpen={isOpen}
        title="Set Alignment"
        selectedPhases={[phaseToAlignOn]}
        phaseSelectorCallback={onPhaseSubmit}
        closeCallback={closeCallback}
      >
        <Tooltip2Wrapper content="Alignment type">
          <RadioGroup onChange={onRadioClick} selectedValue={alignedOn} inline>
            <Radio label="Time" value="Time" key="Time" data-cy="Time" />
            <Radio label="Observed" value="Observed" key="Observed" data-cy="Observed" />{' '}
            <Radio label="Predicted" value="Predicted" key="Predicted" data-cy="Predicted" />
          </RadioGroup>
        </Tooltip2Wrapper>
      </PhaseSelectorDialog>
      <WaveformToolbar
        leftToolbarItems={leftItems}
        rightToolbarItems={rightItems}
        widthPx={widthPx}
      />
    </>
  );
});
