import type { WeavessTypes } from '@gms/weavess-core';

/** Brush Type */
export enum BrushType {
  /** zoom brush type */
  Zoom = 'Zoom',

  /** create mask brush type */
  CreateMask = 'CreateMask'
}

/**
 * The options that may be passed ot the renderWaveforms function to control
 * the lifecycle of the animation frame.
 */
export interface AnimationFrameOptions {
  // if true (default) will attempt to call the onRenderWaveformsLoopEnd function.
  // set it to false if called from a function that is invoked by the onRenderWaveformsLoopEnd
  // function (such as updateAmplitudes), which would trigger an endless animation frame cycle.
  shouldCallAnimationLoopEnd?: boolean;
}

/**
 * Call back that updates the measure window
 *
 * @param stationId Station Id as a string
 * @param channel channel config as a Channel
 * @param startTimeSecs epoch seconds start
 * @param endTimeSecs epoch seconds end
 * @param isDefaultChannel boolean
 * @param removeSelection call back to remove selection
 */
export type updateMeasureWindow = (
  stationId: string,
  channel: WeavessTypes.Channel,
  startTimeSecs: number,
  endTimeSecs: number,
  isDefaultChannel: boolean,
  waveformAmplitudeScaleFactor: number,
  removeSelection: () => void
) => void;

/**
 * Waveform DisplayProps
 */
export interface WeavessWaveformDisplayProps {
  /** waveform display configuration */
  initialConfiguration?: Partial<WeavessTypes.Configuration>;

  /** flex or not? */
  flex?: boolean;

  /** viewable time interval, full amount of data window */
  viewableInterval: WeavessTypes.TimeRange;

  /** callback executed when closing expanded mode */
  closeSplitChannelOverlayCallback?: () => void;

  /** viewable interval plus its min/max offsets; full amount of data window */
  displayInterval: WeavessTypes.TimeRange;

  /** stations */
  stations: WeavessTypes.Station[];

  /** events */
  events: WeavessTypes.Events;

  /** Is the main waveform panel controlled or uncontrolled */
  /** default assume controlled */
  isControlledComponent?: boolean;

  /**
   * The current interval might be different than viewable interval.
   * Will default to use viewableInterval if not set.
   */
  currentInterval?: WeavessTypes.TimeRange;

  /** markers */
  markers?: WeavessTypes.Markers;

  /** Defines a custom component for displaying a custom label */
  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** display the measure window */
  showMeasureWindow?: boolean;

  /** specifies the measure window selection */
  measureWindowSelection?: WeavessTypes.MeasureWindowSelection;

  uiTheme?: {
    isLightMode: boolean;
  };

  splitModePickMarkerColor?: string;

  /** The amount to zoom in when using the zoom hotkeys. Defaults to 0.5. */
  hotkeyZoomInRatio?: number;

  /** The amount to zoom out when using the zoom hotkeys. Defaults to 0.6666666667. */
  hotkeyZoomOutRatio?: number;

  /** The ratio of the screen to pan when using hotkeys, where 0 is none, and 1 is the full screen. Defaults to 0.25 */
  panRatio?: number;

  /**
   * By default, WEAVESS creates its own toast container. If one is provided by the parent, set this to true in order
   * avoid having multiple toasts.
   */
  disableToastContainer?: boolean;

  /** a JSX element that will render to the right of the time axis to display extra info */
  extraInfoBar?: JSX.Element;

  /** Differentiates between SD creation and waveform selection when split mode is active */
  activeSplitModeType?: WeavessTypes.SplitMode;

  /** event handler for clearing selected channels */
  clearSelectedChannels?(): void;

  /**
   * Event handler for selecting a channel
   *
   * @param channelId a Channel Id as a string
   */
  selectChannel?(channelId: string): void;

  /**
   * Used to look up the position buffer data (a Float32Array formatted like so: x y x y x y ...).
   * Takes the position buffer's id.
   */
  getPositionBuffer?(
    id: string,
    startTime: number,
    endTime: number,
    domainTimeRange: WeavessTypes.TimeRange
  ): Promise<Float32Array>;

  /**
   * Used to look up the Channel Segment Boundaries for a given channel segment by name
   */
  getBoundaries?(
    channelName: string,
    channelSegment: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange,
    isMeasureWindow?: boolean
  ): Promise<WeavessTypes.ChannelSegmentBoundaries | undefined>;

  onMount?(weavessInstance: WeavessTypes.WeavessInstance): void;

  setViewportVisibleStations?(
    channels: WeavessTypes.Channel[],
    indexStart: number,
    indexEnd: number
  ): void;
}

export interface WeavessWaveformDisplayState {
  /** Configuration for waveform display */
  initialConfiguration: WeavessTypes.Configuration;

  /** display the measure window */
  showMeasureWindow?: boolean;

  /** Determines if the measure window is displayed */
  isMeasureWindowVisible: boolean;

  /** Height of the measure window in pixels */
  measureWindowHeightPx: number;

  /** Selection info needed to render a measure window */
  measureWindowSelection: WeavessTypes.MeasureWindowSelection | undefined;

  /**
   * the previous measure window selection passed in from props
   * (used to ensure the measure window is only updated when expected)
   */
  prevMeasureWindowSelectionFromProps: WeavessTypes.MeasureWindowSelection | undefined;

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;
}

export interface WeavessWaveformPanelProps {
  /** the display mode */
  // mode: WeavessTypes.Mode;

  /** Configuration for Waveform Panel */
  initialConfiguration: WeavessTypes.Configuration;

  /** callback executed when closing expanded mode */
  closeSplitChannelOverlayCallback?: () => void;

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;

  /** viewable interval plus its min/max offsets; full amount of data window */
  displayInterval: WeavessTypes.TimeRange;

  /** viewable time interval, the amount of data initially loaded into weavess (excluding offsets) */
  viewableInterval: WeavessTypes.TimeRange;

  /** Array of Stations */
  stations: WeavessTypes.Station[];

  /** Call back events */
  events: WeavessTypes.Events;

  /* Is this display a controlled component */
  /* Controlled is the primary waveform panel containing all the stations */
  /* Uncontrolled is the measure window */
  isControlledComponent: boolean;

  /** (Optional) Markers for Waveform Panel */
  markers?: WeavessTypes.Markers;

  /** Sets as a flex display if active */
  flex?: boolean;

  /**
   * Indicates whether the display is being resized because
   * the measure window is being resized
   */
  isResizing?: boolean;

  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** Amplitude scale factor to apply to measure window's waveform renderer */
  msrWindowWaveformAmplitudeScaleFactor?: number;

  /** The amount to zoom in when using the zoom hotkeys. Defaults to 0.5. */
  hotkeyZoomInRatio?: number;

  /** The amount to zoom out when using the zoom hotkeys. Defaults to 0.6666666667. */
  hotkeyZoomOutRatio?: number;

  panRatio?: number;

  /** a JSX element that will render to the right of the time axis to display extra info */
  extraInfoBar?: JSX.Element;

  /**
   * The width of the scroll bar for this waveform panel.
   */
  scrollBarWidthPx: number;

  splitModePickMarkerColor?: string;

  /** Unselects channels */
  clearSelectedChannels?(): void;

  /** Selects channel
   *
   * @param channelId Channel Id as a string
   */
  selectChannel?(channelId: string): void;

  /**
   * (optional) Updates the measure window
   */
  updateMeasureWindow?: updateMeasureWindow;

  /**
   *
   * @param id the id of a DataSegment for which to get the formatted position buffer data
   */
  getPositionBuffer?(
    id: string,
    startTime: number,
    endTime: number,
    domainTimeRange: WeavessTypes.TimeRange
  ): Promise<Float32Array>;

  /**
   * Used to look up the Channel Segment Boundaries for a given channel segment by name
   */
  getBoundaries?(
    channelName: string,
    channelSegment: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange,
    isMeasureWindow?: boolean | undefined
  ): Promise<WeavessTypes.ChannelSegmentBoundaries | undefined>;

  /**
   * Converts a time into GL Units (the units used in the WebGL clip space)
   *
   * @param timeSec the time you wish to convert
   */
  convertTimeToGL(timeSec: number): number;

  /**
   * Used to reset all waveform channel's amplitude scaling including the Measure Window
   */
  resetWaveformPanelAmplitudes(): void;

  setViewportVisibleStations?(
    channels: WeavessTypes.Channel[],
    indexStart: number,
    indexEnd: number
  ): void;

  activeSplitModeType: WeavessTypes.SplitMode | undefined;
}

export interface WeavessWaveformPanelState {
  /** Keeps track if the ruler tool is active or not */
  rulerIsActive: boolean;

  /** The initial point where the ruler was rendered used to calculate the ruler and duration */
  rulerInitialPoint: { x: number; y: number } | undefined;

  /** The current zoom interval of waveform panel when panel is uncontrolled */
  zoomTimeInterval: WeavessTypes.TimeRange;
}
