/* eslint-disable class-methods-use-this */
import { NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { CommonTypes, EventTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import type { ProcessingMask } from '@gms/common-model/lib/channel-segment/types';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event/util';
import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import {
  AnalystWorkspaceTypes,
  getBoundaries,
  getTimeRangeFromWeavessChannelSegment,
  getWaveform
} from '@gms/ui-state';
import {
  addGlUpdateOnResize,
  addGlUpdateOnShow,
  clearGlUpdateOnResize,
  clearGlUpdateOnShow,
  HotkeyListener,
  UILogger
} from '@gms/ui-util';
import { isHotKeyCommandSatisfied } from '@gms/ui-util/lib/ui-util/hot-key-util';
import { Weavess } from '@gms/weavess';
import { WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import type { WeavessInstance } from '@gms/weavess-core/lib/types';
import { produce } from 'immer';
import Immutable from 'immutable';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import merge from 'lodash/merge';
import memoizeOne from 'memoize-one';
import React from 'react';
import { toast } from 'react-toastify';

import { showCreateSignalDetectionMenu } from '~analyst-ui/common/menus/create-signal-detection-menu';
import { systemConfig } from '~analyst-ui/config/system-config';

import type { FixedScaleValue } from '../components/waveform-controls/scaling-options';
import { AmplitudeScalingOptions } from '../components/waveform-controls/scaling-options';
import {
  showQcCreationMenu,
  showQcSegmentEditMenu,
  showQcSegmentMenu,
  showQcSegmentsSelectionTableMenu
} from '../quality-control';
import { isAnyCreateSDHotkeySatisfied } from '../utils';
import type { WeavessContextData } from '../weavess-context';
import { WeavessContext } from '../weavess-context';
import { getBoundaryCacheKey } from './get-boundary-util';
import type { WeavessDisplayProps, WeavessDisplayState } from './types';

const logger = UILogger.create('GMS_LOG_WAVEFORM', process.env.GMS_LOG_WAVEFORM);

/**
 * Primary waveform display component.
 */
export class WeavessDisplayPanel extends React.PureComponent<
  WeavessDisplayProps,
  WeavessDisplayState
> {
  /** The type of the Weavess context, so this component knows how it's typed */
  public static readonly contextType: React.Context<WeavessContextData> = WeavessContext;

  /** The Weavess context. We store a ref to our Weavess instance in here. */
  public declare readonly context: React.ContextType<typeof WeavessContext>;

  private weavessEventHandlers: WeavessTypes.Events;

  private globalHotkeyListenerId: string;

  /**
   * For each channel, the last boundaries object that was computed.
   */
  private lastBoundaries: Immutable.Map<string, WeavessTypes.ChannelSegmentBoundaries>;

  /**
   * When scaleAllChannelsToThis scale option is selected
   */
  private scaleAllChannelsToThisBoundaries: WeavessTypes.ChannelSegmentBoundaries | undefined;

  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Constructor.
   *
   * @param props The initial props
   */
  public constructor(props: WeavessDisplayProps) {
    super(props);
    this.state = {
      qcSegmentModifyInterval: undefined,
      selectedQcSegment: undefined,
      selectionRangeAnchor: undefined
    };
    this.weavessEventHandlers = {
      stationEvents: {
        defaultChannelEvents: { events: {}, labelEvents: {} },
        nonDefaultChannelEvents: { events: {}, labelEvents: {} }
      }
    };
    this.weavessEventHandlers = this.buildDefaultWeavessEventHandlers();
    this.lastBoundaries = Immutable.Map();
    this.updateWeavessEventHandlers();
  }

  /**
   * Invoked when the component mounted.
   */
  public componentDidMount(): void {
    const { glContainer } = this.props;

    this.globalHotkeyListenerId = HotkeyListener.subscribeToGlobalHotkeyListener();
    if (glContainer) {
      addGlUpdateOnShow(glContainer, this.refreshOnGlMount);
      addGlUpdateOnResize(glContainer, this.refreshOnGlMount);
    }
  }

  /**
   * clean up when the component is unmounted
   */
  public componentWillUnmount(): void {
    const { glContainer } = this.props;

    HotkeyListener.unsubscribeFromGlobalHotkeyListener(this.globalHotkeyListenerId);
    if (glContainer) {
      clearGlUpdateOnShow(glContainer, this.refreshOnGlMount);
      clearGlUpdateOnResize(glContainer, this.refreshOnGlMount);
    }
  }

  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Refreshes the WEAVESS display.
   * This function is helpful when the window resizes to ensure
   * that the current zoom display is maintained.
   */
  // eslint-disable-next-line react/sort-comp
  public readonly refresh = (): void => {
    const { weavessRef } = this.context;
    if (weavessRef) {
      weavessRef.refresh();
    }
  };

  private readonly refreshOnGlMount = () => {
    this.forceUpdate();
    this.refresh();
  };

  /**
   * Sets the Selected Station Id's and the Sd Id's
   */
  private readonly setSelectedStationAndSdIds = () => {
    const { setSelectedStationIds, setSelectedSdIds } = this.props;
    setSelectedStationIds([]);
    setSelectedSdIds([]);
  };

  /**
   * When escape key is pressed, teh listener is removed and QC Mask is deselected
   */
  private readonly escapeKeyActions = () => {
    const { selectedQcSegment } = this.state;
    if (selectedQcSegment) {
      document.body.removeEventListener('click', this.onBodyClick, {
        capture: true
      });
      this.deselectQcSegment();
    }
  };

  /**
   * Event handler for when a key is pressed
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  public readonly onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      this.escapeKeyActions();
      this.setSelectedStationAndSdIds();
    } else if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          this.markSelectedSignalDetectionsToShowFk();
          return;
        case 'a':
          this.selectAllParentChannels();
          break;
        default:
        // do nothing
      }
    }
  };

  private readonly updateWeavessEventHandlers = () => {
    const { weavessProps } = this.props;
    this.weavessEventHandlers = merge(this.weavessEventHandlers, weavessProps.events);
  };

  /**
   * Callback function, used when the amplitude has been set by Weavess.
   * This function to updates the lastBoundaries cache when amplitude scaling.
   *
   * @param channelId used to generate a key for this particular cached bounds
   * @param channelSegmentBounds the bounds to be cached
   * @param isMeasureWindow true if the bounds are being applied to a measure window
   */
  private readonly onSetAmplitude = (
    channelId: string,
    channelSegmentBounds: WeavessTypes.ChannelSegmentBoundaries,
    isMeasureWindow: boolean
  ) => {
    if (
      channelSegmentBounds.topMax !== undefined &&
      channelSegmentBounds.bottomMax !== undefined &&
      channelSegmentBounds.offset !== undefined
    ) {
      this.lastBoundaries = this.lastBoundaries.set(
        getBoundaryCacheKey(channelId, isMeasureWindow),
        channelSegmentBounds
      );
    }
  };

  /**
   * Returns the default weavess default channel event handlers.
   * ! Assigning class variables in case they ever change to props, so that we don't miss an update
   * Produce is needed so if props change then weavess gets referentially stable update, that only changes the
   * values that changed on props
   */
  private readonly buildDefaultWeavessDefaultChannelEventHandlers = ():
    | WeavessTypes.ChannelEvents
    | undefined => {
    const { weavessProps, signalDetectionHandlers } = this.props;
    return produce(this.weavessEventHandlers?.stationEvents?.defaultChannelEvents, draft => {
      // TODO: not sure why loadash merge is not working
      if (!draft) {
        return {
          labelEvents: {
            onChannelExpanded: undefined,
            onChannelCollapsed: undefined,
            onChannelLabelClick: undefined,
            onContextMenu: undefined
          },
          events: {
            onContextMenu: undefined,
            onChannelClick: undefined
          }
        };
      }

      draft.onKeyPress = this.onKeyPress;
      draft.onSetAmplitude = this.onSetAmplitude;

      if (draft.labelEvents) {
        draft.labelEvents.onChannelExpanded =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.defaultChannelEvents?.labelEvents?.onChannelExpanded;

        draft.labelEvents.onChannelCollapsed =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.defaultChannelEvents?.labelEvents?.onChannelCollapsed;

        draft.labelEvents.onContextMenu =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.defaultChannelEvents?.labelEvents?.onContextMenu;

        draft.labelEvents.onChannelLabelClick = this.onChannelLabelClick;
      }

      if (draft.events) {
        draft.events.onMeasureWindowUpdated =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.defaultChannelEvents?.events?.onMeasureWindowUpdated;

        draft.events.onContextMenu = this.onContextMenu;
        draft.events.onChannelClick = this.onChannelClick;
        draft.events.onSignalDetectionContextMenu =
          signalDetectionHandlers.onSignalDetectionContextMenuHandler;
        draft.events.onSignalDetectionClick = signalDetectionHandlers.signalDetectionClickHandler;
        draft.events.onSignalDetectionDoubleClick =
          signalDetectionHandlers.signalDetectionDoubleClickHandler;
        draft.events.onMaskClick = undefined;
        draft.events.onMaskContextClick = undefined;
        draft.events.onMaskCreateDragEnd = undefined;
        draft.events.onSignalDetectionDragEnd =
          signalDetectionHandlers.onSignalDetectionDragEndHandler;
        draft.events.onUpdateMarker = this.onUpdateChannelMarker;
        draft.events.onUpdateSelectionWindow = this.onUpdateChannelSelectionWindow;
        draft.events.onClickSelectionWindow = this.onClickChannelSelectionWindow;
        draft.events.onWaveformSelectionMouseUp = this.onWaveformSelectionMouseUp;
      }
      return draft;
    });
  };

  /**
   * Returns the default weavess non-default channel event handlers.
   * ! Assigning class variables in case they ever change to props, so that we don't miss an update
   * Produce is needed so if props change then weavess gets referentially stable update, that only changes the
   * values that changed on props
   */
  private readonly buildDefaultWeavessNonDefaultChannelEventHandlers = ():
    | WeavessTypes.ChannelEvents
    | undefined => {
    const { weavessProps, signalDetectionHandlers } = this.props;
    return produce(this.weavessEventHandlers?.stationEvents?.nonDefaultChannelEvents, draft => {
      // TODO: not sure why loadash merge is not working

      if (!draft) {
        return {
          labelEvents: {
            onChannelExpanded: undefined,
            onChannelCollapsed: undefined,
            onChannelLabelClick: undefined,
            onContextMenu: undefined
          },
          events: {
            onContextMenu: undefined,
            onChannelClick: undefined
          }
        };
      }

      draft.onKeyPress = this.onKeyPress;
      draft.onSetAmplitude = this.onSetAmplitude;

      if (draft.labelEvents) {
        draft.labelEvents.onChannelExpanded =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.nonDefaultChannelEvents?.labelEvents
            ?.onChannelExpanded;

        draft.labelEvents.onChannelCollapsed =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.nonDefaultChannelEvents?.labelEvents
            ?.onChannelCollapsed;

        draft.labelEvents.onContextMenu =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.nonDefaultChannelEvents?.labelEvents?.onContextMenu;

        draft.labelEvents.onChannelLabelClick = this.onChannelLabelClick;
      }

      if (draft.events) {
        draft.events.onMeasureWindowUpdated =
          // eslint-disable-next-line @typescript-eslint/unbound-method
          weavessProps.events.stationEvents?.nonDefaultChannelEvents?.events
            ?.onMeasureWindowUpdated;
        draft.events.onContextMenu = this.onContextMenu;
        draft.events.onChannelClick = this.onChannelClick;
        draft.events.onSignalDetectionContextMenu =
          signalDetectionHandlers.onSignalDetectionContextMenuHandler;
        draft.events.onSignalDetectionClick = signalDetectionHandlers.signalDetectionClickHandler;
        draft.events.onSignalDetectionDoubleClick =
          signalDetectionHandlers.signalDetectionDoubleClickHandler;
        draft.events.onSignalDetectionDragEnd =
          signalDetectionHandlers.onSignalDetectionDragEndHandler;
        draft.events.onMaskClick = this.onMaskClick;
        draft.events.onMaskContextClick = this.onMaskContextClick;
        draft.events.onMaskCreateDragEnd = this.onMaskCreateDragEnd;
        draft.events.onUpdateMarker = this.onUpdateChannelMarker;
        draft.events.onUpdateSelectionWindow = this.onUpdateChannelSelectionWindow;
        draft.events.onWaveformSelectionMouseUp = undefined;
      }
      return draft;
    });
  };

  /**
   * Returns the default weavess event handler definitions.
   */
  private readonly buildDefaultWeavessEventHandlers = (): WeavessTypes.Events => {
    const { weavessProps } = this.props;
    return produce(this.weavessEventHandlers, draft => {
      if (draft.stationEvents) {
        draft.stationEvents.defaultChannelEvents =
          this.buildDefaultWeavessDefaultChannelEventHandlers();
        draft.stationEvents.nonDefaultChannelEvents =
          this.buildDefaultWeavessNonDefaultChannelEventHandlers();
      }

      draft.onUpdateMarker = this.onUpdateMarker;
      draft.onUpdateSelectionWindow = this.onUpdateSelectionWindow;

      // eslint-disable-next-line @typescript-eslint/unbound-method
      draft.onCanvasResize = weavessProps.events.onCanvasResize;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      draft.onResetAmplitude = weavessProps.events.onResetAmplitude;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      draft.onMount = weavessProps.events.onMount;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      draft.onUnmount = weavessProps.events.onUnmount;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      draft.onZoomChange = weavessProps.events.onZoomChange;
    });
  };

  /**
   * set mask if not rejected
   *
   * @param qcSegment qc mask
   */
  private readonly setSelectedQcSegment = (qcSegment: QcSegment): void => {
    const { selectedQcSegment } = this.state;
    const { setSelectedStationIds } = this.props;
    const version = qcSegment.versionHistory[qcSegment.versionHistory.length - 1];
    if (version.rejected) {
      toast.warn('Cannot modify a rejected mask', {
        toastId: `toast-cannot-modify-rejected-mask`
      });
      return;
    }

    if (selectedQcSegment === undefined || selectedQcSegment === null) {
      const qcMaskModifyInterval: CommonTypes.TimeRange = {
        startTimeSecs: version.startTime,
        endTimeSecs: version.endTime
      };
      // Selects the mask's channel
      setSelectedStationIds([qcSegment.channel.name]);
      this.setState({
        qcSegmentModifyInterval: qcMaskModifyInterval,
        selectedQcSegment: qcSegment
      });
      // Listens for clicks and ends the interactive mask modification if another part of the UI is clicked
      const delayMs = 200;
      setTimeout(() => {
        document.body.addEventListener('click', this.onBodyClick, {
          capture: true,
          once: true
        });
      }, delayMs);
    }
  };

  /**
   * Event handler for clicking on mask
   *
   * @param event mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelName a channel name as a string
   * @param maskId mask Ids as a string array
   * @param maskCreateHotKey (optional) indicates a hotkey is pressed
   */
  private readonly onMaskClick = (
    event: React.MouseEvent<HTMLDivElement>,
    channelName: string,
    masks: string[],
    maskCreateHotKey?: boolean,
    viewQcSegmentHotKey?: boolean
  ) => {
    this.showQcSegmentContextMenu(event, channelName, masks, maskCreateHotKey, viewQcSegmentHotKey);
  };

  /**
   * Event handler for updating markers value
   *
   * @param marker the marker
   */
  private readonly onUpdateMarker = (): void => {
    /* no-op */
  };

  /**
   * Event handler for updating selections value
   *
   * @param selection the selection
   */
  private readonly onUpdateSelectionWindow = (selection: WeavessTypes.SelectionWindow) => {
    const { selectedQcSegment } = this.state;
    const newStartTime = selection.startMarker.timeSecs;
    const newEndTime = selection.endMarker.timeSecs;
    // handle qc mask modification selection
    if (selection.id === 'selection-qc-mask-modify') {
      if (selectedQcSegment) {
        const newInterval: CommonTypes.TimeRange = {
          startTimeSecs: newStartTime,
          endTimeSecs: newEndTime
        };
        // Must set the modifyInterval or else old values stick around unpredictably
        this.setState({ qcSegmentModifyInterval: newInterval });
      }
    }
  };

  /**
   * Event handler for updating markers value
   *
   * @param id the unique channel name of the channel
   * @param marker the marker
   */
  private readonly onUpdateChannelMarker = () => {
    /* no-op */
  };

  /**
   * Event handler for updating selections value to handle amplitude measurement changes
   */
  private readonly onUpdateChannelSelectionWindow = () => {
    throw new Error(`Weavess Component onUpdateChannelSelectionWindow not yet implemented`);
  };

  /**
   * Event handler for click events within a selection to handle amplitude measurement changes
   */
  private readonly onClickChannelSelectionWindow = () => {
    // TODO: Legacy this method updated the amplitude for selected signal detection
    throw new Error(`Weavess Component onClickChannelSelectionWindow not yet implemented`);
  };

  /**
   * Listens for clicks and ends the interactive mask modification if
   * another part of the UI is clicked.
   */
  private readonly onBodyClick = (event: any): void => {
    // Ignore clicks within the modification widget
    if (
      event.target.className === 'selection-window-selection' ||
      event.target.className === 'moveable-marker' ||
      event.target.className === 'selection-window'
    ) {
      document.body.addEventListener('click', this.onBodyClick, {
        capture: true,
        once: true
      });
    } else {
      this.deselectQcSegment();
    }
  };

  /**
   * Deselects all QC segments.
   */
  private readonly deselectQcSegment = () => {
    const { qcSegmentModifyInterval, selectedQcSegment } = this.state;
    const { setSelectedStationIds } = this.props;
    if (qcSegmentModifyInterval && selectedQcSegment) {
      this.setState({
        qcSegmentModifyInterval: undefined,
        selectedQcSegment: undefined
      });
      setSelectedStationIds([]);
    }
  };

  /**
   * Generates a function that creates fixed boundaries using the given scale. Referentially stable for any given fixedScaleVal.
   *
   * @param fixedScaleVal the boundary scale to use
   * @returns the getFixedBoundaries function, pinned to the given scale
   */
  private readonly getFixedBoundariesGenerator = memoizeOne(
    (fixedScaleVal: FixedScaleValue | undefined) => {
      let getFixedBoundaries: (
        id: string,
        channelSegment?: WeavessTypes.ChannelSegment,
        timeRange?: WeavessTypes.TimeRange,
        isMeasureWindow?: boolean
      ) => Promise<WeavessTypes.ChannelSegmentBoundaries | undefined>;
      if (typeof fixedScaleVal === 'number') {
        /**
         * Generate a boundaries object based on the hardcoded fixedScaleVal
         *
         * @param id the channel id
         * @param _ the channel segment (unused)
         * @param __ the time range (unused)
         * @param isMeasureWindow whether this is for the measure window or not.
         * Measure window bounds are cached independently of another channel segment with the same name.
         * Defaults to false.
         * @returns a boundaries object
         */
        getFixedBoundaries = async (id: string): Promise<WeavessTypes.ChannelSegmentBoundaries> => {
          const bounds = {
            channelSegmentId: id,
            samplesCount: -1,
            topMax: fixedScaleVal,
            channelAvg: 0,
            bottomMax: -fixedScaleVal,
            offset: fixedScaleVal
          };
          return Promise.resolve(bounds);
        };
      } else {
        /**
         * Generate a boundaries object based on the min and max values within the provided time range, or the
         * currently visible range, if none is provided.
         *
         * @param id the channel id
         * @param channelSegment the channel segment for which to get the boundaries
         * @param timeRange the time range for which to get the bounds
         * @param isMeasureWindow whether this is for the measure window or not.
         * Measure window bounds are cached independently of another channel segment with the same name.
         * Defaults to false.
         * @returns a boundaries object
         */
        getFixedBoundaries = async (
          id: string,
          channelSegment: WeavessTypes.ChannelSegment,
          timeRange?: WeavessTypes.TimeRange,
          isMeasureWindow = false
        ): Promise<WeavessTypes.ChannelSegmentBoundaries | undefined> => {
          // Check if we have a boundary valid for this time range
          if (
            timeRange &&
            !WeavessUtil.doTimeRangesOverlap(
              getTimeRangeFromWeavessChannelSegment(channelSegment),
              timeRange
            )
          ) {
            return Promise.resolve(undefined);
          }
          const bounds = this.lastBoundaries.get(getBoundaryCacheKey(id, isMeasureWindow));
          // If fixed bounds don't exist yet, use auto-scale
          return bounds
            ? Promise.resolve(bounds)
            : this.getWindowedBoundaries(id, channelSegment, timeRange);
        };
      }
      return getFixedBoundaries;
    }
  );

  /**
   * Generate a boundaries object based on the waveform data in the given channel segment.
   *
   * @param id the channel id
   * @param channelSegment the channel segment to generate boundaries for
   * @param timeRange the start and end times for which to get boundaries.
   * Default to the current view time range if not defined.
   * @returns a boundaries object
   */
  private readonly getWindowedBoundaries = async (
    id: string,
    channelSegment: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange
  ): Promise<WeavessTypes.ChannelSegmentBoundaries> => {
    const { weavessRef } = this.context;
    const currentZoomInterval = weavessRef?.waveformPanelRef?.getCurrentZoomInterval();
    return getBoundaries(
      channelSegment,
      timeRange?.startTimeSecs ?? currentZoomInterval?.startTimeSecs,
      timeRange?.endTimeSecs ?? currentZoomInterval?.endTimeSecs
    );
  };

  /**
   * Generate a boundaries object based on scaleAllChannelsToThisBoundaries override being set.
   *
   * @param id the channel id
   * @param channelSegment the channel segment to generate boundaries for
   * @param timeRange the start and end times for which to get boundaries.
   * Default to the current view time range if not defined.
   * @returns a boundaries object
   */
  private readonly getScaleAllChannelsToThisChannelBounds = async (
    id: string,
    channelSegment: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange
  ): Promise<WeavessTypes.ChannelSegmentBoundaries | undefined> => {
    const { weavessRef } = this.context;
    const currentZoomInterval = weavessRef?.waveformPanelRef?.getCurrentZoomInterval();
    const boundaries = await getBoundaries(
      channelSegment,
      timeRange?.startTimeSecs ?? currentZoomInterval?.startTimeSecs,
      timeRange?.endTimeSecs ?? currentZoomInterval?.endTimeSecs
    );

    if (!boundaries) {
      return undefined;
    }
    const scaleAllBoundaries: WeavessTypes.ChannelSegmentBoundaries = {
      topMax: this.scaleAllChannelsToThisBoundaries?.topMax ?? 0,
      bottomMax: this.scaleAllChannelsToThisBoundaries?.bottomMax ?? 0,
      offset: this.scaleAllChannelsToThisBoundaries?.topMax ?? 0,
      channelAvg: this.scaleAllChannelsToThisBoundaries?.channelAvg ?? 0,
      channelSegmentId: boundaries.channelSegmentId
    };
    return Promise.resolve(scaleAllBoundaries);
  };

  /**
   * Get the function that will calculate the boundaries for a channel segment.
   * For a given set of arguments, this will return the same reference every time.
   *
   * @param amplitudeScaleOption the type of scaling to use
   * @returns a function that can be used to generate boundaries
   */
  private readonly getBoundariesCalculator = (
    amplitudeScaleOption: AmplitudeScalingOptions | undefined,
    fixedScaleVal: FixedScaleValue | undefined,
    scaleAmplitudeChannelName: string | undefined,
    scaledAmplitudeChannelMinValue: number | undefined,
    scaledAmplitudeChannelMaxValue: number | undefined
  ) => {
    // If scale all channel name is set return the getScaleAllChannelsToThisChannelBounds function
    if (
      scaleAmplitudeChannelName &&
      scaledAmplitudeChannelMinValue &&
      scaledAmplitudeChannelMaxValue
    ) {
      // build the scale all channels boundaries channel segment id is a undefined
      // and will be set in getScaleAllChannelsToThisChannelBounds function for each channel segment
      this.scaleAllChannelsToThisBoundaries = {
        topMax: scaledAmplitudeChannelMaxValue,
        bottomMax: scaledAmplitudeChannelMinValue,
        channelAvg: 0,
        channelSegmentId: undefined,
        offset: scaledAmplitudeChannelMaxValue
      };
      return this.getScaleAllChannelsToThisChannelBounds;
    }
    this.scaleAllChannelsToThisBoundaries = undefined;

    if (amplitudeScaleOption === AmplitudeScalingOptions.FIXED) {
      return this.getFixedBoundariesGenerator(fixedScaleVal);
    }
    return this.getWindowedBoundaries;
  };

  /**
   * Event handler for context clicking on a mask
   *
   * @param event mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelName a channel name as a string
   * @param masks mask ids as a string array
   */
  private readonly onMaskContextClick = (
    event: React.MouseEvent<HTMLDivElement>,
    channelName: string,
    masks: string[]
  ) => {
    this.showQcSegmentContextMenu(event, channelName, masks, false, false);
  };

  /**
   * Select a channel.
   *
   * @param channelName the unique channel name
   */
  private readonly selectChannel = (channelName: string) => {
    const { setSelectedStationIds } = this.props;
    setSelectedStationIds([channelName]);
  };

  /**
   * Clears the selected channels.
   */
  private readonly clearSelectedChannels = () => {
    const { setSelectedStationIds } = this.props;
    setSelectedStationIds([]);
    this.setState({ selectionRangeAnchor: undefined });
  };

  /**
   * Given a channel, return it with any children/non-default channels.
   *
   * @param channelName the possible parent channel
   * @returns an array that includes the input channel and any children
   */
  private readonly getParentChannelWithChildren = (channelName: string) => {
    const { defaultStations } = this.props;
    const clickedDefaultStation = defaultStations.find(station => station.name === channelName);
    // Look up all of the sub channels that fall under the selected default channel.
    const subChannelIds: string[] =
      clickedDefaultStation?.allRawChannels.map(channel => channel.name) || [];
    return [channelName, ...subChannelIds];
  };

  /**
   * Get a range of the currently visible stations/channels. The bounds do not need to be ordered.
   *
   * @param channelBound1 one of the channels that defines the range boundary
   * @param channelBound2 the other channel that defines the range boundary
   * @param waveformDisplay a reference to the Weavess WaveformDisplay
   * @returns a list of channels in the range, including the bounds
   */
  private static getVisibleChannelRange(
    channelBound1: string | undefined,
    channelBound2: string | undefined,
    waveformDisplay: WeavessInstance | undefined
  ): string[] {
    // Get the React components corresponding to stations
    const visibleChannels = waveformDisplay?.waveformPanelRef?.getOrderedVisibleChannelNames();
    if (!visibleChannels) return [];
    // Find the index into the visible channels for the first bound
    const bound1Idx = Math.max(
      visibleChannels.findIndex(channel => channel === channelBound1),
      0
    );
    // Find the index into the visible channels for the second bound
    const bound2Idx = visibleChannels.findIndex(channel => channel === channelBound2);
    // Return the visible channels within the selection
    return visibleChannels.slice(
      Math.min(bound1Idx, bound2Idx),
      Math.max(bound1Idx, bound2Idx) + 1
    );
  }

  /**
   * Helper function for {@link onChannelLabelClick}, determines whether the
   * given channel + its children should be selected or deselected.
   *
   * @param channelName the channel to be evaluated
   * @returns array of channelNames to be selected
   */
  private determineChannelWithChildrenSelect(channelName: string): string[] {
    const { selectedStationIds } = this.props;
    // Involve children channels as well
    const isAlreadySelected = this.getParentChannelWithChildren(channelName).every(channel =>
      selectedStationIds.includes(channel)
    );
    // Select parent and all children
    if (!isAlreadySelected) {
      return flatMap([channelName], this.getParentChannelWithChildren);
    }
    // Deselect all
    return [];
  }

  /**
   * Helper function for {@link onChannelLabelClick}, determines whether the
   * given channel should be selected or deselected.
   *
   * @param channelName the channel to be evaluated
   * @returns array of channelNames to be selected
   */
  private determineMultiSelect(channelName: string): string[] {
    const { selectedStationIds } = this.props;
    const isAlreadySelected = selectedStationIds.includes(channelName);

    // Remove from selectedSdIds
    if (isAlreadySelected) {
      return selectedStationIds.filter(channel => channel !== channelName);
    }
    return [...selectedStationIds, channelName];
  }

  /**
   * Event handler for when a channel label is clicked
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelName a channel name as a string
   */
  private readonly onChannelLabelClick = (
    e: React.MouseEvent<HTMLDivElement>,
    channelName: string
  ) => {
    const { selectedStationIds, setSelectedStationIds } = this.props;
    const { selectionRangeAnchor } = this.state;
    const { weavessRef } = this.context;
    /** The channels that will be added to the selection */
    let newSelectedChannels: string[] = [];

    e.preventDefault();

    // Single-select
    if (!selectedStationIds.includes(channelName) || selectedStationIds.length !== 1) {
      newSelectedChannels = [channelName];
    }

    // Range + Children select
    if (isHotKeyCommandSatisfied(e.nativeEvent, ['Shift+Alt'])) {
      // Get all parent channels
      newSelectedChannels = WeavessDisplayPanel.getVisibleChannelRange(
        selectionRangeAnchor,
        channelName,
        weavessRef
      );
      // Get children of each parent channel
      newSelectedChannels = flatMap(newSelectedChannels, this.getParentChannelWithChildren);
    }

    // Range select
    if (isHotKeyCommandSatisfied(e.nativeEvent, ['Shift'])) {
      newSelectedChannels = WeavessDisplayPanel.getVisibleChannelRange(
        selectionRangeAnchor,
        channelName,
        weavessRef
      );
    }

    // Children select
    if (isHotKeyCommandSatisfied(e.nativeEvent, ['Alt'])) {
      newSelectedChannels = this.determineChannelWithChildrenSelect(channelName);
    }

    // Multi-select
    if (isHotKeyCommandSatisfied(e.nativeEvent, ['Ctrl', 'Meta'])) {
      newSelectedChannels = this.determineMultiSelect(channelName);
    }

    // Apply new selected channels
    setSelectedStationIds(newSelectedChannels);

    // Update the anchor for the selection range as long as this is not an update to the range
    if (!e.shiftKey) this.setState({ selectionRangeAnchor: channelName });
  };

  /**
   * Method to select waveforms on mouse up on non-split channels without conflicting with other channel click events
   *
   * @param e
   * @param channel
   * @param timeSecs
   * @param isMeasureWindow
   * @param isDragged
   */
  private readonly onWaveformSelectionMouseUp = (
    e: React.MouseEvent<HTMLDivElement>,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isMeasureWindow?: boolean,
    isDragged?: boolean
  ) => {
    const {
      defaultStations,
      activeSplitModeType,
      updateSelectedWaveforms,
      signalDetections,
      weavessProps
    } = this.props;
    const channelId = channel.id;
    const station = defaultStations.find(s => s.name === channelId);
    const filterName = channel?.waveform?.channelSegmentId;

    // Determine if open in select waveform split mode
    if (
      filterName &&
      station &&
      !isDragged &&
      isDragged !== undefined &&
      channel?.waveform?.channelSegmentsRecord &&
      channel.waveform.channelSegmentsRecord?.[filterName]?.length >= 1 &&
      !activeSplitModeType &&
      weavessProps.initialConfiguration &&
      !isAnyCreateSDHotkeySatisfied(e, weavessProps.initialConfiguration)
    ) {
      e.preventDefault();
      updateSelectedWaveforms(
        station.name,
        timeSecs,
        channel?.waveform?.channelSegmentsRecord?.[filterName] ?? [],
        signalDetections,
        isHotKeyCommandSatisfied(e.nativeEvent, ['Ctrl', 'Meta', 'Shift']),
        { isMeasureWindow }
      ).catch(logger.error);
    }
  };

  /**
   * Method to handle (non-parent) split channel clicks for signal detection creation and waveform selection
   *
   * @param e
   * @param channel
   * @param timeSecs
   * @param filterName
   * @param isMeasureWindow
   */
  private readonly onSplitChannelClick = (
    e: React.MouseEvent<HTMLDivElement>,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    filterName: string,
    isMeasureWindow?: boolean
  ) => {
    const {
      activeSplitModeType,
      createSignalDetection,
      closeSplitChannelOverlayCallback,
      weavessProps,
      signalDetections,
      updateSelectedWaveforms
    } = this.props;
    const channelId = channel.id;
    if (activeSplitModeType === WeavessTypes.SplitMode.CREATE_SD) {
      logger.info(
        `Creating a new signal detection with current phase label at time ${timeSecs} on split channel`
      );
      const channelSegment = channel.waveform?.channelSegmentsRecord[filterName][0];
      createSignalDetection(
        channelId,
        channelSegment?.channelName,
        timeSecs,
        channel?.splitChannelPhase
      )
        .then(() => {
          if (closeSplitChannelOverlayCallback) closeSplitChannelOverlayCallback();
        })
        .catch(logger.error);
    }
    if (
      activeSplitModeType === WeavessTypes.SplitMode.SELECT_WAVEFORM &&
      weavessProps.initialConfiguration &&
      !isAnyCreateSDHotkeySatisfied(e, weavessProps.initialConfiguration)
    ) {
      updateSelectedWaveforms(
        channelId.substring(0, channelId.indexOf('.')),
        timeSecs,
        channel?.waveform?.channelSegmentsRecord?.[filterName] ?? [],
        signalDetections,
        isHotKeyCommandSatisfied(e.nativeEvent, ['Ctrl', 'Meta', 'Shift']),
        { isMeasureWindow, phase: undefined, isTemporary: true }
      ).catch(logger.error);
      if (closeSplitChannelOverlayCallback) {
        closeSplitChannelOverlayCallback();
      }
    }
  };

  /**
   * Helper function to reduce code complexity in onChannelClick
   */
  private readonly onCreateSignalDetectionClick = (
    e: React.MouseEvent<HTMLDivElement>,
    timeSecs: number,
    channelId: string
  ) => {
    const {
      weavessProps,
      createSignalDetection,
      currentPhase,
      defaultSignalDetectionPhase,
      showCreateSignalDetectionPhaseSelector,
      isSplitChannelOverlayOpen
    } = this.props;
    const { initialConfiguration } = weavessProps;
    if (
      // Create a signal detection with the current phase
      HotkeyListener.isHotKeyCommandSatisfied(
        e.nativeEvent,
        initialConfiguration?.hotKeys?.createSignalDetectionWithCurrentPhase?.combos ?? []
      )
    ) {
      e.stopPropagation();
      e.preventDefault();
      logger.info(
        `(Click + e) pressed to create a new signal detection with current phase label at time ${timeSecs}`
      );
      createSignalDetection(channelId, undefined, timeSecs, currentPhase).catch(logger.error);
    } else if (
      // Create a signal detection with the default phase
      HotkeyListener.isHotKeyCommandSatisfied(
        e.nativeEvent,
        initialConfiguration?.hotKeys?.createSignalDetectionWithDefaultPhase?.combos ?? []
      )
    ) {
      e.stopPropagation();
      e.preventDefault();
      logger.info(
        `(Click + alt + e) pressed to create a new signal detection with default phase label at time ${timeSecs}`
      );
      createSignalDetection(channelId, undefined, timeSecs, defaultSignalDetectionPhase).catch(
        logger.error
      );
    } else if (
      // Create a signal detection with the chosen phase dialog
      !isSplitChannelOverlayOpen &&
      HotkeyListener.isHotKeyCommandSatisfied(
        e.nativeEvent,
        initialConfiguration?.hotKeys?.createSignalDetectionWithChosenPhase?.combos ?? []
      )
    ) {
      e.stopPropagation();
      e.preventDefault();
      logger.info(
        `(Click + shift + alt + e) pressed to create a new signal detection with a chosen phase label at time ${timeSecs}`
      );
      showCreateSignalDetectionPhaseSelector(channelId, undefined, timeSecs, false);
    } else if (
      // Create a signal detection not associated to a waveform with the current phase
      !isSplitChannelOverlayOpen &&
      HotkeyListener.isHotKeyCommandSatisfied(
        e.nativeEvent,
        initialConfiguration?.hotKeys?.createSignalDetectionNotAssociatedWithWaveformCurrentPhase
          ?.combos ?? []
      )
    ) {
      e.stopPropagation();
      e.preventDefault();
      logger.info(
        `(Click + shift + e) pressed to create a new signal detection not associated to a waveform with current phase label at time ${timeSecs}`
      );
      createSignalDetection(channelId, undefined, timeSecs, currentPhase, true).catch(logger.error);
    } else if (
      // Create a signal detection not associated to a waveform with the default phase
      !isSplitChannelOverlayOpen &&
      HotkeyListener.isHotKeyCommandSatisfied(
        e.nativeEvent,
        initialConfiguration?.hotKeys?.createSignalDetectionNotAssociatedWithWaveformDefaultPhase
          ?.combos ?? []
      )
    ) {
      e.stopPropagation();
      e.preventDefault();
      logger.info(
        `(Click + shift + alt + e) pressed to create a new signal detection not associated to a waveform with default phase label at time ${timeSecs}`
      );
      createSignalDetection(
        channelId,
        undefined,
        timeSecs,
        defaultSignalDetectionPhase,
        true
      ).catch(logger.error);
    } else if (
      // Create a signal detection not associated to a waveform with the chosen phase dialog
      !isSplitChannelOverlayOpen &&
      HotkeyListener.isHotKeyCommandSatisfied(
        e.nativeEvent,
        initialConfiguration?.hotKeys?.createSignalDetectionNotAssociatedWithWaveformChosenPhase
          ?.combos ?? []
      )
    ) {
      e.stopPropagation();
      e.preventDefault();
      logger.info(
        `(Click + shift + alt + e) pressed to create a new signal detection not associated to a waveform with a chosen phase label at time ${timeSecs}`
      );
      showCreateSignalDetectionPhaseSelector(channelId, undefined, timeSecs, true);
    }
  };

  /**
   * Event handler for when channel is clicked
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   * @param timeSecs epoch seconds of where clicked in respect to the data
   * @param isMeasureWindow was the channel clicked within the measure window
   */
  private readonly onChannelClick = (
    e: React.MouseEvent<HTMLDivElement>,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isMeasureWindow?: boolean
  ) => {
    const {
      defaultStations,
      isSplitChannelOverlayOpen,
      activeSplitModeType,
      weavessProps,
      measurementMode
    } = this.props;
    const channelId = channel.id;
    // ctrl or meta click = create a signal detection
    const station = defaultStations.find(s => s.name === channelId);
    const filterName = channel?.waveform?.channelSegmentId;
    if (
      isSplitChannelOverlayOpen &&
      (activeSplitModeType === WeavessTypes.SplitMode.CREATE_SD ||
        activeSplitModeType === WeavessTypes.SplitMode.SELECT_WAVEFORM)
    ) {
      logger.info(`Hotkey disabled in split mode`);
      e.stopPropagation();
      e.preventDefault();
    } else if (
      !isSplitChannelOverlayOpen &&
      weavessProps.initialConfiguration &&
      isAnyCreateSDHotkeySatisfied(e, weavessProps.initialConfiguration)
    ) {
      this.onCreateSignalDetectionClick(e, timeSecs, channelId);
    } else if (
      station &&
      measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT
    ) {
      // user clicked outside of the measurement selection area
      toast.warn('Must perform measurement calculation inside grey selection area', {
        toastId: `toast-perform-measurement-inside-grey-selection-area`
      });
    }
    // If this is a split channel, but not the parent split channel (parent would have more then one channelSegmentsRecord)
    if (
      filterName &&
      channel.splitChannelTime &&
      channel?.waveform?.channelSegmentsRecord?.[filterName]?.length === 1
    ) {
      this.onSplitChannelClick(e, channel, timeSecs, filterName, isMeasureWindow);
    }
  };

  /**
   * Event handler for when a create mask drag ends
   *
   * @param event mouse event as React.MouseEvent<HTMLDivElement>
   * @param selectedStationIds names of currently selected stations/channels
   * @param startTimeSecs epoch seconds of where clicked started
   * @param endTimeSecs epoch seconds of where clicked ended
   */
  private readonly onMaskCreateDragEnd = (
    event: React.MouseEvent<HTMLDivElement>,
    selectedStationIds: string[],
    startTimeSecs: number,
    endTimeSecs: number
  ) => {
    const { weavessRef } = this.context;
    showQcCreationMenu(
      event,
      {
        startTime: startTimeSecs,
        endTime: endTimeSecs,
        selectedStationIds,
        updateBrushStroke: (start: number, end: number) => weavessRef?.updateBrushStroke(start, end)
      },
      {
        onClose: (...args) => weavessRef?.clearBrushStroke(...args),
        activeElementOnClose: undefined
      }
    );
  };

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    const {
      activeSplitModeType,
      glContainer,
      currentTimeInterval,
      defaultStations,
      events,
      currentOpenEventId,
      measurementMode,
      weavessProps,
      amplitudeScaleOption,
      fixedScaleVal,
      scaleAmplitudeChannelName,
      scaledAmplitudeChannelMinValue,
      scaledAmplitudeChannelMaxValue,
      openIntervalName,
      closeSplitChannelOverlayCallback,
      setViewportVisibleStations
    } = this.props;
    const { qcSegmentModifyInterval } = this.state;
    // ***************************************
    // BEGIN NON IDEAL STATE CASES
    // ***************************************

    // ! This case must be first
    // if the golden-layout container is not visible, do not attempt to render
    // the component, this is to prevent JS errors that may occur when trying to
    // render the component while the golden-layout container is hidden
    if (glContainer && glContainer.isHidden) {
      return <NonIdealState />;
    }

    if (!currentTimeInterval) {
      return (
        <NonIdealState
          icon={IconNames.TIMELINE_LINE_CHART}
          title="No waveform data currently loaded"
        />
      );
    }

    if (defaultStations.length < 1) {
      return (
        <NonIdealState
          icon="exclude-row"
          title="No Station Data"
          description="There is no station data available for this interval"
        />
      );
    }

    // ***************************************
    // END NON IDEAL STATE CASES
    // ***************************************

    // Selection for modifying QC Mask
    if (qcSegmentModifyInterval) {
      this.addMaskSelectionWindows();
    }

    let title = 'No Waveform Data';
    let description = 'There is no waveform data available for this interval';

    if (events) {
      const currentOpenEvent = events.find(e => e.id === currentOpenEventId);
      const preferredEventHypothesisByStage: EventTypes.EventHypothesis | undefined =
        findPreferredEventHypothesisByOpenStageOrDefaultStage(currentOpenEvent, openIntervalName);
      if (
        measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT &&
        preferredEventHypothesisByStage &&
        preferredEventHypothesisByStage.associatedSignalDetectionHypotheses?.length < 1
      ) {
        title = 'Unable to enter measurement mode: No associated signal detections available';
        description = '';
      }
    }
    this.weavessEventHandlers = this.buildDefaultWeavessEventHandlers();
    return (
      <>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="weavess-container" tabIndex={0}>
          <div className="weavess-container__wrapper">
            {weavessProps.stations.length > 0 ? (
              <Weavess
                disableToastContainer
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...weavessProps}
                getPositionBuffer={getWaveform}
                getBoundaries={this.getBoundariesCalculator(
                  amplitudeScaleOption,
                  fixedScaleVal,
                  scaleAmplitudeChannelName,
                  scaledAmplitudeChannelMinValue,
                  scaledAmplitudeChannelMaxValue
                )}
                selectChannel={this.selectChannel}
                /** callback executed when closing split expanded mode */
                closeSplitChannelOverlayCallback={closeSplitChannelOverlayCallback}
                clearSelectedChannels={this.clearSelectedChannels}
                events={this.weavessEventHandlers}
                setViewportVisibleStations={setViewportVisibleStations}
                activeSplitModeType={activeSplitModeType}
              />
            ) : (
              <NonIdealState
                icon={IconNames.TIMELINE_LINE_CHART}
                title={title}
                description={description}
              />
            )}
          </div>
        </div>
      </>
    );
  }

  /**
   * Shows the QC Segment Context menu for the provided display type.
   *
   * @param event mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelName a channel name as a string
   * @param masks mask ids as a string array
   * @para type the qc segment display type
   */
  private readonly showQcSegmentContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    channelName: string,
    masks: string[],
    maskCreateHotKey: boolean | undefined,
    viewQcSegmentHotKey: boolean | undefined
  ) => {
    const { qcSegmentsByChannelName, processingMasks } = this.props;
    // processing masks can't overlap so find is safe here
    const processingMask = processingMasks.find(pMask => includes(masks, pMask.id));

    const allSegments: QcSegment[] = Object.values(qcSegmentsByChannelName[channelName]);
    const qcSegments: QcSegment[] = allSegments.filter(m => includes(masks, m.id));
    const includesProcessingMask: ProcessingMask | undefined = includes(masks, processingMask?.id)
      ? processingMask
      : undefined;

    if (qcSegments.length > 0) {
      if (viewQcSegmentHotKey) {
        if (qcSegments.length === 1) {
          showQcSegmentEditMenu(event, { qcSegment: qcSegments[0] });
        } else {
          showQcSegmentsSelectionTableMenu(event, { qcSegments });
        }
      } else if (maskCreateHotKey) {
        // begin interactive modification of a qc segment
        if (qcSegments.length === 1) {
          this.setSelectedQcSegment(qcSegments[0]);
        } else {
          showQcSegmentsSelectionTableMenu(event, { qcSegments });
        }
      } else {
        showQcSegmentMenu(event, { qcSegments, processingMask: includesProcessingMask });
      }
    } else {
      showQcSegmentMenu(event, { processingMask: includesProcessingMask });
    }
  };

  private readonly addMaskSelectionWindows = (): void => {
    const { uiTheme, weavessProps } = this.props;
    const { qcSegmentModifyInterval } = this.state;
    if (qcSegmentModifyInterval?.startTimeSecs && qcSegmentModifyInterval?.endTimeSecs) {
      const maskSelectionWindow: WeavessTypes.SelectionWindow = {
        id: 'selection-qc-mask-modify',
        startMarker: {
          id: 'maskStart',
          color: uiTheme.colors.gmsMain,
          lineStyle: WeavessTypes.LineStyle.DASHED,
          timeSecs: qcSegmentModifyInterval?.startTimeSecs
        },
        endMarker: {
          id: 'maskEnd',
          color: uiTheme.colors.gmsMain,
          lineStyle: WeavessTypes.LineStyle.DASHED,
          timeSecs: qcSegmentModifyInterval?.endTimeSecs
        },
        isMoveable: true,
        color: 'rgba(255,255,255,0.2)'
      };
      if (maskSelectionWindow) {
        // TODO: Don't mutate props!
        // add to the selection windows; do not overwrite
        if (!weavessProps.markers) weavessProps.markers = {};
        if (!weavessProps.markers.selectionWindows) {
          weavessProps.markers.selectionWindows = [];
        }
        weavessProps.markers.selectionWindows.push(maskSelectionWindow);
      }
    }
  };

  /**
   * Event handler for when context menu is displayed
   */
  private readonly onContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    timeSecs: number
  ): void => {
    const {
      currentPhase,
      defaultSignalDetectionPhase,
      createSignalDetection,
      showCreateSignalDetectionPhaseSelector,
      setSignalDetectionActionTargets
    } = this.props;
    event.preventDefault();
    showCreateSignalDetectionMenu(
      event,
      {
        channelId,
        timeSecs,
        currentPhase,
        defaultSignalDetectionPhase,
        createSignalDetection,
        showCreateSignalDetectionPhaseSelector
      },
      {
        onClose: () => {
          setSignalDetectionActionTargets([]);
        },
        activeElementOnClose: undefined
      }
    );
  };

  /**
   * Selects all parent channels (default channels in weavess).
   */
  private readonly selectAllParentChannels = () => {
    const { defaultStations, setSelectedStationIds } = this.props;
    const parentStationIds = defaultStations.map(station => station.name);
    setSelectedStationIds(parentStationIds);
  };

  /**
   * Returns true if the selected signal detection can be used to generate an FK.
   */
  private readonly canGenerateFk = (
    signalDetection: SignalDetectionTypes.SignalDetection
  ): boolean => {
    const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(signalDetection.signalDetectionHypotheses)
        .featureMeasurements
    );
    return (
      systemConfig.nonFkSdPhases.findIndex(
        phase => phase.toLowerCase() === fmPhase.value.toString().toLowerCase()
      ) === -1
    );
  };

  /**
   * Mark the selected signal detection ids to show fk.
   */
  private readonly markSelectedSignalDetectionsToShowFk = () => {
    const { selectedSdIds, signalDetections, setSdIdsToShowFk } = this.props;
    const foundSignalDetections: SignalDetectionTypes.SignalDetection[] = [];
    selectedSdIds.forEach(selectedId => {
      const foundSignalDetection = signalDetections?.find(sd => sd.id === selectedId);
      if (foundSignalDetection && this.canGenerateFk(foundSignalDetection)) {
        foundSignalDetections.push(foundSignalDetection);
      }
    });
    setSdIdsToShowFk(foundSignalDetections.map(sd => sd.id));
  };
}
