import { Button, Collapse, NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { EventTypes } from '@gms/common-model';
import { FilterTypes, FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { getFilterName } from '@gms/common-model/lib/filter/filter-util';
import { setDecimalPrecision } from '@gms/common-util';
import type { ToolbarTypes } from '@gms/ui-core-components';
import {
  ButtonToolbarItem,
  CustomToolbarItem,
  DropdownToolbarItem,
  SwitchToolbarItem,
  Toolbar
} from '@gms/ui-core-components';
import {
  fksActions,
  getWaveform,
  selectEvents,
  selectFkPlotsExpandToolbar,
  selectOpenEventId,
  selectOpenIntervalName,
  selectSelectedSdIds,
  selectSignalDetectionAssociationConflictCount,
  selectValidActionTargetSignalDetectionIds,
  useAppDispatch,
  useAppSelector,
  useEventStatusQuery,
  useFilterQueue,
  useGetSignalDetections,
  useKeyboardShortcutConfigurations,
  useLegacyComputeFk,
  useSelectedFilterList,
  useUiTheme
} from '@gms/ui-state';
import { Weavess } from '@gms/weavess';
import { WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import { isDataClaimCheck } from '@gms/weavess-core/lib/types';
import produce from 'immer';
import React from 'react';

import { useSignalDetectionEventHandlers } from '~analyst-ui/common/hooks/signal-detection-hooks';
import { getSignalDetectionStatus } from '~analyst-ui/common/utils/event-util';
import {
  filterDeletedSignalDetections,
  filterSignalDetectionsByStationId,
  getSignalDetectionStatusColor
} from '~analyst-ui/common/utils/signal-detection-util';
import { useWeavessHotkeys } from '~analyst-ui/components/waveform/utils';
import { WeavessContext } from '~analyst-ui/components/waveform/weavess-context';
import { semanticColors } from '~scss-config/color-preferences';

import { getChannelSegmentBoundaries, getPredictedPoint } from '../../fk-util';
import {
  buildBeamAndTraceMarkers,
  buildDataBySampleRate,
  computeDisabled,
  findSpectrumIndex,
  fStatDataContainsUndefined,
  useFkChannelFilters,
  useGetBeamChannelSegmentRecord
} from './fk-plots-utils';

/**
 * FkPlots Props
 */
export interface FkPlotsProps {
  displayedSignalDetection: SignalDetectionTypes.SignalDetection;
  featurePredictionsForDisplayedSignalDetection: EventTypes.FeaturePrediction[];
  displayedFk: FkTypes.FkSpectra;
  setCurrentMovieSpectrumIndex(index: number): void;
  setPhaseMenuVisibility: (isOpen: boolean) => void;
  fkDisplayWidthPx: number;
}

/**
 * Renders the FK waveform data with Weavess
 */
export function FkPlots({
  displayedSignalDetection,
  featurePredictionsForDisplayedSignalDetection,
  displayedFk,
  setCurrentMovieSpectrumIndex,
  setPhaseMenuVisibility,
  fkDisplayWidthPx
}: FkPlotsProps) {
  /** The precision of displayed lead/lag pair */
  const digitPrecision = 1;

  /** Hard-coded height of the waveform panel */
  const waveformPanelHeight = 70;

  const sdHypo = SignalDetectionTypes.Util.getCurrentHypothesis(
    displayedSignalDetection.signalDetectionHypotheses
  );
  const arrivalTime = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    sdHypo.featureMeasurements
  )?.measurementValue.arrivalTime;
  const [shouldShowFkSteps, setShouldShowFkSteps] = React.useState(false);

  /** Lead */
  const [spectrumLead, setSpectrumLead] = React.useState(
    displayedFk?.configuration
      ? displayedFk.configuration.fkSpectraParameters.fkSpectrumWindow.lead
      : 0
  );

  /** Selection Window Start/End time */
  const { lead } = displayedFk.configuration.fkSpectraParameters.fkSpectrumWindow;
  const initialSelectionWindow: WeavessTypes.TimeRange = {
    startTimeSecs: arrivalTime.value - lead,
    endTimeSecs:
      arrivalTime.value -
      lead +
      displayedFk.configuration.fkSpectraParameters.fkSpectrumWindow.duration
  };
  const [selectionWindowTimeRange, setSelectionWindowTimeRange] =
    React.useState<WeavessTypes.TimeRange>(initialSelectionWindow);

  React.useEffect(() => {
    const configLead = displayedFk.configuration.fkSpectraParameters.fkSpectrumWindow.lead;
    setSpectrumLead(configLead);
    const spectrumDuration =
      displayedFk.configuration.fkSpectraParameters.fkSpectrumWindow.duration;
    const newSelectionWindow: WeavessTypes.TimeRange = {
      startTimeSecs: arrivalTime.value - configLead,
      endTimeSecs: arrivalTime.value - configLead + spectrumDuration
    };
    setSelectionWindowTimeRange(newSelectionWindow);
  }, [arrivalTime.value, displayedFk]);

  const computeFk = useLegacyComputeFk();
  const events = useAppSelector(selectEvents);
  const currentOpenEventId = useAppSelector(selectOpenEventId);
  const eventStatusQuery = useEventStatusQuery();
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const [uiTheme] = useUiTheme();
  const signalDetectionQuery = useGetSignalDetections();
  const sdIdsInConflict = useAppSelector(selectSignalDetectionAssociationConflictCount);
  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );
  const signalDetectionEventHandlers = useSignalDetectionEventHandlers(
    false,
    true,
    () => console.dir('todo set focus to az slow'),
    setPhaseMenuVisibility
  );
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const keyboardShortcuts = useKeyboardShortcutConfigurations();
  const weavessHotkeyDefinitions = useWeavessHotkeys(keyboardShortcuts);
  const getBeamChannelSegmentRecord = useGetBeamChannelSegmentRecord(displayedSignalDetection);
  const selectedFilterList = useSelectedFilterList();

  const { selectedFkFilter, fkChannelFilters, setFkChannelFilter } = useFkChannelFilters(
    displayedSignalDetection,
    displayedFk.configuration
  );
  useFilterQueue(fkChannelFilters, true);

  /**
   * state for collapsible beam display in redux
   */
  const dispatch = useAppDispatch();
  const isBeamExpanded = useAppSelector(selectFkPlotsExpandToolbar);

  const { weavessRef, setWeavessRef } = React.useContext(WeavessContext);

  /**
   * Sets in redux the state of the toolbar collapse state
   */
  const setIsBeamExpanded = React.useCallback(() => {
    dispatch(fksActions.setFkPlotsExpandToolbar(!isBeamExpanded));
  }, [dispatch, isBeamExpanded]);

  const toolbarWidth = fkDisplayWidthPx + FkTypes.Util.BEAM_TOOLBAR_WIDTH_OFFSET;

  const getSpectrumDuration = React.useCallback((timeRange: WeavessTypes.TimeRange): number => {
    return timeRange.endTimeSecs - timeRange.startTimeSecs;
  }, []);

  /**
   * Call to compute Fk with new FK params and FK configuration
   */
  const onSubmitClickHandler = React.useCallback(async () => {
    const fkConfiguration = produce(displayedFk.configuration, draft => {
      draft.fkSpectraParameters.fkSpectrumWindow.lead = Number(
        setDecimalPrecision(spectrumLead, digitPrecision)
      );
      draft.fkSpectraParameters.fkSpectrumWindow.duration = Number(
        setDecimalPrecision(getSpectrumDuration(selectionWindowTimeRange), digitPrecision)
      );
    });
    await computeFk(fkConfiguration, displayedSignalDetection);
  }, [
    displayedFk.configuration,
    computeFk,
    displayedSignalDetection,
    spectrumLead,
    getSpectrumDuration,
    selectionWindowTimeRange
  ]);

  const leftToolbarItems: ToolbarTypes.ToolbarItemElement[] = React.useMemo(() => {
    const isDisabled = computeDisabled(
      Number(setDecimalPrecision(spectrumLead, digitPrecision)),
      Number(setDecimalPrecision(getSpectrumDuration(selectionWindowTimeRange), digitPrecision)),
      displayedFk
    );

    return [
      <Button
        key="beam-expand-toggle"
        onClick={setIsBeamExpanded}
        icon={isBeamExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
      />,
      <CustomToolbarItem
        key="fk-plots__toolbar__title"
        element={<span className="fk-plots__toolbar__title">FK Beams and Traces</span>}
      />,
      <ButtonToolbarItem
        key="computeFk"
        label="Compute"
        tooltip="Compute FK using parameters"
        disabled={isDisabled}
        onButtonClick={onSubmitClickHandler}
        className="compute-button"
      />
    ];
  }, [
    displayedFk,
    setIsBeamExpanded,
    isBeamExpanded,
    onSubmitClickHandler,
    spectrumLead,
    getSpectrumDuration,
    selectionWindowTimeRange
  ]);

  const rightToolbarItems: ToolbarTypes.ToolbarItemElement[] = React.useMemo(() => {
    return [
      <DropdownToolbarItem<string[]>
        key="beam-filter-info"
        label="Beam Filter"
        displayLabel
        tooltip="Select a beam filter"
        value={getFilterName(selectedFkFilter)}
        onChange={filterName => {
          const maybeFilter = selectedFilterList?.filters.find(
            filter => getFilterName(filter) === filterName
          );
          if (maybeFilter) setFkChannelFilter(maybeFilter);
        }}
        dropDownItems={selectedFilterList?.filters.map(filter => getFilterName(filter)) ?? []}
        widthPx={140}
      />,
      <SwitchToolbarItem
        label="FK Steps"
        menuLabel={shouldShowFkSteps ? 'Hide FK Steps' : 'Show FK Steps'}
        tooltip="Show/hide FK steps"
        key="fk-steps"
        switchValue={shouldShowFkSteps}
        onChange={() => setShouldShowFkSteps(prev => !prev)}
      />
    ];
  }, [selectedFkFilter, selectedFilterList?.filters, shouldShowFkSteps, setFkChannelFilter]);

  /**
   * Set interval based on selected signal detection
   */
  const getFkInterval = React.useCallback(() => {
    // For time interval just need the time of the raw waveform
    const selectedFilterName = FilterTypes.UNFILTERED;
    const beamChannelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> =
      getBeamChannelSegmentRecord(selectedFilterName);

    if (
      !beamChannelSegmentsRecord[selectedFilterName] ||
      beamChannelSegmentsRecord[selectedFilterName].length === 0
    ) {
      return { startTimeSecs: displayedFk.startTime, endTimeSecs: displayedFk.endTime };
    }
    let startTimeSecs = displayedFk.startTime;
    let endTimeSecs = displayedFk.endTime;
    beamChannelSegmentsRecord[selectedFilterName].forEach(cs => {
      cs.dataSegments.forEach(ds => {
        if (isDataClaimCheck(ds.data)) {
          if (ds.data.startTimeSecs < startTimeSecs) {
            startTimeSecs = ds.data.startTimeSecs;
          }

          if (ds.data.endTimeSecs > endTimeSecs) {
            endTimeSecs = ds.data.endTimeSecs;
          }
        }
      });
    });
    return { startTimeSecs, endTimeSecs };
  }, [displayedFk.endTime, displayedFk.startTime, getBeamChannelSegmentRecord]);

  // Zoom out if the SD changes
  const fkSpectraInterval = getFkInterval();
  React.useEffect(() => {
    if (fkSpectraInterval) {
      weavessRef?.waveformPanelRef?.zoomToTimeWindow(fkSpectraInterval);
    }
    // Only update zoom interval when the displayed SD changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedSignalDetection, weavessRef?.waveformPanelRef]);

  // Calculate the start time aligned to nearest step marker
  // then build the selection window marker and step markers
  const selectionMarkers = buildBeamAndTraceMarkers(
    displayedFk?.configuration.fkSpectraParameters.spectrumStepDuration,
    selectionWindowTimeRange,
    arrivalTime.value,
    displayedFk?.configuration.fkSpectraParameters.fkSpectrumWindow.lead,
    fkSpectraInterval
  );

  React.useEffect(() => {
    if (displayedSignalDetection) {
      const time = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
        SignalDetectionTypes.Util.getCurrentHypothesis(
          displayedSignalDetection.signalDetectionHypotheses
        ).featureMeasurements
      ).arrivalTime.value;
      const index = findSpectrumIndex(time, selectionMarkers.verticalMarkers ?? []);
      setCurrentMovieSpectrumIndex(index);
    }
    // Only update when displayedSignalDetection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedSignalDetection]);

  /**
   * Requests the Weavess formatted Float32Array position buffer data from the WaveformWorker.
   * Strip out the time (x values) and convert to Float32Array with new fkSpectra time interval (x values)
   *
   * @param id the id corresponding to position buffer
   * @returns a promise for a Float32Array formatted for Weavess' consumption using the
   * position buffer format: x y x y x y...
   */
  const getWaveformWrapper = async (
    id: string,
    startTime: number,
    endTime: number
  ): Promise<Float32Array> => {
    // Strip out the X value since they are scaled to the viewable interval
    const res = await getWaveform(id, startTime, endTime, fkSpectraInterval);
    const yValues = res.filter((value, index) => {
      if (index % 2 === 1) {
        return true;
      }
      return false;
    });
    // Recalculate using the fkInterval (~5 mins)
    const dataBySampleRate: WeavessTypes.DataBySampleRate = {
      values: yValues,
      startTimeSecs: fkSpectraInterval.startTimeSecs,
      endTimeSecs: fkSpectraInterval.endTimeSecs,
      sampleRate: res.length / (endTime - startTime) / 2
    };
    return WeavessUtil.convertToPositionBuffer(dataBySampleRate, fkSpectraInterval);
  };

  /**
   * Create list of SD pick markers for the station
   *
   * @returns SD pick markers
   */
  const buildSignalDetectionPickMarkers = React.useCallback(() => {
    const signalDetectionsByStation = signalDetectionQuery.data ?? [];
    // Filter out deleted SDs before calling SD by station
    const nonDeletedSignalDetections = filterDeletedSignalDetections(signalDetectionsByStation);
    const signalDetectionsForStation = signalDetectionsByStation
      ? filterSignalDetectionsByStationId(
          displayedSignalDetection.station.name,
          nonDeletedSignalDetections
        )
      : [];

    if (!fkSpectraInterval || signalDetectionsForStation.length === 0) {
      return [];
    }

    const signalDetectionPickMarkers: WeavessTypes.PickMarker[] = [];

    signalDetectionsForStation.forEach(sd => {
      const sdArrivalTime = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
        SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
          .featureMeasurements
      ).arrivalTime;
      if (
        sdArrivalTime &&
        sdArrivalTime.value >= fkSpectraInterval.startTimeSecs &&
        sdArrivalTime.value <= fkSpectraInterval.endTimeSecs
      ) {
        const sdStatus = getSignalDetectionStatus(
          sd,
          Object.values(events),
          currentOpenEventId,
          eventStatusQuery.data ?? {},
          openIntervalName
        );
        const sdColor = getSignalDetectionStatusColor(sdStatus, uiTheme);

        const isConflicted = sdIdsInConflict.includes(sd.id);
        signalDetectionPickMarkers.push({
          timeSecs: sdArrivalTime.value,
          uncertaintySecs: sdArrivalTime.standardDeviation ?? 0,
          showUncertaintyBars: false,
          id: sd.id,
          label: SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
            SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
              .featureMeasurements
          ).value.toString(),
          color: sdColor,
          isConflicted,
          isSelected: selectedSdIds.indexOf(sd.id) > -1,
          isActionTarget: validActionTargetSignalDetectionIds.indexOf(sd.id) > -1,
          isDraggable: true
        });
      }
    });
    return signalDetectionPickMarkers;
  }, [
    signalDetectionQuery.data,
    displayedSignalDetection.station.name,
    fkSpectraInterval,
    events,
    currentOpenEventId,
    eventStatusQuery?.data,
    openIntervalName,
    uiTheme,
    sdIdsInConflict,
    selectedSdIds,
    validActionTargetSignalDetectionIds
  ]);

  /**
   * Call back for drag and drop change of the moveable selection
   *
   * @param verticalMarkers List of markers in the fk plot display
   */
  const onChannelUpdateSelectionWindow = React.useCallback(
    (channelId: string, selection: WeavessTypes.SelectionWindow) => {
      if (!selectionMarkers.verticalMarkers || selectionMarkers.verticalMarkers.length === 0)
        return;
      /**
       * if both the start/end moved then the selection window moved and adjust
       * to the closest spectrum index
       * else the selection window leading edge moved
       * or the selection window lagging edge moved then adjust the lead and duration
       */
      if (
        selection.startMarker.timeSecs !== selectionWindowTimeRange.startTimeSecs &&
        selection.endMarker.timeSecs !== selectionWindowTimeRange.endTimeSecs
      ) {
        /* dragging window */
        const duration = selection.endMarker.timeSecs - selection.startMarker.timeSecs;

        const spectrumMovieIndex = findSpectrumIndex(
          selection.startMarker.timeSecs,
          selectionMarkers.verticalMarkers
        );
        setCurrentMovieSpectrumIndex(spectrumMovieIndex);

        const startTimeSecs = selectionMarkers.verticalMarkers[spectrumMovieIndex].timeSecs;
        setSelectionWindowTimeRange({
          startTimeSecs,
          endTimeSecs: startTimeSecs + duration
        });
      } else {
        /* changing lead or changing duration only */
        setSpectrumLead(arrivalTime.value - selection.startMarker.timeSecs);
        setSelectionWindowTimeRange({
          startTimeSecs: selection.startMarker.timeSecs,
          endTimeSecs: selection.endMarker.timeSecs
        });
      }
    },
    [
      arrivalTime.value,
      selectionMarkers.verticalMarkers,
      selectionWindowTimeRange.endTimeSecs,
      selectionWindowTimeRange.startTimeSecs,
      setCurrentMovieSpectrumIndex
    ]
  );

  /**
   * Renders the component.
   */
  const selectedFilterName = getFilterName(selectedFkFilter);

  // az, slowness, and fstat have the same rate and num samples
  // but we need to calculate the data to send to weavess for beam
  if (!displayedFk || fStatDataContainsUndefined(displayedFk.fstatData)) {
    return (
      <NonIdealState
        icon={IconNames.TIMELINE_LINE_CHART}
        title="Missing waveform data"
        description="Fk plots currently not supported for analyst created SDs"
      />
    );
  }
  const beamChannelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> =
    getBeamChannelSegmentRecord(selectedFilterName);
  const predictedPoint = getPredictedPoint(featurePredictionsForDisplayedSignalDetection);
  const KEY = selectedFilterName;
  const fStatChannelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};

  fStatChannelSegmentsRecord[KEY] = [
    {
      configuredInputName: 'FstatChannel',
      channelName: 'FstatChannel',
      wfFilterId: selectedFilterName,
      isSelected: false,
      dataSegments: [
        {
          color: semanticColors.waveformRaw,
          pointSize: 2,
          displayType: [WeavessTypes.DisplayType.LINE],
          data: buildDataBySampleRate(displayedFk.fstatData.fstatWf)
        }
      ]
    }
  ];

  const azimuthChannelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};
  azimuthChannelSegmentsRecord[KEY] = [
    {
      configuredInputName: 'AzimuthChannel',
      channelName: 'AzimuthChannel',
      wfFilterId: selectedFilterName,
      isSelected: false,
      dataSegments: [
        {
          displayType: [WeavessTypes.DisplayType.LINE],
          color: semanticColors.waveformRaw,
          pointSize: 2,
          data: buildDataBySampleRate(displayedFk.fstatData.azimuthWf)
        }
      ]
    }
  ];

  const slownessChannelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};
  slownessChannelSegmentsRecord[KEY] = [
    {
      configuredInputName: 'SlownessChannel',
      channelName: 'SlownessChannel',
      wfFilterId: selectedFilterName,
      isSelected: false,
      dataSegments: [
        {
          displayType: [WeavessTypes.DisplayType.LINE],
          color: semanticColors.waveformRaw,
          pointSize: 2,
          data: buildDataBySampleRate(displayedFk.fstatData.slownessWf)
        }
      ]
    }
  ];

  const stations: WeavessTypes.Station[] = [
    // Beam
    {
      id: 'Beam',
      name: 'Beam',
      defaultChannel: {
        isSelected: false,
        id: `Beam-${displayedSignalDetection.station.name}`,
        name: 'Beam',
        height: waveformPanelHeight,
        description: selectedFilterName,
        waveform: {
          channelSegmentId: selectedFilterName,
          channelSegmentsRecord: beamChannelSegmentsRecord,
          signalDetections: buildSignalDetectionPickMarkers(),
          markers: {
            selectionWindows: selectionMarkers.selectionWindows,
            verticalMarkers: shouldShowFkSteps ? selectionMarkers.verticalMarkers : undefined
          }
        }
      },
      areChannelsShowing: false
    },
    // Fstat
    {
      id: 'Fstat',
      name: 'Fstat',
      defaultChannel: {
        isSelected: false,
        id: `Fstat-${displayedSignalDetection.station.name}`,
        name: 'Fstat',
        height: waveformPanelHeight,
        // set the min to zero and max to max Fstat value
        defaultRange: {
          min: 0
        },
        description: '',
        waveform: {
          channelSegmentId: KEY,
          channelSegmentsRecord: fStatChannelSegmentsRecord,
          markers: {
            verticalMarkers: shouldShowFkSteps ? selectionMarkers.verticalMarkers : undefined
          }
        }
      },
      areChannelsShowing: false
    },
    // Azimuth
    {
      id: 'Azimuth',
      name: 'Azimuth',
      defaultChannel: {
        isSelected: false,
        id: `Azimuth-${displayedSignalDetection.station.name}`,
        name: 'Azimuth',
        height: waveformPanelHeight,
        // set the min to zero and max to 360, so that WEAVESS does not use the calculated min/max
        defaultRange: {
          min: 0,
          max: 360
        },
        description: '',
        waveform: {
          channelSegmentId: KEY,
          channelSegmentsRecord: azimuthChannelSegmentsRecord,
          markers: {
            verticalMarkers: shouldShowFkSteps ? selectionMarkers.verticalMarkers : undefined
          }
        }
      },
      areChannelsShowing: false
    },
    // Slowness
    {
      id: 'Slowness',
      name: 'Slowness',
      defaultChannel: {
        isSelected: false,
        id: `Slowness-${displayedSignalDetection.station.name}`,
        name: 'Slowness',
        height: waveformPanelHeight,
        // set the min to zero and max to max slowness value
        defaultRange: {
          min: 0,
          max: displayedFk.configuration.fkSpectraParameters.slownessGrid.maxSlowness
        },
        description: '',
        waveform: {
          channelSegmentId: KEY,
          channelSegmentsRecord: slownessChannelSegmentsRecord,
          markers: {
            verticalMarkers: shouldShowFkSteps ? selectionMarkers.verticalMarkers : undefined
          }
        }
      },
      areChannelsShowing: false
    }
  ];

  // add the Azimuth and Slowness flat lines if the appropriate predicted value exists
  const azimuthStation = stations[2];
  if (predictedPoint && azimuthStation && azimuthStation.defaultChannel.waveform) {
    azimuthStation.defaultChannel.waveform.channelSegmentsRecord[KEY][0].dataSegments.push(
      WeavessUtil.createFlatLineDataSegment(
        fkSpectraInterval.startTimeSecs,
        fkSpectraInterval.endTimeSecs,
        predictedPoint.azimuth,
        semanticColors.analystOpenEvent
      )
    );
  }

  const slownessStation = stations[3];
  if (predictedPoint && slownessStation && slownessStation.defaultChannel.waveform) {
    slownessStation.defaultChannel.waveform.channelSegmentsRecord[KEY][0].dataSegments.push(
      WeavessUtil.createFlatLineDataSegment(
        fkSpectraInterval.startTimeSecs,
        fkSpectraInterval.endTimeSecs,
        predictedPoint.slowness,
        semanticColors.analystOpenEvent
      )
    );
  }

  const channelEvents: WeavessTypes.Events = {
    onZoomChange: interval => weavessRef?.waveformPanelRef?.zoomToTimeWindow(interval),
    stationEvents: {
      defaultChannelEvents: {
        events: {
          onSignalDetectionContextMenu:
            signalDetectionEventHandlers.onSignalDetectionContextMenuHandler,
          onSignalDetectionClick: signalDetectionEventHandlers.signalDetectionClickHandler,
          onSignalDetectionDoubleClick:
            signalDetectionEventHandlers.signalDetectionDoubleClickHandler,
          onSignalDetectionDragEnd: signalDetectionEventHandlers.onSignalDetectionDragEndHandler,
          onMoveSelectionWindow: onChannelUpdateSelectionWindow,
          onUpdateSelectionWindow: onChannelUpdateSelectionWindow
        }
      }
    }
  };

  return (
    <>
      <div className="fk-plots__toolbar-container">
        <Toolbar
          toolbarWidthPx={toolbarWidth}
          parentContainerPaddingPx={0}
          itemsLeft={leftToolbarItems}
          itemsRight={rightToolbarItems}
        />
      </div>
      <Collapse isOpen={isBeamExpanded}>
        <div
          style={{
            height: `${waveformPanelHeight}px`
          }}
          className="ag-dark fk-plots-wrapper-1"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          <div className="fk-plots-wrapper-2">
            <div className="weavess-container">
              <div className="weavess-container__wrapper">
                <Weavess
                  ref={ref => {
                    if (ref && ref !== weavessRef && setWeavessRef) {
                      setWeavessRef(ref);
                    }
                  }}
                  disableToastContainer
                  viewableInterval={fkSpectraInterval}
                  displayInterval={fkSpectraInterval}
                  activeSplitModeType={undefined}
                  isControlledComponent
                  stations={stations}
                  initialConfiguration={{
                    labelWidthPx: 180,
                    defaultChannel: {
                      disableMeasureWindow: true,
                      disableMaskModification: true
                    },
                    hotKeys: weavessHotkeyDefinitions
                  }}
                  events={channelEvents}
                  getPositionBuffer={getWaveformWrapper}
                  getBoundaries={getChannelSegmentBoundaries}
                />
              </div>
            </div>
          </div>
        </div>
      </Collapse>
    </>
  );
}
