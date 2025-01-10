/* eslint-disable class-methods-use-this */
/* eslint-disable react/destructuring-assignment */

import { HotkeysProvider } from '@blueprintjs/core';
import { MICROSECONDS_IN_SECOND } from '@gms/common-util';
import { HotkeyListener, UILogger } from '@gms/ui-util';
import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessConstants, WeavessMessages, WeavessUtil } from '@gms/weavess-core';
import classNames from 'classnames';
import elementResizeEvent from 'element-resize-event';
import debounce from 'lodash/debounce';
import defer from 'lodash/defer';
import flatMap from 'lodash/flatMap';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';
import { toast } from 'react-toastify';
import ResizeObserver from 'resize-observer-polyfill';
import * as THREE from 'three';

import { BrowserMaxResolutionChecker } from '../../util/browser-max-resolution-checker';
import { getComputedWidthPx } from '../../util/dom-util';
import {
  computeTimeSecsForMouseXPositionFraction,
  computeXPositionFractionForTimeSecs,
  convertPixelOffsetToFractionalPosition,
  convertPixelOffsetToTime
} from '../../util/position-util';
import { ViewportMaxSizer } from '../../util/viewport-max-sizer';
import { HotkeyHandler } from '../hotkey-handler';
import { Station, TimeAxis } from './components';
import { TimeRange } from './components/axes/time-range';
import { createMoveableMarkers, memoizedCreateVerticalMarkers } from './components/markers';
import { Ruler } from './components/ruler/ruler';
import type { Channel } from './components/station/components';
import { SingleDoubleClickEvent } from './events/single-double-click-event';
import type { WeavessContainerDimensions } from './shared-types';
import type {
  AnimationFrameOptions,
  WeavessWaveformPanelProps,
  WeavessWaveformPanelState
} from './types';
import { BrushType } from './types';
import { clearThree, setFocusToWeavess } from './utils';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

/** The number of decimal places to to set on zoom range */
const GL_DECIMAL_PRECISION = 64;

/** Fallback if we can't calculate the max width of a div in this browser */
const DEFAULT_MAX_DIV_WIDTH_PX = 15252000;

/** The most zoomed in time range allowed */
const SMALLEST_ALLOWED_TIME_RANGE_MICROSECONDS = 100;

/** The smallest number of pixels to consider sufficient to update state and rerender.
 * We use a positive fraction less than a pixel because if we don't update this when
 * we add 0.999px, for example, things can appear to be off, and the x axis will not
 * be updated appropriately.
 */
const ZOOM_UPDATE_THRESHOLD_PX = 1 / 2;

const ZOOM_INTERVAL_DEBOUNCE_MS = 200;

/** Beyond this many sig figs (eg 10 to this power minus 1), the browser rounds the size of an element?! */
const DEFAULT_NUM_SIG_FIGS_ZOOM = 5;

/** The number of pixels of tolerance in the actual vs theoretically computed viewport width allowed before throwing errors */
const VIEWPORT_ZOOM_TOLERANCE_PX = 1;

/** Percent tolerance within max div when checking */
const MAX_DIV_TOLERANCE_PERCENT = 0.99;

/** Percent tolerance within max resolution (100 microseconds) when checking */
const MAX_RESOLUTION_TOLERANCE_PERCENT = 1.01;

/** The base 10 to move the decimal for calculation */
const SIG_FIG_MULTIPLICATIVE = 10;

/**
 * Waveform Panel component. Contains a TimeAxis and Stations
 */
export class WeavessWaveformPanel extends React.PureComponent<
  WeavessWaveformPanelProps,
  WeavessWaveformPanelState
> {
  /** Refs to each station component */
  public stationComponentRefs: Map<string, Station> | null;

  /** Ref to the root element of weavess */
  private weavessRootRef: HTMLDivElement | null;

  /** Ref to the viewport where waveforms are rendered */
  private waveformsViewportRef: HTMLDivElement | null;

  /** Ref to the container where waveforms are held, directly within the viewport */
  private waveformsContainerRef: HTMLDivElement | null;

  /** Ref to the translucent selection brush-effect region, which is updated manually for performance reasons */
  private selectionAreaRef: HTMLDivElement | null;

  /** Ref to the TimeAxis component, which is updated manually for performance reasons */
  private timeAxisRef: TimeAxis | null;

  /** Ref to the vertical crosshair indicator element */
  private crosshairRef: HTMLDivElement | null;

  /** Ref to the primary canvas element where the waveforms are drawn */
  private canvasRef: HTMLCanvasElement | null;

  /** THREE.js WebGLRenderer used to draw waveforms */
  private renderer: THREE.WebGLRenderer | null;

  /** If the brush has just started to be used */
  private startOfBrush = true;

  /** Flag to indicate whether or not the mouse button is pressed down */
  private isMouseDown: { clientX: number; clientY: number } | undefined = undefined;

  /** The start of the brush effect in [0,1] where 0 = zoomRange.left and 1 = zoomRange.right */
  private selectionStart: number | undefined;

  /** The type of brush used on the channel */
  private brushType: BrushType | undefined = undefined;

  private globalHotkeyListenerId: string;

  /** An id of the previous requestAnimationFrame call, which allows
   * one to cancel it, so we can avoid enqueueing multiple animation frames */
  private prevRAF: number;

  /** An id of the previous requestAnimationFrame call to the onRenderWaveformLoopEnd function, which allows
   * one to cancel it, so we can avoid enqueueing multiple animation frames */
  private prevRAFEnd: number;

  /**
   * A collection of the physical dimensions in the DOM. These are calculated in a batch
   * in order to reduce calculation time during critical points in time, such as
   * requestAnimationFrame calls.
   */
  private readonly dimensions: WeavessContainerDimensions;

  /**
   * A resize observer for the canvas element
   */
  private readonly canvasResizeObserver: ResizeObserver;

  /**
   * A resize observer for the waveforms container that holds all the waveforms.
   * The waveforms container may resize when the user expands a station, for example.
   */
  private readonly waveformsContainerResizeObserver: ResizeObserver;

  /** handler for handling single and double click events */
  private readonly handleSingleDoubleClick: SingleDoubleClickEvent = new SingleDoubleClickEvent();

  /**
   * A memoized function for creating all stations
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param props the waveform panel props
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreateStationsJsx: (
    props: WeavessWaveformPanelProps,
    maskTarget: string
  ) => JSX.Element[];

  /** Debounce call to update parent with latest zoomInterval */
  private readonly debounceUpdateZoomInterval;

  /** The max width the browser will allow us to render a div */
  private maxViewportSizePx = DEFAULT_MAX_DIV_WIDTH_PX;

  /**
   * The max number of significant figures for rendering an element in the browser. Elements beyond this size are
   * rounded and/or truncated to use a representation using this many significant figures.
   */
  private maxNumSigFigsForElementSize = DEFAULT_NUM_SIG_FIGS_ZOOM;

  /** Name of the station targeted for QC mask creation */
  private maskTarget = '';

  /**
   * Constructor.
   *
   * @param props WeavessWaveformPanelProps
   */
  public constructor(props: WeavessWaveformPanelProps) {
    super(props);
    this.state = {
      rulerIsActive: false,
      rulerInitialPoint: undefined,
      zoomTimeInterval: props.displayInterval
    };
    this.canvasResizeObserver = new ResizeObserver(() => this.updateSize());
    this.waveformsContainerResizeObserver = new ResizeObserver(() =>
      this.onWaveformContainerResize()
    );
    this.stationComponentRefs = new Map();
    this.memoizedCreateStationsJsx = memoizeOne(this.createStationsJsx);
    this.dimensions = {
      viewport: {
        clientHeight: 0,
        clientWidth: 0,
        scrollHeight: 0,
        scrollLeft: 0,
        scrollWidth: 0,
        scrollTop: 0
      },
      viewportContentContainer: {
        clientWidth: 0
      },
      canvas: {
        rect: new DOMRect(),
        offsetHeight: 0,
        offsetWidth: 0,
        clientWidth: 0
      }
    };
    // Create debounce call to update zoom interval in parent component
    this.debounceUpdateZoomInterval = debounce(
      this.updateZoomIntervalInControlledComponent,
      ZOOM_INTERVAL_DEBOUNCE_MS,
      {
        leading: false
      }
    );
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public componentDidMount(): void {
    // prevent firefox ctrl + wheel zoom, which fights with weavess
    document.addEventListener('wheel', this.documentPreventCtrlMouseWheel, { passive: false });
    this.globalHotkeyListenerId = HotkeyListener.subscribeToGlobalHotkeyListener();

    if (!this.canvasRef) {
      logger.error('Weavess error - canvas not present at mount');
      return;
    }
    if (!this.waveformsContainerRef) {
      logger.error('Weavess error - Weavess waveform container not present at mount');
      return;
    }

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: this.canvasRef
    });
    this.canvasResizeObserver.observe(this.canvasRef);
    this.waveformsContainerResizeObserver.observe(this.waveformsContainerRef);

    elementResizeEvent(this.waveformsViewportRef, () => {
      this.renderWaveforms();
      if (this.timeAxisRef) this.timeAxisRef.update();
    });
    this.postZoomUpdate();
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(
    prevProps: WeavessWaveformPanelProps,
    prevState: WeavessWaveformPanelState
  ): void {
    // check if the zoom interval has changed
    if (
      !this.areIntervalsEqual(prevState.zoomTimeInterval, this.state.zoomTimeInterval) ||
      !this.areIntervalsEqual(prevProps.displayInterval, this.props.displayInterval)
    ) {
      this.zoom(this.state.zoomTimeInterval);
    } else {
      this.pruneStationComponentRefs();
      this.postZoomUpdate();
    }
  }

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to unmount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  public componentDidCatch(error, info): void {
    logger.error(`Waveform Panel Error: ${error} : ${info}`);
  }

  /**
   * clean up when the component is unmounted
   */
  public componentWillUnmount(): void {
    document.removeEventListener('wheel', this.documentPreventCtrlMouseWheel);
    HotkeyListener.unsubscribeFromGlobalHotkeyListener(this.globalHotkeyListenerId);
    if (this.canvasRef) this.canvasResizeObserver.unobserve(this.canvasRef);
    if (this.waveformsContainerRef)
      this.waveformsContainerResizeObserver.unobserve(this.waveformsContainerRef);
    clearThree(this.renderer);
    if (this.renderer?.forceContextLoss) {
      this.renderer.forceContextLoss();
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.crosshairRef = null;
    this.timeAxisRef = null;
    this.selectionAreaRef = null;
    this.waveformsContainerRef = null;
    this.waveformsViewportRef = null;
    this.weavessRootRef = null;
    this.renderer = null;
    this.stationComponentRefs = null;
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Exposed primarily for non-react users.
   * Force a redraw of the waveforms.
   */
  // eslint-disable-next-line react/sort-comp
  public refresh = (): void => {
    this.renderWaveforms();
    this.zoom(this.getCurrentZoomInterval());
  };

  /**
   * Reset amplitudes of all waveforms in this panel.
   */
  public resetAmplitudes = (): void => {
    // Reset manual scale for each station
    if (this.stationComponentRefs) {
      this.stationComponentRefs.forEach(station => station.resetAmplitude());
    }

    // call reset amplitude selection
    if (this.props.events.onResetAmplitude) {
      this.props.events.onResetAmplitude();
    }
  };

  /**
   * Return a list of all channels that have their amplitudes manually scaled.
   */
  public getManualAmplitudeScaledChannels = (): WeavessTypes.Channel[] => {
    const manuallyScaledChannels: WeavessTypes.Channel[] = [];
    this.stationComponentRefs?.forEach(station => {
      manuallyScaledChannels.push(...station.getManualAmplitudeScaledChannels());
    });
    return manuallyScaledChannels;
  };

  /**
   * Computes the time in seconds for the mouse x position, represented as a fraction of the canvas.
   *
   * @param mouseXPositionFraction the mouse x position from 0 to 1, where 0 is the far left and 1 is the far right of the canvas
   * @returns The computed time in seconds
   */
  public readonly computeTimeSecsForMouseXFractionalPosition = (
    mouseXPositionFraction: number
  ): number => {
    return computeTimeSecsForMouseXPositionFraction(
      mouseXPositionFraction,
      this.props.displayInterval,
      this.getCurrentZoomIntervalRange()
    );
  };

  /**
   * Computes the time in epoch seconds when given an x pixel position on the screen.
   *
   * @param mouseXPx the x position in pixels in question
   * @returns the time represented by that location
   */
  public readonly computeTimeSecsFromMouseXPixels = (mouseXPx: number): number => {
    return convertPixelOffsetToTime(
      mouseXPx,
      this.getCanvasRect(),
      this.props.displayInterval,
      this.getCurrentZoomIntervalRange()
    );
  };

  /**
   * Computes a fraction representing where on the canvas an x pixel value is found.
   * 0 means the left side of the canvas, 1 means the right. Value can be out of these bounds.
   *
   * @param xPositionPx the input
   * @returns the fractional x position on the canvas
   */
  public readonly computeFractionOfCanvasFromXPositionPx = (xPositionPx: number): number => {
    return convertPixelOffsetToFractionalPosition(this.getCanvasRect(), xPositionPx);
  };

  /**
   * Gets the bounding client rectangle of the waveform panel's canvas element in the DOM.
   *
   * @returns the canvas' bounding rectangle, or undefined if no canvas is found.
   */
  public readonly getCanvasBoundingClientRect = (): DOMRect | undefined =>
    this.dimensions.canvas?.rect ?? this.canvasRef?.getBoundingClientRect();

  /**
   * Gets the bounding client rectangle of the waveform panel's canvas element in the DOM.
   *
   * @returns the canvas' bounding rectangle, or undefined if no canvas is found.
   */
  public readonly getViewportBoundingClientRect = (): DOMRect | undefined =>
    this.waveformsViewportRef?.getBoundingClientRect();

  /**
   * Removes the brush div, is public so it be hit with weavess reference
   */
  public clearBrushStroke = (): void => {
    if (!this.selectionAreaRef) {
      return;
    }
    this.selectionAreaRef.style.display = 'none';
    this.selectionStart = undefined;
    this.brushType = undefined;
    this.startOfBrush = true;
  };

  /**
   * Updates the brush div, is public so it be hit with weavess reference
   */
  public updateBrushStroke = (start: number, end: number): void => {
    if (!this.selectionAreaRef) {
      return;
    }

    // Don't let the brush stroke exceed the left boundary
    const startPercent = Math.max(
      computeXPositionFractionForTimeSecs(
        start,
        this.props.displayInterval,
        this.getCurrentZoomIntervalRange()
      ),
      0
    );
    // Don't let the brush stroke exceed the right boundary

    const endPercent = Math.min(
      computeXPositionFractionForTimeSecs(
        end,
        this.props.displayInterval,
        this.getCurrentZoomIntervalRange()
      ),
      1
    );
    const fracToPct = 100;
    const left = `${startPercent * fracToPct}%`;
    const right = `${(1 - endPercent) * fracToPct}%`;

    this.selectionAreaRef.style.left = left;
    this.selectionAreaRef.style.right = right;
  };

  /**
   * Gets a list of the channel names in the order they are displayed in the WeavessWaveformPanel.
   *
   * @returns a list of the channel names in the order in which they are displayed (from top to bottom)
   */
  public readonly getOrderedVisibleChannelNames = (): string[] => {
    const chanNames: string[] = [];
    this.props.stations.forEach(sta => {
      chanNames.push(sta.defaultChannel.id);
      sta.nonDefaultChannels?.forEach(chan => {
        chanNames.push(chan.id);
      });
    });
    return chanNames;
  };

  /**
   * Finds the Channel's Waveform YAxisBounds
   *
   * @param channelId
   * @returns WeavessTypes.YAxisBounds for the channel name
   */
  public readonly getChannelWaveformYAxisBounds = (
    channelName: string
  ): WeavessTypes.YAxisBounds | undefined => {
    const channel = this.findChannel(channelName);
    if (channel) {
      return channel.getWaveformYAxisBound();
    }
    return undefined;
  };

  /**
   * get the currently displayed zoomTimeInterval
   * (the startTime and endTime of the currently displayed view of the waveforms).
   *
   * @returns the state's zoomTimeInterval
   */
  public getCurrentZoomInterval = (): WeavessTypes.TimeRange => {
    const zoomTime = this.state.zoomTimeInterval;
    if (!zoomTime || Number.isNaN(zoomTime.startTimeSecs) || Number.isNaN(zoomTime.endTimeSecs)) {
      return this.props.displayInterval;
    }
    return zoomTime;
  };

  /**
   * Will zoom to the provided time range even if current zoom interval is the same
   *
   * @param zoomInterval
   */
  public readonly zoomToTimeWindow = (zoomInterval: WeavessTypes.TimeRange): void => {
    this.setZoomIntervalInState(zoomInterval);
  };

  /**
   * Resets amplitudes for selected channels from props selections
   */
  public readonly resetSelectedWaveformAmplitudeScaling = (channelIds: string[]) => {
    channelIds.forEach(channelId => {
      const channel = this.findChannel(channelId);
      if (channel) {
        channel.resetAmplitude();
      }
    });
  };

  /** ********************
   * * End Public Methods
   ********************** */

  private readonly documentPreventCtrlMouseWheel = e => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  };

  /**
   * Compare the updated zoom interval with current zoom interval in state.
   *
   * @param zoomInterval interval to compare against current zoom interval in state
   * @returns true if the zoom interval is the same (or within 1 pixel); false otherwise
   */
  private readonly isCurrentZoomIntervalEqual = (
    zoomInterval: WeavessTypes.TimeRange | undefined
  ): boolean => {
    return this.areIntervalsEqual(this.state.zoomTimeInterval, zoomInterval);
  };

  /**
   * Compare the two intervals to see if they are equal within 1 pixel
   *
   * @param interval1
   * @param interval2
   * @returns true if the interval is the same (or within 1 pixel); false otherwise
   */
  private readonly areIntervalsEqual = (
    interval1: WeavessTypes.TimeRange | undefined,
    interval2: WeavessTypes.TimeRange | undefined
  ): boolean => {
    if (!interval1 || !interval2) {
      return false;
    }
    const pixelsPerSecond =
      this.dimensions.canvas.clientWidth / (interval1.endTimeSecs - interval1.startTimeSecs);

    // Compare the two intervals; they are considered different if the delta is > the update threshold
    // !ignore extremely small deltas when comparing the zoom intervals; this can cause an infinite loop when zooming
    return (
      Math.abs(pixelsPerSecond * (interval1.startTimeSecs - interval2.startTimeSecs)) <
        ZOOM_UPDATE_THRESHOLD_PX &&
      Math.abs(pixelsPerSecond * (interval1.endTimeSecs - interval2.endTimeSecs)) <
        ZOOM_UPDATE_THRESHOLD_PX
    );
  };

  /**
   * Zoom interval is checked for limits
   *
   * @param zoomInterval to check
   * @return returns clamped zoom interval if necessary. Will return undefined if already at max zoom
   */
  private readonly checkMaxZoomInterval = (
    zoomInterval: WeavessTypes.TimeRange | undefined
  ): WeavessTypes.TimeRange | undefined => {
    // Only call setState if the time range has actually changed.
    if (
      !zoomInterval ||
      Number.isNaN(zoomInterval.startTimeSecs) ||
      Number.isNaN(zoomInterval.endTimeSecs)
    ) {
      return zoomInterval;
    }

    // If already maxed out and still trying to zoom in notify and return undefined zoom interval
    if (
      this.hasCurrentZoomIntervalReachedMax() &&
      this.isZoomIntervalSmallerThanCurrent(zoomInterval)
    ) {
      this.notifyMaxZoomHasBeenReached();
      return undefined;
    }

    // if the interval changed, (strict equality check) that means we didn't zoom to the range requested,
    // so we should inform the user.
    const clampedZoomInterval = this.clampToMaxZoomInterval(zoomInterval);
    if (clampedZoomInterval !== zoomInterval && !this.hasCurrentZoomIntervalReachedMax()) {
      this.notifyMaxZoomHasBeenReached();
    }
    return clampedZoomInterval;
  };

  /**
   * Set the zoom interval in state.
   */
  private readonly setZoomIntervalInState = (zoomInterval: WeavessTypes.TimeRange | undefined) => {
    const value = this.checkMaxZoomInterval(zoomInterval);

    if (value) {
      if (Number.isNaN(value.startTimeSecs) || Number.isNaN(value.endTimeSecs)) {
        return;
      }

      if (!this.isCurrentZoomIntervalEqual(value)) {
        this.setState({
          zoomTimeInterval: value
        });
      }
    }
  };

  /**
   * If waveform panel is a controlled component update parent with
   * zoomInterval
   */
  private readonly updateZoomIntervalInControlledComponent = (): void => {
    // Update zoom interval with parent component after zooming
    if (this.props.isControlledComponent && this.props.events.onZoomChange) {
      this.props.events.onZoomChange(this.getCurrentZoomInterval());
    }
  };

  /**
   * Call to update amplitude after a zoom call. Also remove any manual scaling.
   */
  private readonly updateAmplitudes = () => {
    this.getStationsChannels().forEach(async chan => {
      if (chan && chan.updateAmplitude) await chan?.updateAmplitude(this.getCurrentZoomInterval());
    });
  };

  /**
   * Deletes any station component refs that are not in the current stations (from props)
   */
  private readonly pruneStationComponentRefs = () => {
    if (!this.stationComponentRefs) {
      return;
    }
    const currentStationNames = this.props.stations.map(sta => sta.id).sort();
    Array.from(this.stationComponentRefs.keys()).forEach(name => {
      if (!currentStationNames.includes(name)) {
        this.stationComponentRefs?.delete(name);
      }
    });
  };

  /**
   * Updates the position and size dimensions of elements that the waveform display cares about. This
   * prevents one from having to ask the browser to calculate layout and styles during critical points
   * in the execution of the code.
   */
  private readonly updateTrackedDimensions = () => {
    if (this.waveformsViewportRef) {
      this.dimensions.viewport.clientHeight = this.waveformsViewportRef.clientHeight;
      this.dimensions.viewport.clientWidth = this.waveformsViewportRef.clientWidth;
      this.dimensions.viewport.scrollHeight = this.waveformsViewportRef.scrollHeight;
      this.dimensions.viewport.scrollWidth = this.waveformsViewportRef.scrollWidth;
      this.dimensions.viewport.scrollLeft = this.waveformsViewportRef.scrollLeft;
      // we don't update the viewport scrollTop in here because we want a reference to the previous
      // scrollTop value so that we can pin the scroll position when holding control and scrolling.
    }
    if (this.waveformsContainerRef) {
      this.dimensions.viewportContentContainer.clientWidth = getComputedWidthPx(
        this.waveformsContainerRef
      );
    }
    if (this.canvasRef) {
      this.dimensions.canvas.rect = this.canvasRef.getBoundingClientRect();
      this.dimensions.canvas.clientWidth = this.canvasRef.clientWidth;
    }
  };

  /**
   * calculate the zoom range in [0,1] from the current zoom interval
   * where 0 = this.props.startTimeSecs
   * and 1 = this.props.endTimeSecs
   */
  private readonly getCurrentZoomIntervalRange = () => {
    return this.getZoomRangeFromInterval(this.getCurrentZoomInterval());
  };

  /**
   * calculate the zoom range in [0,1] for the time range provided
   * where 0 = this.props.startTimeSecs
   * and 1 = this.props.endTimeSecs
   */
  private readonly getZoomRangeFromInterval = (zoomInterval: WeavessTypes.TimeRange) => {
    const waveformDataRange =
      this.props.displayInterval.endTimeSecs - this.props.displayInterval.startTimeSecs;
    const startZoomRange =
      (zoomInterval.startTimeSecs - this.props.displayInterval.startTimeSecs) / waveformDataRange;
    const endZoomRange =
      (zoomInterval.endTimeSecs - this.props.displayInterval.startTimeSecs) / waveformDataRange;
    return this.setTimeRangePrecision([startZoomRange, endZoomRange]);
  };

  /**
   * Convert giving range to time interval using props start and end times
   *
   * @param zoomRange range 0 - 1 used in conversion
   * @returns time interval
   */
  private readonly convertRangeToTimeInterval = (
    zoomRange: [number, number]
  ): WeavessTypes.TimeRange => {
    const interval =
      this.props.displayInterval.endTimeSecs - this.props.displayInterval.startTimeSecs;
    const adjustedRange = this.setTimeRangePrecision(zoomRange);
    const startTimeSecs = adjustedRange[0] * interval + this.props.displayInterval.startTimeSecs;
    const endTimeSecs = adjustedRange[1] * interval + this.props.displayInterval.startTimeSecs;
    return { startTimeSecs, endTimeSecs };
  };

  /**
   * Calculates the current viewport range in fractional units
   *
   * @returns fractional viewport range in the format [0, 1]
   */
  private readonly getRangeFromCurrentViewport = (): [number, number] | undefined => {
    if (!this.waveformsContainerRef) return undefined;

    const labelWidthPx = this.labelWidthPx();
    const measuredWidthPx = parseFloat(window.getComputedStyle(this.waveformsContainerRef).width);
    const targetWidthPx =
      this.roundToSigFigs(measuredWidthPx, this.maxNumSigFigsForElementSize, 'floor') -
      labelWidthPx;

    const timeRangeLeft = this.dimensions.viewport.scrollLeft / targetWidthPx;

    const timeRangeRight =
      (this.dimensions.viewport.scrollLeft + this.dimensions.canvas.clientWidth) / targetWidthPx;

    // if calculations result in no zoom value then display not open
    if (timeRangeLeft === 0 && timeRangeRight === 0) {
      return undefined;
    }
    return this.setTimeRangePrecision([timeRangeLeft, timeRangeRight]);
  };

  /**
   * Calculate number of pixels to which the viewport should be scrolled, given the current zoom range
   * and viewport range.
   *
   * @param viewportRange a fractional range in the form [0, 1] showing what region of the whole loaded
   * range is in view.
   * @returns number of pixels from the left of the container
   */
  private readonly getNumberOfPixelsFromLeft = (viewportRange: [number, number]): number => {
    const zoomRange = this.getCurrentZoomIntervalRange();
    const theRange = zoomRange[1] - zoomRange[0];
    const labelWidthPx = this.labelWidthPx();
    const pixels = this.dimensions.viewport.clientWidth / theRange + labelWidthPx;
    return zoomRange[0] * (pixels - labelWidthPx) - viewportRange[0] * (pixels - labelWidthPx);
  };

  /**
   * Calculates a time interval corresponding to the scroll position of the viewport.
   * To function correctly, this.dimensions must have been set using updateTrackedDimensions.
   *
   * @returns a time interval for scroll bar range
   */

  private readonly getTimeIntervalFromViewport = (): WeavessTypes.TimeRange | undefined => {
    const viewportRange = this.getRangeFromCurrentViewport();
    // if viewport is not set then no time interval not possible to calculate
    if (!viewportRange) {
      return undefined;
    }
    return this.convertRangeToTimeInterval(viewportRange);
  };

  private readonly setTimeRangePrecision = ([left, right]: [number, number]): [number, number] => {
    return [
      Number.parseFloat(left.toFixed(GL_DECIMAL_PRECISION)),
      Number.parseFloat(right.toFixed(GL_DECIMAL_PRECISION))
    ];
  };

  // eslint-disable-next-line react/sort-comp
  private readonly memoizedSetViewportVisibleStations = memoizeOne(
    (channels: WeavessTypes.Channel[], indexStart: number, indexEnd: number) => {
      if (this.props.setViewportVisibleStations) {
        this.props.setViewportVisibleStations(channels, indexStart, indexEnd);
      }
    },
    isEqual
  );

  /**
   * onScroll handler for viewport scroll events.
   */
  private readonly onScroll = () => {
    if (!this.waveformsViewportRef || !this.stationComponentRefs) {
      return;
    }

    // check if zooming; if so enure the vertical scrollbar does not scroll
    if (
      HotkeyListener.isKeyDown(HotkeyListener.ModifierHotKeys.CONTROL) ||
      HotkeyListener.isKeyDown(HotkeyListener.ModifierHotKeys.META)
    ) {
      // keep the position fixed at this location
      this.waveformsViewportRef.scrollTop = this.dimensions.viewport.scrollTop;
    }

    // set this separately from the other dimensions because we use the old value to keep the position fixed.
    // if we were to set it in updateTrackedDimensions, then we would not have the previous scrollTop value
    // for use here.
    this.dimensions.viewport.scrollTop = this.waveformsViewportRef.scrollTop;
    // update zoom interval for use within
    this.updateTrackedDimensions();
    // If the scroll position has moved more than 1 pixel then
    const viewportRange = this.getRangeFromCurrentViewport();
    // if viewport is not set then no scrolling possible
    if (!viewportRange) {
      return;
    }
    const viewportInterval = this.getTimeIntervalFromViewport();
    const deltaPixels = this.getNumberOfPixelsFromLeft(viewportRange);
    if (viewportInterval && Math.abs(deltaPixels) > 0) {
      this.setZoomIntervalInState(viewportInterval);
    }
    this.postZoomUpdate();
  };

  /**
   * Zoom in on mouse wheel
   *
   * @param e
   */
  private readonly onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const modPercent = 0.4;
    if (e.ctrlKey || e.metaKey) {
      // compute current x position in [0,1] and zoom to that point
      const xFrac =
        (e.clientX - this.dimensions.canvas.rect.left) / this.dimensions.canvas.rect.width;

      if (e.deltaY > 0) {
        // zoom out
        this.zoomByPercentageToPoint(modPercent, xFrac);
      } else {
        // zoom in
        this.zoomByPercentageToPoint(-modPercent, xFrac);
      }
    }
    setFocusToWeavess();
  };

  private readonly createQcSegmentsKeyDown = () => {
    this.brushType = BrushType.CreateMask;
  };

  private readonly createQcSegmentsKeyUp = () => {
    if (!this.selectionStart) {
      this.brushType = undefined;
    }
  };

  /**
   * Creates all of the markers.
   *
   * @param props the waveform panel props
   *
   * @returns an array JSX elements
   */
  private readonly createAllMarkers = (props: WeavessWaveformPanelProps): JSX.Element[] => [
    ...memoizedCreateVerticalMarkers(
      props.displayInterval?.startTimeSecs,
      props.displayInterval?.endTimeSecs,
      props.markers ? props.markers.verticalMarkers : undefined
    ),
    ...createMoveableMarkers(
      props.displayInterval?.startTimeSecs,
      props.displayInterval?.endTimeSecs,
      props.markers ? props.markers.moveableMarkers : undefined,
      this.getZoomRatio,
      () => this.dimensions.viewportContentContainer.clientWidth,
      () => this.dimensions.viewportContentContainer.clientWidth,
      props.events
        ? (marker: WeavessTypes.Marker) => {
            if (props.events.onUpdateMarker) {
              props.events.onUpdateMarker(marker);
            }
          }
        : undefined,
      this.labelWidthPx()
    )
  ];

  /**
   * handler for the ref callback for stations. As a side effect, adds the station's
   * default channel to the visible list of channels.
   *
   * @param stationRef: the ref to the station provided by the React ref callback.
   * If null, will be a no-op.
   */
  private readonly setStationComponentRef = (stationRef: Station | null) => {
    if (this.stationComponentRefs && stationRef) {
      // id should be set when station is created.
      this.stationComponentRefs.set(stationRef.props.station.id, stationRef);
    }
  };

  /**
   * @returns a ref to the canvas element on which all waveforms are drawn.
   */
  private readonly getCanvasRef = () => this.canvasRef;

  /**
   * @returns the bounding client rectangle for the canvas.
   */
  private readonly getCanvasRect = () => this.dimensions.canvas.rect;

  /**
   * A set of converter functions that are passed to stations for converting position to
   * and from screen and time units.
   * */
  private readonly converters = {
    computeTimeSecsForMouseXFractionalPosition: this.computeTimeSecsForMouseXFractionalPosition,
    computeTimeSecsFromMouseXPixels: this.computeTimeSecsFromMouseXPixels,
    computeFractionOfCanvasFromMouseXPx: this.computeFractionOfCanvasFromXPositionPx
  };

  /**
   * @returns the ratio of the zoom duration divided by the total viewable duration.
   * This can be used to see how far zoomed in we are.
   */
  private readonly getZoomRatio = () =>
    (this.getCurrentZoomInterval().endTimeSecs - this.getCurrentZoomInterval().startTimeSecs) /
    (this.props.displayInterval.endTimeSecs - this.props.displayInterval.startTimeSecs);

  /**
   * @param timeRangeToCheck A time range to check to see if it is entirely in view
   * @returns Whether the time range provided is within the zoom interval (inclusive)
   */
  private readonly isWithinTimeRange = (timeRangeToCheck: WeavessTypes.TimeRange) =>
    timeRangeToCheck.startTimeSecs <= this.getCurrentZoomInterval().endTimeSecs &&
    timeRangeToCheck.endTimeSecs >= this.getCurrentZoomInterval().startTimeSecs;

  /**
   * Creates all of the stations. Parameters should be referentially stable for
   * optimal rendering.
   *
   * @param props the waveform panel props
   *
   * @returns an array JSX elements
   */
  private readonly createStationsJsx = (
    {
      stations,
      initialConfiguration,
      events,
      displayInterval,
      viewableInterval,
      isControlledComponent,
      msrWindowWaveformAmplitudeScaleFactor,
      shouldRenderWaveforms,
      shouldRenderSpectrograms,
      updateMeasureWindow,
      getPositionBuffer,
      getBoundaries
    }: WeavessWaveformPanelProps,
    maskTarget: string
  ): JSX.Element[] => {
    const stationElements: JSX.Element[] = [];
    let glMin;
    let glMax;
    if (displayInterval) {
      glMin = this.props.convertTimeToGL(displayInterval.startTimeSecs);
      glMax = this.props.convertTimeToGL(displayInterval.endTimeSecs);
    }

    const isSplitChannelOverlayOpen = !!this.props.activeSplitModeType;

    // eslint-disable-next-line no-restricted-syntax
    for (const station of stations) {
      stationElements.push(
        <Station
          // data props
          isSplitStation={(station?.splitChannels && station.splitChannels.length > 0) || false}
          splitModePickMarkerColor={this.props?.splitModePickMarkerColor}
          key={station.id}
          ref={this.setStationComponentRef}
          initialConfiguration={initialConfiguration}
          closeSplitChannelOverlayCallback={this.props?.closeSplitChannelOverlayCallback}
          displayInterval={displayInterval}
          viewableInterval={viewableInterval}
          getZoomRatio={this.getZoomRatio}
          isWithinTimeRange={this.isWithinTimeRange}
          shouldRenderWaveforms={shouldRenderWaveforms}
          shouldRenderSpectrograms={shouldRenderSpectrograms}
          station={station}
          customLabel={this.props.customLabel}
          glMin={glMin}
          glMax={glMax}
          hasQcMasks={station.hasQcMasks}
          isMaskTarget={maskTarget === station.id}
          isMeasureWindow={!isControlledComponent} // measure window is uncontrolled
          isSplitChannelOverlayOpen={isSplitChannelOverlayOpen}
          activeSplitModeType={this.props.activeSplitModeType}
          canvasRef={this.getCanvasRef}
          getCanvasBoundingRect={this.getCanvasRect}
          getPositionBuffer={getPositionBuffer}
          getBoundaries={getBoundaries}
          renderWaveforms={this.renderWaveforms}
          converters={this.converters}
          events={events?.stationEvents}
          onMouseMove={this.onMouseMove}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onContextMenu={this.onContextMenu}
          updateMeasureWindow={updateMeasureWindow ?? undefined}
          msrWindowWaveformAmplitudeScaleFactor={msrWindowWaveformAmplitudeScaleFactor}
        />
      );
    }
    return stationElements;
  };

  /**
   * If WEAVESS is contained inside of a div with flex layout, sizing it with height=100% doesn't work.
   */
  private createRootStyle(): React.CSSProperties & {
    '--weavess-scrollbar-track-margin': string;
    '--weavess-panel-scrollbar-width': string;
    '--weavess-canvas-height': string;
  } {
    const cssVars = {
      // this custom property is used in the css to set the webkit scrollbar margin (position the left side of the scrollbar).
      '--weavess-scrollbar-track-margin': `${this.labelWidthPx()}px`,
      // this custom property is used in the css to set the scrollbar width.
      '--weavess-panel-scrollbar-width': `${this.props.scrollBarWidthPx}px`,
      // this custom property is used to control the height of the canvas and the scroll-limiter that wraps it.
      '--weavess-canvas-height': `${this.waveformsContainerRef?.clientHeight ?? 0}px`
    };
    if (this.props.flex) {
      return {
        flex: '1 1 0',
        position: 'relative',
        ...cssVars
      };
    }

    return {
      height: '100%',
      position: 'relative',
      width: '100%',
      boxSizing: 'content-box',
      ...cssVars
    };
  }

  /**
   * This function is scheduled as an animation frame during @function renderWaveforms. It is
   * cleared by subsequent @function renderWaveform calls, and then scheduled again in the resulting
   * animation frames.
   */
  private readonly onRenderWaveformsLoopEnd = () => {
    window.cancelAnimationFrame(this.prevRAFEnd);
    this.updateAmplitudes();
    this.debounceUpdateZoomInterval();
    this.updateStationsInView();
  };

  /**
   * Create a list of all the channels for all stations
   *
   * @returns list of channels
   */
  private readonly getStationsChannels = (): Channel[] => {
    let channels: Channel[] = [];
    if (this.stationComponentRefs) {
      this.stationComponentRefs.forEach(station => {
        channels = channels.concat(station.getChannelList());
      });
    }
    return channels;
  };

  /**
   * Find channel
   *
   * @params channelName
   * @returns Channel or undefined
   */
  private readonly findChannel = (channelName: string): Channel | undefined => {
    if (this.stationComponentRefs) {
      // using for-of syntax to allow us to bail as soon as we find the result.
      // eslint-disable-next-line no-restricted-syntax
      for (const station of this.stationComponentRefs.values()) {
        const channel = station.getChannelList().find(chan => chan.getChannelId() === channelName);
        if (channel) {
          return channel;
        }
      }
    }
    return undefined;
  };

  /**
   * resize the renderer to fit the new canvas size
   */
  private updateSize() {
    if (!this.canvasRef) return;
    if (this.props.isResizing) {
      // clear the display while we are resizing so we don't draw distorted images
      if (this.renderer) {
        this.renderer.clear(true, true, true);
      }
      defer(() => this.updateSize(), WeavessConstants.ONE_FRAME_MS);
      return;
    }

    this.updateTrackedDimensions();
    const width = this.canvasRef.offsetWidth;
    const height = this.canvasRef.offsetHeight;
    if (
      this.dimensions.canvas.offsetWidth !== width ||
      this.dimensions.canvas.offsetHeight !== height
    ) {
      this.dimensions.canvas.offsetWidth = width;
      this.dimensions.canvas.offsetHeight = height;
      if (this.renderer) {
        this.renderer.setSize(width, height, false);
      }
      this.zoom(this.getCurrentZoomInterval());
    }
    if (this.props.events.onCanvasResize) {
      this.props.events.onCanvasResize(height);
    }
  }

  /**
   * Update the size of the canvas and scroll-limiter when the waveform container
   * changes size. This solves a bug in which expanding a station with many channels
   * that already have loaded data will not correctly render all channels' waveforms.
   */
  private onWaveformContainerResize() {
    if (!this.canvasRef || !this.waveformsContainerRef) {
      throw new Error('Cannot update size of canvas and scroll limiter. Components not found.');
    }
    this.weavessRootRef?.style.setProperty(
      '--weavess-canvas-height',
      `${this.waveformsContainerRef.clientHeight}px`
    );
    this.updateSize();
    this.renderWaveforms();
  }

  /**
   * Zoom out to the full displayInterval
   */
  private readonly fullZoomOut = () => {
    this.setZoomIntervalInState(this.props.displayInterval);
  };

  /**
   * Scroll down so that the top-most row is at the bottom.
   * If only one row is in view because they are so large, scroll the whole distance
   */
  private readonly pageDown = () => {
    const channelHeight =
      this.props.stations?.[0]?.defaultChannel?.height ||
      WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS;
    const pageDistPx = Math.max(this.dimensions.canvas.rect.height - channelHeight, channelHeight);
    if (this.waveformsViewportRef) {
      this.waveformsViewportRef.scroll({
        top: this.dimensions.viewport.scrollTop + pageDistPx
      });
    }
  };

  /**
   * Scroll down so that the bottom-most row is at the top.
   * If only one row is in view because they are so large, scroll the whole distance
   */
  private readonly pageUp = () => {
    const channelHeight =
      this.props.stations?.[0]?.defaultChannel?.height ||
      WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS;
    const pageDistPx = Math.max(this.dimensions.canvas.rect.height - channelHeight, channelHeight);
    if (this.waveformsViewportRef) {
      this.waveformsViewportRef.scroll({
        top: this.dimensions.viewport.scrollTop - pageDistPx
      });
    }
  };

  private readonly getSelectedChannels = (): WeavessTypes.Channel[] => {
    return this.props.stations
      .flatMap(station => [station.defaultChannel, ...(station.nonDefaultChannels ?? [])])
      .filter(channel => channel.isSelected);
  };

  /**
   * helper function to handle on mouse down for the CreateMask brush type
   *
   * @param xPct
   * @param channelId
   * @param isDefaultChannel
   */
  private readonly handleCreateMask = (
    xPct: number,
    channelId: string,
    isDefaultChannel: boolean
  ) => {
    const disableMaskModification = isDefaultChannel
      ? this.props.initialConfiguration.defaultChannel.disableMaskModification
      : this.props.initialConfiguration.nonDefaultChannel.disableMaskModification;
    if (!disableMaskModification) {
      this.selectionStart = xPct;
      this.maskTarget = channelId.substring(0, channelId.indexOf('.'));
      const selectedChannels = this.getSelectedChannels();
      // Select channel if no channels selected
      if (selectedChannels.length < 1) {
        if (this.props.selectChannel && channelId) {
          this.props.selectChannel(channelId);
        }
      }
    } else {
      this.selectionStart = undefined;
      this.brushType = undefined;
      toast.warn(WeavessMessages.maskModificationDisabled, {
        toastId: WeavessMessages.maskModificationDisabled
      });
    }
  };

  /**
   * right click mouse down event handler
   *
   * @param e:  React.MouseEvent<HTMLDivElement>,
   * @param channelId: string
   */
  private readonly onContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    timeSecs: number
  ) => {
    if (this.props.events?.stationEvents?.defaultChannelEvents?.events?.onContextMenu) {
      this.props.events.stationEvents.defaultChannelEvents.events.onContextMenu(
        e,
        channelId,
        timeSecs
      );
    }
  };

  /**
   * mouse down event handler
   *
   * @param e
   * @param xPct
   * @param channelId
   * @param timeSecs
   * @param isDefaultChannel
   */
  private readonly onMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    xPct: number,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isDefaultChannel: boolean
  ) => {
    // keep track of the mouse down state
    if (timeSecs) {
      // markers do not have time seconds, only track when on the waveform
      this.isMouseDown = { clientX: e.clientX, clientY: e.clientY };
    }
    // if the amplitude scaling hotkey is in use - do not brush
    this.setState({ rulerIsActive: true, rulerInitialPoint: { x: e.clientX, y: e.clientY } });

    // check if any keys are pressed on mouse down
    // zoom mode
    // set the zoom start point if a brush is being used
    if (e.ctrlKey || e.metaKey) {
      this.selectionStart = xPct;
    } else if (this.brushType === BrushType.CreateMask) {
      this.handleCreateMask(xPct, channel.id, isDefaultChannel);
    }
    setFocusToWeavess();
  };

  /**
   * Given an event determine if we should set the brushType to zoom
   *
   * @param event React.MouseEvent<HTMLDivElement>
   */
  private readonly shouldSetBrushTypeToZoom = (event: React.MouseEvent<HTMLDivElement>) => {
    // check if we need to set the brush type for zooming
    if (
      (event.ctrlKey || event.metaKey) &&
      this.isMouseDown &&
      this.brushType !== BrushType.CreateMask
    ) {
      this.brushType = BrushType.Zoom;
    }
  };

  /**
   * mouse move event handler
   *
   * @param e
   * @param xPct
   * @param timeSecs
   */
  private readonly onMouseMove = (e: React.MouseEvent<HTMLDivElement>, xPct: number) => {
    this.shouldSetBrushTypeToZoom(e);
    if (!this.selectionAreaRef) return;

    const width = this.dimensions.canvas.rect.width ?? 0;
    if (!xPct) {
      const leftOffset = this.dimensions.canvas.rect.left ?? 0;
      // eslint-disable-next-line no-param-reassign
      xPct = (e.clientX - leftOffset) / width;
    }

    // move the crosshair to the current pointer location
    if (this.crosshairRef) {
      this.crosshairRef.style.transform = `translateX(${xPct * width}px)`;
    }

    // if the user has moved more than 1% of the viewport, consider it an operation
    // Paint !
    if (this.selectionStart) {
      const fracToPct = 100;
      // minimum amount the mouse must move until it begins a brush effect
      // 0.01 = 1% of the current zoom range
      const minMovementDeltaFrac = 0.01;
      if (
        Math.abs(this.selectionStart - xPct) > minMovementDeltaFrac ||
        Math.abs(xPct - this.selectionStart) > minMovementDeltaFrac
      ) {
        if (this.startOfBrush) {
          this.selectionAreaRef.style.display = 'initial';
          this.startOfBrush = false;
        }
        const start = Math.min(this.selectionStart, xPct);
        const end = Math.max(this.selectionStart, xPct);
        const left = `${start * fracToPct}%`;
        const right = `${(1 - end) * fracToPct}%`;
        this.selectionAreaRef.style.left = left;
        this.selectionAreaRef.style.right = right;
        this.selectionAreaRef.style.backgroundColor =
          this.brushType === BrushType.CreateMask
            ? 'rgba(145, 228, 151, .3)' // ! should be set from user preferences
            : 'rgba(150,150,150,0.3)';
      }
    }
  };

  /** *
   *  Cancel the stroke so as to not interfere with other mouse events
   */
  private readonly cancelStroke = () => {
    if (this.selectionAreaRef) {
      this.selectionAreaRef.style.display = 'none';
    }
    this.selectionStart = undefined;
    this.brushType = undefined;
    this.startOfBrush = true;
  };

  /**
   * Create Mask
   *
   */
  private readonly createMask = (
    events: WeavessTypes.ChannelContentEvents | undefined,
    channelId: string,
    event: React.MouseEvent<HTMLDivElement>,
    scaleStart: number,
    scaleEnd: number
  ) => {
    const scaleTime = WeavessUtil.scaleLinear(
      [0, 1],
      [this.props.displayInterval.startTimeSecs, this.props.displayInterval.endTimeSecs]
    );

    if (events) {
      if (events.onMaskCreateDragEnd) {
        const channels = flatMap(
          this.props.stations.map<WeavessTypes.Channel[]>((s: WeavessTypes.Station) =>
            s.nonDefaultChannels ? [s.defaultChannel, ...s.nonDefaultChannels] : [s.defaultChannel]
          )
        );

        const channel = channels.find(c => c.id === channelId);
        if (channel) {
          // determine if there is an offset applied to the channel data
          const timeOffsetSeconds = channel.timeOffsetSeconds ? channel.timeOffsetSeconds : 0;
          const startTimeSecs = scaleTime(scaleStart) - timeOffsetSeconds;
          const endTimeSecs = scaleTime(scaleEnd) - timeOffsetSeconds;

          events.onMaskCreateDragEnd(
            event,
            this.getSelectedChannels().map(chan => chan.name),
            startTimeSecs,
            endTimeSecs
          );
          this.maskTarget = '';
        }
      }
    }
  };

  private readonly performZoom = (
    xPct: number,
    events: WeavessTypes.ChannelContentEvents | undefined,
    channelId: string,
    mouseEvent: React.MouseEvent<HTMLDivElement>
  ) => {
    const scale = WeavessUtil.scaleLinear([0, 1], this.getCurrentZoomIntervalRange());
    const start = this.selectionStart ? Math.min(this.selectionStart, xPct) : xPct;
    const end = this.selectionStart ? Math.max(this.selectionStart, xPct) : xPct;
    const scaleStart = scale(start);
    const scaleEnd = scale(end);
    if (this.brushType === BrushType.Zoom) {
      const zoomInterval = this.convertRangeToTimeInterval([scaleStart, scaleEnd]);
      this.setZoomIntervalInState(zoomInterval);
    } else if (this.brushType === BrushType.CreateMask) {
      this.createMask(events, channelId, mouseEvent, scaleStart, scaleEnd);
    }
  };

  private readonly onRulerMouseUp = () => {
    this.setState({ rulerIsActive: false, rulerInitialPoint: undefined });
  };

  /**
   * Handle logic for if we should call the onChannelClick callback when
   * a channel is clicked
   *
   * @param mouseEvent React.MouseEvent<HTMLDivElement>
   * @param isDefaultChannel boolean
   * @param channel WeavessTypes.Channel
   * @param timeSecs number
   */
  private readonly handleOnChannelClick = (
    mouseEvent: React.MouseEvent<HTMLDivElement>,
    isDefaultChannel: boolean,
    channel: WeavessTypes.Channel,
    timeSecs: number
  ) => {
    if (
      isDefaultChannel &&
      this.props.events?.stationEvents?.defaultChannelEvents?.events?.onChannelClick
    ) {
      this.props.events.stationEvents.defaultChannelEvents.events.onChannelClick(
        mouseEvent,
        channel,
        timeSecs
      );
    } else if (this.props.events?.stationEvents?.nonDefaultChannelEvents?.events?.onChannelClick) {
      this.props.events.stationEvents.nonDefaultChannelEvents.events.onChannelClick(
        mouseEvent,
        channel,
        timeSecs
      );
    }
  };

  /**
   * Handle the other click events that are not for the default channel events
   *
   * @param mouseEvent React.MouseEvent<HTMLDivElement>
   * @param events WeavessTypes.ChannelContentEvents
   * @param channel WeavessTypes.Channel
   * @param timeSecs number
   */
  private readonly handleChannelMousedownEvents = (
    mouseEvent: React.MouseEvent<HTMLDivElement>,
    events: WeavessTypes.ChannelContentEvents | undefined,
    channel: WeavessTypes.Channel,
    timeSecs: number
  ) => {
    if (
      mouseEvent.clientX === this.isMouseDown?.clientX &&
      mouseEvent.clientY === this.isMouseDown?.clientY
    ) {
      this.handleSingleDoubleClick.onSingleClickEvent(
        mouseEvent,
        (e: React.MouseEvent<HTMLDivElement> | any) => {
          // handle onChannelClick event if not zooming or modifying a mask
          if (events) {
            if (events.onChannelClick && channel && timeSecs) {
              events.onChannelClick(e, channel, timeSecs);
            }
          }
        }
      );
    }
  };

  /**
   * handle a single click event, only if the user has not moved the mouse
   *
   * @param mouseEvent
   * @param events
   * @param channel
   * @param timeSecs
   */
  private readonly handleSingleClickInMouseUp = (
    mouseEvent: React.MouseEvent<HTMLDivElement>,
    events: WeavessTypes.ChannelContentEvents | undefined,
    isDefaultChannel: boolean,
    channel: WeavessTypes.Channel,
    timeSecs: number
  ) => {
    // handle non zooming or masking
    if (!this.brushType) {
      this.handleOnChannelClick(mouseEvent, isDefaultChannel, channel, timeSecs);
    } else if (this.isMouseDown) {
      // handle other click events
      this.handleChannelMousedownEvents(mouseEvent, events, channel, timeSecs);
    }
  };

  /**
   * mouse up event handler
   *
   * @param mouseEvent
   * @param xPct
   * @param channelId
   * @param timeSecs
   * @param isDefaultChannel
   * @param isMeasureWindow
   * @param isDragged
   */
  private readonly onMouseUp = (
    mouseEvent: React.MouseEvent<HTMLDivElement>,
    xPct: number,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isDefaultChannel: boolean,
    isMeasureWindow: boolean,
    isDragged: boolean
  ) => {
    // ignore any mouse up events if the mouse down flag is not set
    if (!this.isMouseDown) {
      return;
    }
    // track the mouse down state
    this.isMouseDown = undefined;

    // If the mouse is released *before* a brush stroke has been made
    if (this.startOfBrush) {
      this.cancelStroke();
    }
    if (!this.selectionAreaRef) return;

    if (!xPct) {
      const leftOffset = this.dimensions.canvas.rect.left;
      const { width } = this.dimensions.canvas.rect;
      // eslint-disable-next-line no-param-reassign
      xPct = (mouseEvent.clientX - leftOffset) / width;
    }

    const d = this.props.events?.stationEvents?.defaultChannelEvents?.events
      ? this.props.events.stationEvents.defaultChannelEvents.events
      : undefined;

    const nd = this.props.events?.stationEvents?.nonDefaultChannelEvents?.events
      ? this.props.events.stationEvents.nonDefaultChannelEvents.events
      : undefined;

    const events = isDefaultChannel ? d : nd;

    // if the user is zooming, perform the zoom
    if (this.brushType && !this.startOfBrush && this.selectionStart) {
      this.performZoom(xPct, events, channel.id, mouseEvent);
    } else {
      this.handleSingleClickInMouseUp(mouseEvent, events, isDefaultChannel, channel, timeSecs);
      this.onRulerMouseUp();
    }

    if (this.brushType !== BrushType.CreateMask) {
      this.selectionAreaRef.style.display = 'none';
      this.selectionStart = undefined;
      this.brushType = undefined;
      this.startOfBrush = true;
    }
    if (
      isDefaultChannel &&
      this.props.events?.stationEvents?.defaultChannelEvents?.events?.onWaveformSelectionMouseUp
    ) {
      this.props.events.stationEvents.defaultChannelEvents.events.onWaveformSelectionMouseUp(
        mouseEvent,
        channel,
        timeSecs,
        isMeasureWindow,
        isDragged
      );
    }
  };

  /**
   * zoomPct in [0,1], x in [0,1]
   *
   * @param zoomPct positive zooms out, negative zooms in
   * @param x
   */
  private readonly zoomByPercentageToPoint = (zoomPct: number, x: number) => {
    const zoomRange = this.getCurrentZoomIntervalRange();
    const theRange = zoomRange[1] - zoomRange[0];
    const zoomIncrement = (theRange * zoomPct) / 2.0;
    const left = Math.max(zoomRange[0] - zoomIncrement * x, 0);
    const right = Math.min(zoomRange[1] + zoomIncrement * (1 - x), 1);
    const zoomInterval = this.convertRangeToTimeInterval([left, right]);
    this.setZoomIntervalInState(this.checkMaxZoomInterval(zoomInterval));
  };

  private readonly pan = (panPct: number) => {
    const deltaPx = this.dimensions.canvas.clientWidth * panPct;
    if (this.waveformsViewportRef) {
      this.waveformsViewportRef.scrollLeft += deltaPx;
    }
  };

  /**
   * Rounds the provided number to the number of significant figures provided
   *
   * @param num the number to round
   * @param numSigFigs the max number of significant figures
   * @param shouldFloor boolean that, if true, forces this to floor the result
   * @returns
   */
  private roundToSigFigs(num: number, numSigFigs: number, options?: 'floor' | 'ceiling' | 'round') {
    if (num > SIG_FIG_MULTIPLICATIVE ** (numSigFigs - 1)) {
      const toTheNearest =
        SIG_FIG_MULTIPLICATIVE ** Math.max(WeavessUtil.calcNumDigits(num) - numSigFigs, 1);
      if (options === 'floor') return Math.floor(num / toTheNearest) * toTheNearest;
      if (options === 'ceiling') return Math.ceil(num / toTheNearest) * toTheNearest;
      return Math.round(num / toTheNearest) * toTheNearest;
    }
    return num;
  }

  /**
   * Calculates the start of the new zoom interval in webGL units (0 is the left of the current interval, 1 is the right)
   * and the size in pixels of the waveform container.
   */
  private readonly calculateZoomPx = (
    zoomInterval: WeavessTypes.TimeRange
  ): { startGl: number; widthPx: number } => {
    if (
      !this.waveformsContainerRef ||
      !this.canvasRef ||
      !this.waveformsViewportRef ||
      !zoomInterval ||
      zoomInterval.startTimeSecs === undefined ||
      zoomInterval.endTimeSecs === undefined
    ) {
      return { startGl: 0, widthPx: 0 };
    }

    // If the zoom interval doesn't change but the viewableInterval does
    // the zoom interval may need to be clamped
    const clampedZoomInterval = this.clampToMaxZoomInterval(zoomInterval);
    const scale = WeavessUtil.scaleLinear(
      [this.props.displayInterval.startTimeSecs, this.props.displayInterval.endTimeSecs],
      [0, 1]
    );
    let startGl = scale(clampedZoomInterval.startTimeSecs);
    let endGl = scale(clampedZoomInterval.endTimeSecs);
    const requestedRange = Math.min(endGl - startGl, 1);
    if (startGl < 0) {
      startGl = 0;
      endGl = startGl + requestedRange;
    }
    if (endGl > 1) {
      endGl = 1;
      startGl = endGl - requestedRange;
    }
    if (endGl <= startGl) {
      const minDelta = 0.001;
      endGl = startGl + minDelta;
    }

    const widthPx = Math.round(this.dimensions.canvas.clientWidth / (endGl - startGl));

    return { startGl, widthPx };
  };

  /**
   * Zoom to the requested time interval in WebGL units, with 0 representing the start
   * of the current interval, and 1 representing the end.
   * Zoom is constrained by the max allowed browser element size (maxViewportSizePx),
   * the smallest time interval allowed.
   *
   * It will try to round the width to the known browser supported significant figures.
   * For example, the browser does not seem to track precision of element widths beyond
   * a set number of significant figures, resulting in the elements having an actual size
   * that is rounded to a power of ten pixels wide.
   *
   * This updates the tracked dimensions, and may call to render waveforms if the scrollLeft
   * has changed (which would not otherwise rerender the waveforms).
   *
   * @param zoomInterval the time range representing the level to which to zoom
   */
  private readonly zoom = (zoomInterval: WeavessTypes.TimeRange) => {
    if (!this.waveformsViewportRef) return;
    const { startGl, widthPx: targetWidthPx } = this.calculateZoomPx(zoomInterval);
    const prevScroll = this.waveformsViewportRef.scrollLeft;
    const labelWidthPx = this.labelWidthPx();

    const widthPx = this.roundToSigFigs(
      targetWidthPx + labelWidthPx,
      this.maxNumSigFigsForElementSize
    );

    if (this.waveformsContainerRef) {
      this.waveformsContainerRef.style.width = `${widthPx}px`;
    }
    this.waveformsViewportRef.scrollLeft = Math.round(startGl * (widthPx - labelWidthPx));

    // update since changes made to browser div before determining viewport time interval
    this.updateTrackedDimensions();
    // If scroll left didn't change the waveform won't rerender so explicitly rerender
    if (startGl === 0 && prevScroll === 0) {
      this.renderWaveforms();
    }
  };

  /**
   * Has current state zoom interval reached either max element or max resolution limit
   *
   * @returns whether the current zoom interval provided is at max
   */
  private readonly hasCurrentZoomIntervalReachedMax = () => {
    return (
      this.isZoomIntervalAtMaxElementWidth(this.state.zoomTimeInterval) ||
      this.isZoomIntervalAtMaxResolution(this.state.zoomTimeInterval)
    );
  };

  /**
   * Notify user max zoom has been reached
   */
  private readonly notifyMaxZoomHasBeenReached = (): void => {
    toast.info(`Max zoom limit reached.`, { toastId: 'toast-max-zoom-limit-reached' });
  };

  /**
   * Returns true if the zoom interval at or smaller (zooming in) on current zoom interval.
   */
  private readonly isZoomIntervalSmallerThanCurrent = (
    zoomInterval: WeavessTypes.TimeRange
  ): boolean => {
    const currentZoomInterval = this.getCurrentZoomInterval();
    if (
      zoomInterval.startTimeSecs >= currentZoomInterval.startTimeSecs &&
      zoomInterval.endTimeSecs <= currentZoomInterval.endTimeSecs
    ) {
      return true;
    }
    return false;
  };

  /**
   * @param zoomInterval A zoom interval to check
   * @returns true if the provided interval would cause us to zoom so much that we would be creating DOM elements
   * that are larger than the browser supports.
   */
  private readonly isZoomIntervalAtMaxElementWidth = (zoomInterval: WeavessTypes.TimeRange) => {
    const zoomRange = this.getZoomRangeFromInterval(zoomInterval);
    const widthPx = Math.ceil(this.dimensions.canvas.clientWidth / (zoomRange[1] - zoomRange[0]));

    // On initial load shortly after mounting canvas client width can be 0 resulting in false positive
    return (
      widthPx > 0 &&
      widthPx >= (this.maxViewportSizePx - this.labelWidthPx()) * MAX_DIV_TOLERANCE_PERCENT
    );
  };

  /**
   * @param zoomInterval A zoom interval to check
   * @returns true if the provided interval would cause us to zoom so much that we pass the maximum time resolution
   * allowed, which is 100 microseconds.
   */
  private readonly isZoomIntervalAtMaxResolution = (zoomInterval: WeavessTypes.TimeRange) => {
    const minRange = (1 / MICROSECONDS_IN_SECOND) * 100; // One hundred microseconds is the min range we allow
    return (
      zoomInterval.endTimeSecs - zoomInterval.startTimeSecs <=
      minRange * MAX_RESOLUTION_TOLERANCE_PERCENT
    );
  };

  /**
   * Will log an error if the internal weavess zoom interval state does not match the size of the waveforms container,
   * plus or minus a tolerance: {@link VIEWPORT_ZOOM_TOLERANCE_PX}.
   * For the same reason, it will also log an error if the waveformContainerRef element has a computed width that differs
   * from the clientWidth, plus or minus the same tolerance.
   * In other words, this will log an error if the state would be rendering elements at the wrong place due to a mismatch
   * between our internal state and the browser's expected state.
   *
   * ! This should only be run in development mode to avoid a performance hit
   */
  private readonly assertZoomIntervalMatchesViewportSize = () => {
    const { widthPx: calculatedWidthPx } = this.calculateZoomPx(this.getCurrentZoomInterval());
    const calculatedViewportWidthPx = this.roundToSigFigs(
      calculatedWidthPx + this.labelWidthPx(),
      this.maxNumSigFigsForElementSize
    );
    // we need to compare the internal state with the clientWidth AND ensure that the computed width (actual pixels rendered)
    // is equal to the clientWidth, since if these differ, we can be off by a few pixels when positioning things with percentages
    if (this.waveformsContainerRef) {
      if (
        Math.abs(calculatedViewportWidthPx - this.waveformsContainerRef.clientWidth) >
        VIEWPORT_ZOOM_TOLERANCE_PX
      ) {
        logger.debug(`Weavess viewport size does not match internal zoom state.`, {
          expected: calculatedViewportWidthPx,
          actual: this.waveformsContainerRef.clientWidth
        });
      }
      if (
        Math.abs(
          this.waveformsContainerRef.clientWidth - getComputedWidthPx(this.waveformsContainerRef)
        ) > VIEWPORT_ZOOM_TOLERANCE_PX
      ) {
        logger.debug(
          `Weavess viewport size is being approximated. This may lead to precision errors at high zoom levels.`,
          {
            computed: getComputedWidthPx(this.waveformsContainerRef),
            clientWidth: this.waveformsContainerRef.clientWidth
          }
        );
      }
    }
  };

  /**
   * @param zoomInterval the interval to check
   * @returns a zoom interval that is clamped to the maximum element width, if it would
   * exceed that width.
   */
  private readonly calculateMaxElementZoomInterval = (
    zoomInterval: WeavessTypes.TimeRange
  ): WeavessTypes.TimeRange => {
    const zoomRange = this.getZoomRangeFromInterval(zoomInterval);
    const targetWidthPx =
      this.roundToSigFigs(this.maxViewportSizePx, this.maxNumSigFigsForElementSize, 'floor') -
      this.labelWidthPx();
    const newRange = this.dimensions.canvas.clientWidth / targetWidthPx;
    const addRange = (newRange - (zoomRange[1] - zoomRange[0])) / 2;
    zoomRange[0] -= addRange;
    zoomRange[1] += addRange;
    return this.convertRangeToTimeInterval([zoomRange[0], zoomRange[1]]);
  };

  /**
   * @param zoomInterval the interval to check
   * @returns a zoom interval that is clamped to the minimum time interval,
   * if it would exceed that size
   */
  private readonly calculateMaxTimeResolutionZoomInterval = (
    zoomInterval: WeavessTypes.TimeRange
  ): WeavessTypes.TimeRange => {
    const minRange = (1 / MICROSECONDS_IN_SECOND) * SMALLEST_ALLOWED_TIME_RANGE_MICROSECONDS; // One hundred microseconds is the min range we allow
    const midpoint =
      (zoomInterval.endTimeSecs - zoomInterval.startTimeSecs) / 2 + zoomInterval.startTimeSecs;
    return {
      startTimeSecs: midpoint - minRange / 2,
      endTimeSecs: midpoint + minRange / 2
    };
  };

  /**
   * Checks zoom interval for two limits. First if reached max browser width in pixels
   * second if interval is less than 1 microsecond
   *
   * @param zoomInterval
   * @returns limited zoom interval if limit is reached else checked zoom interval
   */
  private readonly clampToMaxZoomInterval = (
    zoomInterval: WeavessTypes.TimeRange
  ): WeavessTypes.TimeRange => {
    // If zoom has reached max browser width in pixels set limit and warn
    // If the display is behind another window max width is 0 and clamping breaks
    if (this.maxViewportSizePx !== 0 && this.isZoomIntervalAtMaxElementWidth(zoomInterval)) {
      return this.calculateMaxElementZoomInterval(zoomInterval);
    }

    // If zoom interval is sub millisecond, set zoom interval to limit and warn
    if (this.isZoomIntervalAtMaxResolution(zoomInterval)) {
      return this.calculateMaxTimeResolutionZoomInterval(zoomInterval);
    }
    return zoomInterval;
  };

  private readonly updateStationsInView = () => {
    const { scrollTop = 0, offsetHeight = 0 } = this.waveformsViewportRef ?? {
      scrollTop: 0,
      offsetHeight: 0
    };
    const channelHeight =
      this.props.stations?.[0]?.defaultChannel?.height ||
      WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS;
    const channels = this.props.stations.flatMap(station => {
      return [
        station.defaultChannel,
        ...(station.areChannelsShowing ? station.nonDefaultChannels || [] : [])
      ];
    });
    const end = scrollTop + offsetHeight;
    const indexStart = Math.floor(scrollTop / channelHeight);
    const indexEnd = Math.min(channels.length, Math.floor(end / channelHeight));

    this.memoizedSetViewportVisibleStations(channels, indexStart, indexEnd);
  };

  /**
   * After zoom update update waveform panel
   */
  private readonly postZoomUpdate = () => {
    // Only run this assertion in development mode to avoid minor performance hits in production
    if (process?.env.NODE_ENV === 'development' && process?.env.GMS_WEAVESS_VIEWPORT_LOGS) {
      this.assertZoomIntervalMatchesViewportSize();
    }
    this.renderWaveforms();
    if (this.timeAxisRef) {
      this.timeAxisRef.update();
    }
  };

  /**
   * Render currently visible waveforms to the canvas.
   * Note: This is not a React render, this is drawing to the canvas. It uses
   * `requestAnimationFrame` in order to queue up work to draw the waveforms
   * to the canvas at the most opportune time. This will happen asynchronously,
   * and not necessarily because of a React render.
   *
   * @param options shouldCallAnimationLoopEnd sets whether {@see onRenderWaveformsLoopEnd} should be triggered (true by default)
   * which can be used to prevent infinite loops.
   * shouldUpdateDimensions sets whether the animation frame should recalculate the dimensions of the DOM (expensive). True by default.
   */
  private readonly renderWaveforms = (options?: AnimationFrameOptions): void => {
    const { shouldCallAnimationLoopEnd = true } = options ?? {
      shouldCallAnimationLoopEnd: true
    };
    // don't render yet if we are resizing
    if (this.props.isResizing !== undefined && this.props.isResizing) {
      defer(this.renderWaveforms, WeavessConstants.ONE_FRAME_MS);
      return;
    }
    window.cancelAnimationFrame(this.prevRAF);
    window.cancelAnimationFrame(this.prevRAFEnd);
    this.prevRAF = window.requestAnimationFrame(
      this.renderWaveformsAnimationFrame(shouldCallAnimationLoopEnd)
    );
  };

  /**
   * The function called by the requestAnimationFrame scheduled in @function renderWaveforms.
   * This actually results in drawing the waveforms.
   */
  private readonly renderWaveformsAnimationFrame =
    (shouldCallAnimationLoopEnd = true) =>
    () => {
      // if we don't have a set size to display, abort
      if (
        !this.weavessRootRef ||
        !this.stationComponentRefs ||
        !this.waveformsViewportRef ||
        !this.canvasRef ||
        this.dimensions.viewport.clientHeight === 0 ||
        this.dimensions.viewport.clientWidth === 0
      ) {
        return;
      }
      /**
       * Schedule a renderWaveformsLoopEnd call. This can be cleared out by a subsequent @function renderWaveforms call.
       * This will only end up firing if we don't schedule another animation frame using @function renderWaveforms.
       *
       */
      if (shouldCallAnimationLoopEnd) {
        window.cancelAnimationFrame(this.prevRAFEnd);
        this.prevRAFEnd = window.requestAnimationFrame(this.onRenderWaveformsLoopEnd);
      }

      this.renderer?.setScissorTest(true);

      this.getStationsChannels().forEach(channel => {
        if (this.renderer && this.canvasRef && this.waveformsViewportRef && channel?.renderScene) {
          channel.renderScene(
            this.renderer,
            this.canvasRef.getBoundingClientRect(),
            this.waveformsViewportRef.getBoundingClientRect()
          );
        }
      });
      this.renderer?.setScissorTest(false);
    };

  /**
   * The amount of pixels allocated for the label
   *
   * @returns number of pixels
   */
  private readonly labelWidthPx = (): number => {
    return (
      this.props.initialConfiguration.labelWidthPx || WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS
    );
  };

  /**
   * The amount of pixels allocated for the label and scrollbar widths
   *
   * @returns number of pixels
   */
  private readonly labelWithScrollbarWidthPx = (): number => {
    return this.labelWidthPx() + this.props.scrollBarWidthPx;
  };

  private readonly setMaxViewportSizePx = (maxPx: number) => {
    this.maxViewportSizePx = maxPx;
  };

  private readonly setMaxBrowserResolution = (maxPx: number) => {
    this.maxNumSigFigsForElementSize = WeavessUtil.calcNumDigits(maxPx);
  };

  /**
   * React component lifecycle
   */
  public render(): JSX.Element {
    const waveformComponents = this.memoizedCreateStationsJsx(this.props, this.maskTarget);
    const markers = this.createAllMarkers(this.props);
    const weavessRootStyle = this.createRootStyle();
    const isSplitChannelOverlayOpen = !!this.props.activeSplitModeType;
    return (
      <HotkeysProvider>
        <HotkeyHandler
          hotKeysConfig={this.props.initialConfiguration.hotKeys}
          zoomInRatio={this.props.hotkeyZoomInRatio}
          zoomOutRatio={this.props.hotkeyZoomOutRatio}
          pan={this.pan}
          panRatio={this.props.panRatio}
          zoomByPercentageToPoint={this.zoomByPercentageToPoint}
          fullZoomOut={this.fullZoomOut}
          createQcSegmentsKeyDown={this.createQcSegmentsKeyDown}
          createQcSegmentsKeyUp={this.createQcSegmentsKeyUp}
          pageDown={this.pageDown}
          pageUp={this.pageUp}
          isSplitChannelOverlayOpen={isSplitChannelOverlayOpen}
        >
          <div
            className="weavess-wp"
            ref={ref => {
              this.weavessRootRef = ref;
            }}
            style={weavessRootStyle}
          >
            <div className="weavess-wp-container">
              <div className="weavess-wp-container-1">
                <div className="weavess-wp-container-2">
                  <div className="weavess-wp-container-3">
                    <ViewportMaxSizer setMaxViewportSizePx={this.setMaxViewportSizePx} />
                    <BrowserMaxResolutionChecker
                      maxSizePx={this.maxViewportSizePx}
                      setMaxElementResolution={this.setMaxBrowserResolution}
                    />
                    <div
                      className="weavess-wp-container-viewport"
                      ref={ref => {
                        this.waveformsViewportRef = ref;
                      }}
                      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                      tabIndex={0}
                      onWheel={this.onWheel}
                      onScroll={this.onScroll}
                    >
                      <div
                        className="scroll-limiter"
                        style={{
                          height: `var(--weavess-canvas-height)`,
                          width: '100%',
                          overflow: 'hidden' // Needed to keep the height of the display correct when opening the measure window
                        }}
                      >
                        <canvas
                          className="weavess-wp-canvas"
                          ref={canvas => {
                            if (canvas) {
                              this.canvasRef = canvas;
                              this.dimensions.canvas.rect = canvas?.getBoundingClientRect();
                              this.dimensions.canvas.clientWidth = canvas.clientWidth;
                            }
                          }}
                          style={{
                            width: `calc(100% - ${this.labelWidthPx()}px)`,
                            height: `var(--weavess-canvas-height)`,
                            left: `${this.labelWidthPx()}px`
                          }}
                        />
                      </div>

                      <div
                        className={classNames('weavess-wp-container-viewport-content', {
                          'high-zoom':
                            this.dimensions.viewportContentContainer.clientWidth >
                            SIG_FIG_MULTIPLICATIVE ** this.maxNumSigFigsForElementSize
                        })}
                        ref={waveformsContainer => {
                          this.waveformsContainerRef = waveformsContainer;
                        }}
                      >
                        {waveformComponents}
                        <div
                          className="weavess-wp-container-viewport-content-markers"
                          style={{
                            width: `calc(100% - ${this.labelWithScrollbarWidthPx()}px)`,
                            left: `${this.labelWidthPx()}px`
                          }}
                        >
                          {markers}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="weavess-wp-container-overlay"
                  style={{
                    width: `calc(100% - ${this.labelWithScrollbarWidthPx()}px)`
                  }}
                >
                  <div
                    className="weavess-wp-container-overlay-cross-hair"
                    ref={ref => {
                      this.crosshairRef = ref;
                    }}
                  />
                  <Ruler
                    isActive={this.state.rulerIsActive}
                    initialPoint={this.state.rulerInitialPoint}
                    containerDimensions={this.dimensions}
                    computeTimeSecsForMouseXFractionalPosition={
                      this.computeTimeSecsForMouseXFractionalPosition
                    }
                    onRulerMouseUp={this.onRulerMouseUp}
                  />
                  <div
                    className="weavess-wp-container-overlay-selection-area"
                    ref={ref => {
                      this.selectionAreaRef = ref;
                    }}
                  />
                </div>
              </div>
              {this.props.stations.length > 0 ? (
                <TimeAxis
                  ref={ref => {
                    this.timeAxisRef = ref;
                  }}
                  displayInterval={this.getCurrentZoomInterval()}
                  borderTop
                  labelWidthPx={this.labelWidthPx()}
                  scrollbarWidthPx={this.props.scrollBarWidthPx}
                  label={this.props.initialConfiguration.xAxisLabel}
                />
              ) : (
                []
              )}
            </div>
            <TimeRange
              labelWidthPx={this.labelWidthPx()}
              currentZoomInterval={this.getCurrentZoomInterval()}
            />
            <div className="weavess-wp-info-bar">{this.props.extraInfoBar}</div>
          </div>
        </HotkeyHandler>
      </HotkeysProvider>
    );
  }
}
