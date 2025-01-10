/* eslint-disable class-methods-use-this */
/* eslint-disable react/destructuring-assignment */
import type { CommonTypes, EventTypes, StationTypes } from '@gms/common-model';
import { SignalDetectionTypes, WaveformTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import { recordLength, Timer } from '@gms/common-util';
import {
  AnalystWaveformTypes,
  AnalystWorkspaceTypes,
  consolidateSelectedStationsAndChannels,
  filterSelectedStationsAndChannelsForCreateEventBeams
} from '@gms/ui-state';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import {
  addGlUpdateOnResize,
  addGlUpdateOnShow,
  addGlUpdateOnTab,
  clearGlUpdateOnResize,
  clearGlUpdateOnShow,
  clearGlUpdateOnTab,
  HotkeyListener,
  UILogger
} from '@gms/ui-util';
import type { WeavessWaveformDisplayProps } from '@gms/weavess/lib/components/weavess-waveform-display/types';
import { WeavessConfiguration, WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import { calculateMinMaxOffsets } from '@gms/weavess-core/lib/util';
import debounce from 'lodash/debounce';
import defer from 'lodash/defer';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import * as React from 'react';
import { toast } from 'react-toastify';
import ResizeObserver from 'resize-observer-polyfill';

import { WaveformHotkeys } from '~analyst-ui/common/hotkey-configs/waveform-hotkey-configs';
import { sortAndOrderSignalDetections } from '~analyst-ui/common/utils/signal-detection-util';
import { systemConfig } from '~analyst-ui/config/system-config';

import { WaveformControls } from './components/waveform-controls';
import {
  eventBeamParamValidation,
  nonArrayStationValidation
} from './components/waveform-controls/event-beam-dialog/event-beam-utils';
import type { FixedScaleValue } from './components/waveform-controls/scaling-options';
import { AmplitudeScalingOptions } from './components/waveform-controls/scaling-options';
import type { WaveformDisplayProps, WaveformDisplayState } from './types';
import {
  calculateZoomIntervalForCurrentOpenEvent,
  getStationContainingChannel,
  memoizedViewableIntervalWithOffset,
  setFocusToWaveformDisplay
} from './utils';
import { showWaveformLabelMenu } from './waveform-label-menu';
import type { WeavessContextData } from './weavess-context';
import { WeavessContext } from './weavess-context';
import { WeavessDisplayComponent } from './weavess-display/weavess-display-component';
import * as WaveformUtil from './weavess-stations-util';

const logger = UILogger.create('GMS_LOG_WAVEFORM', process.env.GMS_LOG_WAVEFORM);

/**
 * Primary waveform display component.
 */
export class WaveformPanel extends React.PureComponent<WaveformDisplayProps, WaveformDisplayState> {
  /** The type of the Weavess context, so this component knows how it's typed */
  public static readonly contextType: React.Context<WeavessContextData> = WeavessContext;

  /** The Weavess context. We store a ref to our Weavess instance in here. */
  public declare readonly context: React.ContextType<typeof WeavessContext>;

  private globalHotkeyListenerId: string;

  /** A Ref to the waveform display div */
  private waveformDisplayRef: HTMLDivElement | undefined;

  private readonly weavessConfiguration: WeavessTypes.Configuration;

  /**
   * The custom callback functions that we want to pass down to weavess.
   */
  private readonly weavessEventHandlers: WeavessTypes.Events;

  private readonly resizeObserver: ResizeObserver;

  private isShuttingDown = false;

  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Constructor.
   *
   * @param props The initial props
   */
  public constructor(props: WaveformDisplayProps) {
    super(props);
    this.resizeObserver = new ResizeObserver(() => {
      if (this.context?.weavessRef) {
        this.context.weavessRef.refresh();
      }
    });

    this.weavessEventHandlers = this.buildWeavessEvents();

    this.weavessConfiguration = {
      shouldRenderWaveforms: true,
      shouldRenderSpectrograms: false,
      hotKeys: this.props.weavessHotkeyDefinitions,
      backgroundColor: this.props.uiTheme.colors.gmsBackground,
      outOfBoundsColor: this.props.uiTheme.colors.weavessOutOfBounds,
      waveformDimPercent: this.props.uiTheme.colors.waveformDimPercent,
      defaultChannel: {
        disableMeasureWindow: false,
        disableMaskModification: true
      },
      nonDefaultChannel: {
        disableMeasureWindow: false,
        disableMaskModification: false
      },
      sdUncertainty: WeavessConfiguration.defaultConfiguration.sdUncertainty
    };
    this.state = {
      analystNumberOfWaveforms:
        this.props.processingAnalystConfiguration.waveform.analysisModeSettings[
          this.props.analysisMode
        ].numberOfWaveforms,
      // the range of waveform data displayed initially
      currentTimeInterval: props.currentTimeInterval,
      isMeasureWindowVisible: false,
      amplitudeScaleOption: AmplitudeScalingOptions.AUTO,
      currentOpenEventId: undefined,
      fixedScaleVal: 0,
      scaleAmplitudeChannelName: undefined,
      scaledAmplitudeChannelMinValue: -1,
      scaledAmplitudeChannelMaxValue: 1
    };
  }

  /**
   * Updates the derived state from the next props. Returns null if no change to state
   *
   * @param nextProps The next (new) props
   * @param prevState The previous state
   */
  public static getDerivedStateFromProps(
    nextProps: WaveformDisplayProps,
    prevState: WaveformDisplayState
  ): Partial<WaveformDisplayState> | null {
    const hasTimeIntervalChanged = !isEqual(
      nextProps.currentTimeInterval,
      prevState.currentTimeInterval
    );

    if (hasTimeIntervalChanged || nextProps.currentOpenEventId !== prevState.currentOpenEventId) {
      return {
        currentTimeInterval: nextProps.currentTimeInterval,
        currentOpenEventId: nextProps.currentOpenEventId
      };
    }

    // return null to indicate no change to state.
    return null;
  }

  /**
   * Invoked when the component mounted.
   */
  public componentDidMount() {
    if (this.isShuttingDown) {
      return;
    }

    if (this.props.glContainer) {
      addGlUpdateOnShow(this.props.glContainer, this.refreshWeavess);
      addGlUpdateOnResize(this.props.glContainer, this.refreshWeavess);
      addGlUpdateOnTab(this.props.glContainer, this.refreshWeavess);
    }

    this.globalHotkeyListenerId = HotkeyListener.subscribeToGlobalHotkeyListener();
    if (this.waveformDisplayRef) {
      this.resizeObserver.observe(this.waveformDisplayRef);
    }
  }

  /**
   * Invoked when the component has rendered.
   *
   * @param prevProps The previous props
   */
  public componentDidUpdate(prevProps: WaveformDisplayProps) {
    this.maybeUpdateNumWaveforms(prevProps);
    this.maybeUpdateBaseStationTime();
    // if the zoom changed externally in state(e.g. close event resetting it) update weavess zoom
    if (
      prevProps.zoomInterval !== this.props.zoomInterval &&
      this.context.weavessRef?.waveformPanelRef?.getCurrentZoomInterval() !==
        this.props.zoomInterval &&
      this?.context?.weavessRef?.waveformPanelRef
    ) {
      this.context.weavessRef.waveformPanelRef.zoomToTimeWindow(this.props.zoomInterval);
    }
    this.maybeUpdateOffset();
  }

  /**
   * Cleanup and stop any in progress Waveform queries
   */
  public componentWillUnmount(): void {
    if (this.waveformDisplayRef) {
      this.resizeObserver.unobserve(this.waveformDisplayRef);
    }
    HotkeyListener.unsubscribeFromGlobalHotkeyListener(this.globalHotkeyListenerId);
    this.isShuttingDown = true;
    if (this.props.glContainer) {
      clearGlUpdateOnShow(this.props.glContainer, this.refreshWeavess);
      clearGlUpdateOnResize(this.props.glContainer, this.refreshWeavess);
      clearGlUpdateOnTab(this.props.glContainer, this.refreshWeavess);
    }
  }

  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  // eslint-disable-next-line react/sort-comp
  private readonly refreshWeavess = () => {
    if (this.context?.weavessRef) {
      this.context.weavessRef.refresh();
    }
  };

  /**
   * Checks the analysis mode, and sets waveforms display amount based on result
   */

  private readonly maybeUpdateNumWaveforms = (prevProps: WaveformDisplayProps) => {
    if (this.props.analysisMode !== prevProps.analysisMode) {
      const numWaveforms =
        this.props.processingAnalystConfiguration.waveform.analysisModeSettings[
          this.props.analysisMode
        ].numberOfWaveforms;
      this.setAnalystNumberOfWaveforms(numWaveforms);
    }
  };

  /**
   * If offsets have changed, force update viewableRange
   */
  private readonly maybeUpdateOffset = () => {
    if (this.props.weavessStations.length > 0) {
      const { maxOffset, minOffset } = calculateMinMaxOffsets(this.props.weavessStations);

      if (this.props.minimumOffset !== minOffset) {
        this.props.setMinimumOffset(minOffset);
      }
      if (this.props.maximumOffset !== maxOffset) {
        this.props.setMaximumOffset(maxOffset);
      }
    }
  };

  private readonly maybeUpdateBaseStationTime = () => {
    if (this.props.weavessStations.length > 0) {
      const { baseStationTime } = this.props.weavessStations[0].defaultChannel;
      if (this.props.baseStationTime !== baseStationTime) {
        this.props.setBaseStationTime(baseStationTime);
      }
    }
  };

  /**
   * @returns the list of stations from the station definition query. This result is memoized
   * so that the list is referentially stable between renders if the result of the query has
   * not changed. Note that this list can be empty.
   */
  private readonly getStations = (): StationTypes.Station[] => this.props.stationsQuery.data || [];

  /**
   * ! Legacy Code
   * Returns the current open event.
   */
  private readonly currentOpenEvent = (): EventTypes.Event | undefined =>
    this.props?.events?.find(e => e.id === this.props.currentOpenEventId);

  /**
   * Returns the associated SD hypothesis IDs based on the current open event and stage
   * Or empty array if not found
   */
  private readonly getAssociatedSignalDetectionHypothesesIds = (): string[] => {
    const eventHypo = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      this.currentOpenEvent(),
      this.props.currentStageName
    );
    return eventHypo?.associatedSignalDetectionHypotheses.map(hypothesis => hypothesis.id.id) || [];
  };

  /**
   * ! Legacy Code
   * Returns the weavess event handler configuration.
   *
   * @returns the events
   */
  private readonly buildWeavessEvents = (): WeavessTypes.Events => {
    const channelEvents: WeavessTypes.ChannelEvents = {
      labelEvents: {
        onChannelExpanded: this.onStationExpanded,
        onChannelCollapsed: this.onStationCollapse,
        onContextMenu: this.onLabelContextMenu
      },
      events: {
        onMeasureWindowUpdated: this.onMeasureWindowUpdated
      }
    };

    return {
      onZoomChange: this.onZoomChange,
      stationEvents: {
        defaultChannelEvents: channelEvents,
        nonDefaultChannelEvents: channelEvents
      },
      onResetAmplitude: this.resetChannelScaledAmplitude,
      onMount: this.onWeavessMount,
      onUnmount: this.onWeavessUnmount,
      onCanvasResize: this.updateStationHeights
    };
  };

  /**
   * ! Legacy Code
   * Sets the mode.
   *
   * @param mode the mode configuration to set
   */
  private readonly setMode = (mode: AnalystWorkspaceTypes.WaveformDisplayMode) => {
    this.props.setMode(mode);

    // auto select the first signal detection if switching to MEASUREMENT mode
    if (mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT) {
      const currentOpenEvent = this.currentOpenEvent();

      if (currentOpenEvent) {
        const associatedSignalDetectionHypothesisIds =
          this.getAssociatedSignalDetectionHypothesesIds();

        const signalDetections = this.props.signalDetections.filter(sd =>
          this.checkIfSdIsFmPhaseAndAssociated(sd, associatedSignalDetectionHypothesisIds)
        );

        let signalDetectionToSelect;
        // Broken legacy code data types have changed
        const distances = [];
        if (signalDetections.length > 0) {
          // sort the signal detections
          const sortedEntries = sortAndOrderSignalDetections(
            signalDetections,
            this.props.selectedSortType,
            distances
          );
          signalDetectionToSelect = sortedEntries.shift();
          this.props.setSelectedSdIds([signalDetectionToSelect.id]);
        } else {
          this.props.setSelectedSdIds([]);
        }

        // mark the measure window as being visible; measurement mode auto shows the measure window
        this.setState({ isMeasureWindowVisible: true });
        // auto set the waveform alignment to align on the default phase

        this.setWaveformAlignment(
          AlignWaveformsOn.PREDICTED_PHASE,
          this.props.defaultSignalDetectionPhase,
          this.props.shouldShowPredictedPhases
        );

        // auto zoom the waveform display to match the zoom of the measure window
        if (signalDetectionToSelect) {
          const arrivalTime: number =
            SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
              SignalDetectionTypes.Util.getCurrentHypothesis(
                signalDetectionToSelect.signalDetectionHypotheses
              ).featureMeasurements
            ).arrivalTime.value;
          const { startTimeOffsetFromSignalDetection } =
            systemConfig.measurementMode.displayTimeRange;
          const { endTimeOffsetFromSignalDetection } =
            systemConfig.measurementMode.displayTimeRange;
          const startTimeSecs = arrivalTime + +startTimeOffsetFromSignalDetection;
          const endTimeSecs = arrivalTime + +endTimeOffsetFromSignalDetection;

          // adjust the zoom time window for the selected alignment
          this.onZoomChange({ startTimeSecs, endTimeSecs });
        }
      }
    } else {
      // leaving measurement mode; mark the measurement window as not visible
      this.setState({ isMeasureWindowVisible: false });
    }
  };

  /**
   * ! Legacy Code
   * Check if the signal detection is FM Phase and Associated.
   *
   * @param sd the signal detection
   * @param associatedSignalDetectionHypothesisIds string ids
   * @returns a boolean determining if sd is associated and a measurement phase
   */
  private readonly checkIfSdIsFmPhaseAndAssociated = (
    sd: SignalDetectionTypes.SignalDetection,
    associatedSignalDetectionHypothesisIds: string[]
  ): boolean => {
    const phase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
        .featureMeasurements
    ).value;
    // return if associated and a measurement phase
    return (
      includes(
        associatedSignalDetectionHypothesisIds,
        SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).id.id
      ) && includes(systemConfig.measurementMode.phases, phase)
    );
  };

  /**
   * Clears split stations by setting split station to undefined
   */
  private readonly closeSplitWeavessChannelsOverlay = () => {
    if (!this.props.splitStation.activeSplitModeType) {
      return;
    }
    const splitStation: AnalystWaveformTypes.SplitStation = {
      activeSplitModeType: undefined,
      stationId: undefined,
      timeSecs: -1,
      phase: undefined
    };
    this.props.setSplitStation(splitStation);
  };

  /**
   *
   * Create a signal detection or split the stations if that is not possible due to
   * multiple channel segments
   */
  private readonly createSignalDetection = async (
    stationId: string,
    channelName: string,
    timeSecs: number,
    phase?: string,
    isTemporary?: boolean
  ): Promise<void> => {
    if (
      !isTemporary &&
      WaveformUtil.determineSplitWeavessStations(
        stationId,
        timeSecs,
        this.props.channelFilters,
        this.props.weavessStations
      )
    ) {
      // split the stations but do not create a detection
      const splitStation: AnalystWaveformTypes.SplitStation = {
        activeSplitModeType: WeavessTypes.SplitMode.CREATE_SD,
        stationId,
        timeSecs,
        phase
      };
      return this.props.setSplitStation(splitStation);
    }
    // createSignalDetection returns a promise which is used downstream
    return this.props.createSignalDetection(stationId, channelName, timeSecs, phase, isTemporary);
  };

  /**
   * Select a waveform channel segment or open split mode to select one in the case of overlapping waveforms
   *
   * @param stationId
   * @param timeSecs
   * @param channelSegments
   * @param isMeasureWindow
   * @param phase
   * @param isTemporary
   * @returns
   */
  private readonly updateSelectedWaveforms = async (
    stationId: string,
    timeSecs: number,
    channelSegments: WeavessTypes.ChannelSegment[],
    signalDetections: SignalDetectionTypes.SignalDetection[],
    isMultiSelect: boolean,
    optionalParams: { isMeasureWindow?: boolean; phase?: string; isTemporary?: boolean }
  ): Promise<void> => {
    const { isMeasureWindow, phase, isTemporary } = optionalParams;
    if (
      !isTemporary &&
      !isMeasureWindow &&
      WaveformUtil.determineSplitWeavessStations(
        stationId,
        timeSecs,
        this.props.channelFilters,
        this.props.weavessStations
      )
    ) {
      // Set the waveform selection split mode
      const splitStation: AnalystWaveformTypes.SplitStation = {
        activeSplitModeType: WeavessTypes.SplitMode.SELECT_WAVEFORM,
        stationId,
        timeSecs,
        phase
      };
      this.props.setSplitStation(splitStation);
    }
    return this.props.updateSelectedWaveforms(
      stationId,
      timeSecs,
      channelSegments,
      signalDetections,
      isMultiSelect,
      isMeasureWindow
    );
  };

  /**
   * Toggle the measure window visibility within weavess.
   */
  private readonly toggleMeasureWindowVisibility = () => {
    if (this.context && this.context.weavessRef) {
      this.context.weavessRef.toggleMeasureWindowVisibility();
    }
  };

  /**
   * The function for injecting a right click context menu for labels into weavess
   *
   * @param e the mouse click event, used to determine menu position
   * @param channelId
   * @param amplitudeMinValue
   * @param amplitudeMaxValue
   * @param isDefaultChannel describes weather a weavess top-level channel (station) has been clicked or a weavess sub-channel (channel) has been clicked
   * @param isMeasureWindow
   */
  private readonly onLabelContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    amplitudeMinValue: number,
    amplitudeMaxValue: number,
    isDefaultChannel: boolean,
    isMeasureWindow: boolean
  ) => {
    showWaveformLabelMenu(e, {
      isDefaultChannel,
      isMeasureWindow,
      channelId,
      selectedStationIds: this.props.selectedStationIds,
      manuallyScaledChannelIds:
        this.context.weavessRef?.waveformPanelRef
          ?.getManualAmplitudeScaledChannels()
          .map(channel => channel.id) ?? [],
      channelSegments: this.props.channelSegments,
      waveformClientState: this.props.waveformClientState,
      weavessStations: this.props.weavessStations,
      amplitudeScaleOption: this.state.amplitudeScaleOption,
      amplitudeMinValue,
      amplitudeMaxValue,
      showAllChannels: this.showAllChannels,
      hideStationOrChannel: this.hideStationOrChannel,
      scaleAllAmplitudes: this.scaleAllAmplitudes,
      resetAmplitudeSelectedChannels: this.resetSelectedWaveformAmplitudeScaling
    });
  };

  /**
   * Event handler for station expansion. Will set the areChannelsShowing flag as true
   * then it calls load waveforms for all the station's channels.
   *
   * @param stationName the name of the expanded station
   */
  private readonly onStationExpanded = (stationName: string) => {
    this.props.setStationExpanded(stationName);
  };

  /**
   * Event handler for station collapsing. Sets the station visibility changes object
   * to be collapsed.
   *
   * @param stationName the name of the collapsed station
   */
  private readonly onStationCollapse = (stationName: string) => {
    this.props.setStationExpanded(stationName, false);
  };

  /**
   * Wrapper around props.onWeavessMount. This makes it referentially stable, and prevents the value from
   * being captured at the time the Weavess events are created (in the constructor).
   *
   * @param weavessInstance The instance of weavess, which exposes public params and methods
   */
  private readonly onWeavessMount = (weavessInstance: WeavessTypes.WeavessInstance) => {
    if (this.props.onWeavessMount) {
      this.props.onWeavessMount(weavessInstance);
    }
  };

  /**
   * Wrapper around props.onWeavessMount. This makes it referentially stable, and prevents the value from
   * being captured at the time the Weavess events are created (in the constructor).
   */
  private readonly onWeavessUnmount = () => {
    if (this.props.onWeavessUnmount) {
      this.props.onWeavessUnmount();
    }
  };

  /**
   * Event handler that is invoked and handled when the Measure Window is updated.
   *
   * @param isVisible true if the measure window is updated
   */
  private readonly onMeasureWindowUpdated = (isVisible: boolean) => {
    this.setState({
      isMeasureWindowVisible: isVisible
    });
  };

  /**
   * @returns true if the event includes a scrolling key (a or d).
   */
  private readonly isScrollingKey = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey) return false;
    return e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd';
  };

  /**
   * @returns true if the event includes a loading key (shift a or shift d).
   */
  private readonly isLoadingKey = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey) return false;
    return (
      (e.shiftKey && e.key.toLowerCase() === 'a') || (e.shiftKey && e.key.toLowerCase() === 'd')
    );
  };

  /**
   * Pans left or right and load data but only if we are not in split mode
   */
  private readonly handleScrollingKey = (e: React.KeyboardEvent) => {
    const isSplitChannelOverlayOpen = !!this.props.splitStation.activeSplitModeType;
    const newZoomInterval: WeavessTypes.TimeRange = {
      startTimeSecs: this.props.zoomInterval.startTimeSecs,
      endTimeSecs: this.props.zoomInterval.endTimeSecs
    };
    const displayInterval = memoizedViewableIntervalWithOffset(
      this.props.viewableInterval,
      this.props.minimumOffset,
      this.props.maximumOffset,
      this.props.baseStationTime
    );
    const duration = this.props.zoomInterval.endTimeSecs - this.props.zoomInterval.startTimeSecs;
    const scrollAdjustment = duration * this.props.processingAnalystConfiguration.waveform.panRatio;
    if (e.key.toLowerCase() === 'a' && !isSplitChannelOverlayOpen) {
      newZoomInterval.startTimeSecs -= scrollAdjustment;
      newZoomInterval.endTimeSecs -= scrollAdjustment;
      if (newZoomInterval.startTimeSecs < displayInterval.startTimeSecs) {
        newZoomInterval.startTimeSecs = displayInterval.startTimeSecs;
        newZoomInterval.endTimeSecs = displayInterval.startTimeSecs + duration;
      }
    } else if (e.key.toLowerCase() === 'd' && !isSplitChannelOverlayOpen) {
      newZoomInterval.startTimeSecs += scrollAdjustment;
      newZoomInterval.endTimeSecs += scrollAdjustment;
      if (newZoomInterval.endTimeSecs > displayInterval.endTimeSecs) {
        newZoomInterval.endTimeSecs = displayInterval.endTimeSecs;
        newZoomInterval.startTimeSecs = displayInterval.endTimeSecs - duration;
      }
    }
    if (this?.context?.weavessRef?.waveformPanelRef) {
      this.context.weavessRef.waveformPanelRef.zoomToTimeWindow(newZoomInterval);
    }
  };

  /** // TODO this should be a proper hotkey not a listener
   * Event handler for when a key is pressed
   *
   * @param e keyboard event as React.KeyboardEvent<HTMLDivElement>
   */
  private readonly onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isSplitChannelOverlayOpen = !!this.props.splitStation.activeSplitModeType;
    if (this.isLoadingKey(e) && !isSplitChannelOverlayOpen) {
      const loadType: WaveformTypes.LoadType =
        e.key.toLowerCase() === 'a' ? WaveformTypes.LoadType.Earlier : WaveformTypes.LoadType.Later;
      this.loadData(loadType);
    } else if (this.isScrollingKey(e)) {
      debounce(() => this.handleScrollingKey(e), 100);
    }
  };

  /**
   *
   * Toggle alignment.  Keypress has already been validated so no params needed
   *
   */
  private readonly toggleAlignment = () => {
    const defaultPhaseAlignment =
      this.props.processingAnalystConfiguration.zasDefaultAlignmentPhase;
    if (this.props.currentOpenEventId) {
      if (
        this.props.alignWaveformsOn === AlignWaveformsOn.TIME ||
        this.props.alignWaveformsOn === AlignWaveformsOn.OBSERVED_PHASE ||
        this.props.phaseToAlignOn !== defaultPhaseAlignment
      ) {
        this.setWaveformAlignment(AlignWaveformsOn.PREDICTED_PHASE, defaultPhaseAlignment, true);
      } else {
        this.setWaveformAlignment(
          AlignWaveformsOn.TIME,
          undefined,
          this.props.shouldShowPredictedPhases
        );
      }
    } else {
      toast.info('Open an event to change waveform alignment', {
        toastId: 'toast-open-event-to-change-waveform-alignment'
      });
    }
  };

  /**
   * Display the number of waveforms chosen by the analyst
   * Also updates the state variable containing the Weavess stations
   */
  private readonly updateStationHeights = (): void => {
    const height = this.calculateStationHeight();
    if (this.props.channelHeight !== height) {
      this.props.setChannelHeight(height);
    }
  };

  /**
   * Calculate height for the station based of number of display
   */
  private readonly calculateStationHeight = (): number => {
    const viewportBoundingRect =
      this.context?.weavessRef?.waveformPanelRef?.getViewportBoundingClientRect();
    let height;
    if (viewportBoundingRect?.height) {
      height = viewportBoundingRect.height / this.state.analystNumberOfWaveforms - 1; // account for 1 pixel border
    } else if (this.props.channelHeight > 0) {
      height = this.props.channelHeight;
    } else {
      logger.warn(`Failed to calculate station heights falling back to system default`);
      height = systemConfig.defaultWeavessConfiguration.stationHeightPx;
    }
    return Math.round(height);
  };

  /**
   *
   * Sets the waveform alignment and adjust the sort type if necessary.
   *
   * @param alignWaveformsOn the waveform alignment setting
   * @param phaseToAlignOn the phase to align on
   * @param shouldShowPredictedPhases true if predicted phases should be displayed
   */
  private readonly setWaveformAlignment = (
    alignWaveformsOn: AlignWaveformsOn,
    phaseToAlignOn: string | undefined,
    shouldShowPredictedPhases: boolean
  ) => {
    this.props.updateWaveformAlignment(
      phaseToAlignOn,
      alignWaveformsOn,
      shouldShowPredictedPhases,
      this.props
    );
  };

  /**
   * Sets the number of waveforms to be displayed.
   *
   * @param value the number of waveforms to display (number)
   * @param valueAsString the number of waveforms to display (string)
   */
  public readonly setAnalystNumberOfWaveforms = (value: number): void => {
    let analystNumberOfWaveforms = value;
    // Minimum number of waveforms must be 1
    if (analystNumberOfWaveforms < 1) {
      analystNumberOfWaveforms = 1;
    }
    if (this.state.analystNumberOfWaveforms !== analystNumberOfWaveforms) {
      this.setState(
        {
          analystNumberOfWaveforms
        },
        () => {
          this.updateStationHeights();
        }
      );
    }
  };

  /**
   * Toasts a notification when the user hits the max data loaded limit.
   */
  private readonly toastLoadingLimitReached = () =>
    toast.info(`Additional data limit reached`, { toastId: 'toast-loading-limit-reached' });

  /**
   * Load more data to the waveform display
   * call will dispatch the new viewable interval.
   * @param loadType type of data to load
   */
  private readonly loadData = (loadType: WaveformTypes.LoadType) => {
    if (this.context.weavessRef?.waveformPanelRef) {
      this.props.loadData(loadType, {
        onLoadingLimitReached: this.toastLoadingLimitReached
      });
    }
  };

  /**
   * Called when ZAS button is clicked.
   * This sets the sort type to distance, sets the default alignment phase, aligns waveforms on predicted phase,
   * ensure show predicted phases, ensures stations with signal detections associated to current open event are
   * visible. Dispatch these changes first and then set state that will trigger the actual zooming. This is done
   * to get the waveform display into the right state before zoom because the state was not being dispatched before
   * the needed zoom calculations were made.
   */
  private readonly zoomAlignSort = () => {
    // Sort
    if (
      this.props.selectedSortType !== AnalystWorkspaceTypes.WaveformSortType.distance &&
      this.props.currentOpenEventId
    ) {
      this.props.setSelectedSortType(AnalystWorkspaceTypes.WaveformSortType.distance);
    }
    // Align
    const phase = this.props.processingAnalystConfiguration.zasDefaultAlignmentPhase;
    this.props.setPhaseToAlignOn(phase);

    // Zoom
    if (!this.props.currentOpenEventId) {
      this.context.weavessRef?.waveformPanelRef?.zoomToTimeWindow(this.props.viewableInterval);
    } else {
      const calculatedZoomInterval = calculateZoomIntervalForCurrentOpenEvent(
        this.props,
        phase,
        true
      );
      if (calculatedZoomInterval) {
        defer(
          () => this.context?.weavessRef?.waveformPanelRef?.zoomToTimeWindow(calculatedZoomInterval)
        );
      } else if (!this.props.featurePredictionQuery.isLoading) {
        this.context?.weavessRef?.waveformPanelRef?.zoomToTimeWindow(this.props.viewableInterval);
        toast.info(
          `Unable to calculate zoom interval, check feature prediction data and station data has loaded`,
          { toastId: 'toast-zas-unable-to-calculate-interval' }
        );
      }
    }

    if (this.props.alignWaveformsOn !== AnalystWorkspaceTypes.AlignWaveformsOn.PREDICTED_PHASE) {
      this.props.setAlignWaveformsOn(AnalystWorkspaceTypes.AlignWaveformsOn.PREDICTED_PHASE);
    }
    if (!this.props.shouldShowPredictedPhases) {
      this.props.setShouldShowPredictedPhases(true);
    }
  };

  /**
   * Handle when the zoom changes within weavess. Catches errors that result from asynchronously updating
   * zoom interval—which can result in errors if the user changes intervals before this function
   * gets called.
   *
   * @param timeRange
   */
  private readonly onZoomChange = (timeRange: CommonTypes.TimeRange): void => {
    try {
      this.props.setZoomInterval(timeRange);
    } catch (error) {
      // this is an expected case when switching intervals while zoom updates are pending.
      // We should handle this gracefully. Throw all other errors.
      if (error.message !== AnalystWaveformTypes.ZOOM_INTERVAL_TOO_LARGE_ERROR_MESSAGE) throw error;
    }
  };

  /**
   * Remove scaled amplitude of all channels if set
   */
  private readonly resetChannelScaledAmplitude = (): void => {
    // If scaled to channel is set unset it
    if (this.state.scaleAmplitudeChannelName !== undefined) {
      this.setState({
        scaleAmplitudeChannelName: undefined,
        scaledAmplitudeChannelMinValue: -1,
        scaledAmplitudeChannelMaxValue: 1
      });
    }
  };

  /**
   * Set amplitude scaling option called by Waveform Control's Scaling Option
   *
   * @param option AmplitudeScalingOptions (fixed or auto)
   */
  private readonly setAmplitudeScaleOption = (option: AmplitudeScalingOptions) => {
    this.setState({
      amplitudeScaleOption: option,
      scaleAmplitudeChannelName: undefined,
      scaledAmplitudeChannelMinValue: -1,
      scaledAmplitudeChannelMaxValue: 1
    });

    this.resetAmplitudes();
  };

  /**
   * Set fixed scale value when scaling option is set to Fixed
   *
   * @param val FixedScaleValue (number or current)
   */
  private readonly setFixedScaleVal = (val: FixedScaleValue) => {
    if (this.isShuttingDown) {
      return;
    }
    this.setState({
      fixedScaleVal: val,
      scaleAmplitudeChannelName: undefined,
      scaledAmplitudeChannelMinValue: -1,
      scaledAmplitudeChannelMaxValue: 1
    });
    this.resetAmplitudes();
  };

  /**
   * Reset amplitude in the waveform panels
   *
   * @param force Reset amplitudes no matter the scaling conditions
   */
  private readonly resetAmplitudes = (force = false): void => {
    if (this.context?.weavessRef) {
      if (
        force ||
        (this.state.amplitudeScaleOption !== AmplitudeScalingOptions.FIXED &&
          this.state.fixedScaleVal !== 'Current')
      ) {
        this.context.weavessRef.resetWaveformPanelAmplitudes();
      }
    }
  };

  /**
   * Reset amplitude in the waveform panels
   *
   * @param channelIds channel names to reset amplitude scaling
   * @param isMeasureWindow which waveform panel (main or measure window)
   */
  private readonly resetSelectedWaveformAmplitudeScaling = (
    channelIds: string[],
    isMeasureWindow = false
  ): void => {
    if (this.context?.weavessRef) {
      this.context.weavessRef.resetSelectedWaveformAmplitudeScaling(channelIds, isMeasureWindow);
    }
  };

  /**
   * For stations, sets the visibility for provided station to false (not visible)
   * For channels, sets the visibility for provided channel to false (not to show even if parent station is expanded)
   *
   * @param stationOrChannelName the name of the station or channel
   */
  private readonly hideStationOrChannel = (stationOrChannelName: string): void => {
    const parentStation = getStationContainingChannel(stationOrChannelName, this.getStations());
    if (parentStation) {
      this.props.setChannelVisibility(parentStation, stationOrChannelName, false);
    } else {
      this.props.setStationVisibility(stationOrChannelName, false);
    }
    setFocusToWaveformDisplay();
  };

  /**
   * Sets the visibility for all channels belonging to the named station to true
   *
   * @param stationName the name of the station for which to show all of its channels
   */
  private readonly showAllChannels = (stationName: string): void => {
    this.props.showAllChannels(stationName);
  };

  /**
   * Call to scale all amplitudes using the selected channel if one is selected, if not
   * warns User and returns
   */
  private readonly scaleAllAmplitudesUsingSelectedChannel = (): void => {
    // Only perform scale all channels operation if 1 channel is selected.
    // If no channel is selected ignore the key sequence
    if (this.props.selectedStationIds.length === 0) {
      toast.info('Please select a channel to scale', {
        toastId: `toast-select-channel-to-scale`
      });
      return;
    }
    if (this.props.selectedStationIds.length > 1) {
      toast.warn('Cannot scale to channel when more than one channel is selected', {
        toastId: `toast-unable-to-scale-to-channel-multiple-selected`
      });
      return;
    }

    if (this.context.weavessRef?.waveformPanelRef) {
      const channelName = this.props.selectedStationIds[0];
      /** Find the WeavessChannel to check if a waveform is loaded */
      const weavessChannel: WeavessTypes.Channel | undefined = WeavessUtil.findChannelInStations(
        this.props.weavessStations,
        channelName
      );

      // Check to see if there is a waveform loaded
      if (recordLength(weavessChannel?.waveform?.channelSegmentsRecord) === 0) {
        toast.warn(`${channelName} has no waveform loaded to scale from`, {
          toastId: `toast-no waveform-loaded-to-scale`
        });
        return;
      }

      // Look up the channel amplitudes from Weaves (in case the channel has been manually scaled)
      const yBounds: WeavessTypes.YAxisBounds | undefined =
        this.context.weavessRef.waveformPanelRef.getChannelWaveformYAxisBounds(channelName);
      if (yBounds) {
        this.scaleAllAmplitudes(channelName, yBounds.minAmplitude, yBounds.maxAmplitude);
      } else {
        logger.warn(`Failed to find Amplitude for channel ${channelName}`);
      }
    }
  };

  /**
   * Sets all other channel's amplitudes to this channel's amplitudes. It does this by
   * setting the state that is then passed to the WeavessStations
   *
   * @param name Name of channel from which the amplitudes values are referenced
   * @param amplitudeMinValue Min value from reference channel
   * @param amplitudeMaxValue Max value from reference channel
   * @param isDefaultChannel Is this a station are a child channel
   */
  private readonly scaleAllAmplitudes = (
    channelName: string,
    amplitudeMinValue: number,
    amplitudeMaxValue: number
  ): void => {
    // Reset any manual scaling before setting amplitude values of selected channel
    this.resetAmplitudes();
    this.setState({
      scaleAmplitudeChannelName: channelName,
      scaledAmplitudeChannelMinValue: amplitudeMinValue,
      scaledAmplitudeChannelMaxValue: amplitudeMaxValue
    });
  };

  // eslint-disable-next-line react/sort-comp
  private readonly buildWeavessProps = memoizeOne(
    (
      stations: WeavessTypes.Station[],
      props: WaveformDisplayProps
    ): WeavessWaveformDisplayProps => {
      return {
        viewableInterval: props.viewableInterval,
        currentInterval: props.currentTimeInterval,
        displayInterval: memoizedViewableIntervalWithOffset(
          props.viewableInterval,
          props.minimumOffset,
          props.maximumOffset,
          props.baseStationTime
        ),
        splitModePickMarkerColor: props.currentOpenEventId
          ? props.uiTheme?.colors?.openEventSDColor
          : props.uiTheme?.colors?.unassociatedSDColor,
        showMeasureWindow:
          props.measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT,
        stations,
        events: this.weavessEventHandlers,
        initialConfiguration: this.weavessConfiguration,
        flex: false,
        panRatio: props.processingAnalystConfiguration.waveform.panRatio,
        extraInfoBar: this.buildInfoBar(props.alignWaveformsOn, props.phaseToAlignOn),
        activeSplitModeType: this.props.splitStation.activeSplitModeType
      };
    }
  );

  /**
   * @returns a list of all of the weavess stations that are visible (should be rendered,
   * not necessarily on screen).
   */
  private readonly getAllVisibleWeavessStations = memoizeOne(weavessStations =>
    weavessStations.filter(weavessStation => this.props.isStationVisible(weavessStation.name))
  );

  /**
   * Memoized build info bar for alignment
   */
  private readonly buildInfoBar = memoizeOne(
    (alignWaveformsOn: AlignWaveformsOn, phaseToAlignOn: string | undefined): JSX.Element => {
      if (!phaseToAlignOn) {
        logger.debug('no phase to align on');
      }
      if (this.props.alignWaveformsOn === AlignWaveformsOn.TIME)
        return <span>Aligned on: Time</span>;
      return <span>{`Aligned on: ${alignWaveformsOn}: ${phaseToAlignOn}`}</span>;
    }
  );

  private readonly createEventBeamHandler = async () => {
    if (!this.props.currentOpenEventId) {
      toast.info('Open an event to compute event beams', {
        toastId: 'toast-open-event-to-compute-event-beams'
      });
      return;
    }

    const selectedStations = this.props.stationsQuery.data
      ? this.props.stationsQuery.data.filter(
          station => this.props.selectedStationIds.indexOf(station.name) !== -1
        )
      : [];

    const selectedChannels = this.props.populatedChannels.filter(
      channel => this.props.selectedStationIds.indexOf(channel.name) !== -1
    );

    const visibleStations = this.props.getVisibleStationsFromStationList(
      this.props.stationsQuery.data ?? []
    );
    const signalDetectionRecord: Record<string, SignalDetectionTypes.SignalDetection> = {};

    this.props.signalDetections.forEach(sd => {
      signalDetectionRecord[sd.id] = sd;
    });

    const [stations, channels] = consolidateSelectedStationsAndChannels(
      selectedStations,
      selectedChannels,
      visibleStations
    );

    const [filteredStations, filteredChannels, , , message] =
      filterSelectedStationsAndChannelsForCreateEventBeams(
        stations,
        channels,
        visibleStations,
        signalDetectionRecord,
        this.currentOpenEvent(),
        this.props.currentStageName,
        this.props.currentPhase
      );

    if (message) {
      if (filteredStations.length === 0) {
        toast.error(
          <div>
            <div>{message.summary}.</div>
            <div>{message.details}</div>
          </div>,
          {
            toastId: message.details
          }
        );
        return;
      }
    }

    const nonArrayStationNamesAndError = nonArrayStationValidation(selectedStations);

    // if validation passes call createPreconfiguredEventBeams else open the dialog so user can address issues
    if (
      (nonArrayStationNamesAndError === undefined ||
        nonArrayStationNamesAndError?.[1].length === 0) &&
      eventBeamParamValidation(
        stations,
        channels,
        this.props.currentPhase,
        this.props.beamformingTemplates,
        this.props.featurePredictionQuery
      ) === null
    ) {
      // toast an information toast about filtered out stations if selected
      if (message && (selectedStations.length > 0 || selectedChannels.length > 0))
        toast.info(
          <div>
            <div>{message.summary}.</div>
            <div>{message.details}</div>
          </div>,
          {
            toastId: message.details
          }
        );
      await this.props.createPreconfiguredEventBeams(filteredStations, filteredChannels);
    } else {
      this.props.setEventBeamDialogVisibility(true);
    }
  };

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    Timer.start('[ui waveform panel] render');
    const stations = this.getAllVisibleWeavessStations(this.props.weavessStations);

    Timer.end('[ui waveform panel] render');

    return (
      <WaveformHotkeys
        zoomAlignSort={this.zoomAlignSort}
        createEventBeam={this.createEventBeamHandler}
        selectedSignalDetectionsIds={this.props.selectedSdIds}
        featurePredictionQueryDataUnavailable={
          (this.props.featurePredictionQuery?.data === null ||
            this.props.featurePredictionQuery?.data === undefined ||
            this.props.featurePredictionQuery.data?.receiverLocationsByName === null ||
            this.props.featurePredictionQuery.data?.receiverLocationsByName === undefined) &&
          !this.props.featurePredictionQuery.isLoading
        }
        setPhaseMenuVisibility={this.props.setPhaseMenuVisibility}
        setCreateEventMenuState={this.props.setCreateEventMenuState}
        setCurrentPhaseMenuVisibility={this.props.setCurrentPhaseMenuVisibility}
        toggleAlignment={this.toggleAlignment}
        isMeasureWindowVisible={this.state.isMeasureWindowVisible}
        toggleMeasureWindowVisibility={this.toggleMeasureWindowVisibility}
        setAnalystNumberOfWaveforms={this.setAnalystNumberOfWaveforms}
        analystNumberOfWaveforms={this.state.analystNumberOfWaveforms}
        closeSplitChannelOverlayCallback={this.closeSplitWeavessChannelsOverlay}
        scaleAllWaveformAmplitude={this.scaleAllAmplitudesUsingSelectedChannel}
        toggleUncertainty={this.props.setShouldShowTimeUncertainty}
        shouldShowTimeUncertainty={this.props.shouldShowTimeUncertainty}
        selectedStationIds={this.props.selectedStationIds}
        resetAllWaveformAmplitudeScaling={this.resetAmplitudes}
        resetSelectedWaveformAmplitudeScaling={this.resetSelectedWaveformAmplitudeScaling}
        isSplitChannelOverlayOpen={!!this.props.splitStation?.activeSplitModeType}
        rotate={this.props.rotate}
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="waveform-display-container"
          data-cy="waveform-display-container"
          tabIndex={-1}
          onKeyDown={e => {
            this.onKeyPress(e);
          }}
          ref={ref => {
            if (ref) {
              this.waveformDisplayRef = ref;
            }
          }}
        >
          <WaveformControls
            currentSortType={this.props.selectedSortType}
            currentTimeInterval={this.state.currentTimeInterval}
            viewableTimeInterval={this.props.viewableInterval}
            currentOpenEventId={this.props.currentOpenEventId}
            analystNumberOfWaveforms={this.state.analystNumberOfWaveforms}
            showPredictedPhases={this.props.shouldShowPredictedPhases}
            alignWaveformsOn={this.props.alignWaveformsOn}
            phaseToAlignOn={this.props.phaseToAlignOn}
            selectedStationIds={this.props.selectedStationIds}
            defaultPhaseAlignment={
              this.props?.processingAnalystConfiguration.zasDefaultAlignmentPhase
            }
            measurementMode={this.props.measurementMode}
            defaultSignalDetectionPhase={this.props.defaultSignalDetectionPhase}
            setCreateEventMenuState={this.props.setCreateEventMenuState}
            setCurrentPhaseMenuVisibility={this.props.setCurrentPhaseMenuVisibility}
            setDefaultSignalDetectionPhase={this.props.setDefaultSignalDetectionPhase}
            setWaveformAlignment={this.setWaveformAlignment}
            setAlignWaveformsOn={this.props.setAlignWaveformsOn}
            setSelectedSortType={this.props.setSelectedSortType}
            setAnalystNumberOfWaveforms={this.setAnalystNumberOfWaveforms}
            setMode={this.setMode}
            toggleMeasureWindow={this.toggleMeasureWindowVisibility}
            loadData={this.loadData}
            zoomAlignSort={this.zoomAlignSort}
            onKeyPress={this.onKeyPress}
            isMeasureWindowVisible={this.state.isMeasureWindowVisible}
            amplitudeScaleOption={this.state.amplitudeScaleOption}
            fixedScaleVal={this.state.fixedScaleVal}
            setAmplitudeScaleOption={this.setAmplitudeScaleOption}
            setFixedScaleVal={this.setFixedScaleVal}
            featurePredictionQueryDataUnavailable={
              (!this.props.featurePredictionQuery ||
                this.props.featurePredictionQuery?.data === null ||
                this.props.featurePredictionQuery?.data === undefined ||
                this.props.featurePredictionQuery.data?.receiverLocationsByName === null ||
                this.props.featurePredictionQuery.data?.receiverLocationsByName === undefined) &&
              !this.props.featurePredictionQuery.isLoading
            }
            qcMaskDefaultVisibility={
              this.props.processingAnalystConfiguration.qcMaskTypeVisibilities
            }
            uiTheme={this.props.uiTheme}
            setRotationDialogVisibility={this.props.setRotationDialogVisibility}
            setEventBeamDialogVisibility={this.props.setEventBeamDialogVisibility}
          />
          {this.props.children}
          <WeavessDisplayComponent
            activeSplitModeType={this.props.splitStation.activeSplitModeType ?? null}
            amplitudeScaleOption={this.state.amplitudeScaleOption}
            closeSplitChannelOverlayCallback={this.closeSplitWeavessChannelsOverlay}
            createSignalDetection={this.createSignalDetection}
            fixedScaleVal={this.state.fixedScaleVal}
            isSplitChannelOverlayOpen={!!this.props.splitStation.activeSplitModeType}
            scaleAmplitudeChannelName={this.state.scaleAmplitudeChannelName}
            scaledAmplitudeChannelMaxValue={this.state.scaledAmplitudeChannelMaxValue}
            scaledAmplitudeChannelMinValue={this.state.scaledAmplitudeChannelMinValue}
            setClickedSdId={this.props.setClickedSdId}
            updateSelectedWaveforms={this.updateSelectedWaveforms}
            weavessProps={this.buildWeavessProps(stations, this.props)}
            phaseMenuVisibility={this.props.phaseMenuVisibility}
            setPhaseMenuVisibility={this.props.setPhaseMenuVisibility}
            showCreateSignalDetectionPhaseSelector={
              this.props.showCreateSignalDetectionPhaseSelector
            }
          />
        </div>
      </WaveformHotkeys>
    );
  }
}
