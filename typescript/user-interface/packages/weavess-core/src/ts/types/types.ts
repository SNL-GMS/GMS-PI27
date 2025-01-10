import type React from 'react';

import type { WeavessTypes } from '../weavess-core';

/**
 * An interface containing all public methods and variables of the
 * weavess WaveformPanel instance. We expose this here, explicitly,
 * to avoid circular dependencies.
 */
export interface WaveformPanelInstance {
  refresh(): void;
  resetAmplitudes(): void;
  computeTimeSecsForMouseXFractionalPosition(mouseXPositionFraction: number): number;
  computeTimeSecsFromMouseXPixels(mouseXPx: number): number;
  computeFractionOfCanvasFromXPositionPx(xPositionPx: number): number;
  getCanvasBoundingClientRect(): DOMRect | undefined;
  clearBrushStroke(): void;
  getOrderedVisibleChannelNames(): string[];
  getChannelWaveformYAxisBounds(channelName: string): YAxisBounds | undefined;
  getCurrentZoomInterval(): TimeRange;
  getManualAmplitudeScaledChannels(): WeavessTypes.Channel[];
  getViewportBoundingClientRect(): DOMRect | undefined;
  resetSelectedWaveformAmplitudeScaling(channelIds: string[]): void;
  zoomToTimeWindow(zoomInterval: TimeRange): void;
}

/**
 * An interface containing all public methods and variables of the
 * weavess instance. We expose this here, explicitly,
 * to avoid circular dependencies.
 */
export interface WeavessInstance {
  readonly waveformPanelRef: WaveformPanelInstance | null;
  readonly measureWindowContainerRef: HTMLDivElement | null;
  readonly measureWindowPanelRef: WaveformPanelInstance | null;
  refresh(): void;
  convertTimeToGL(timeSec: number): number;
  isMeasureWindowVisible(): boolean;
  clearBrushStroke(): void;
  updateBrushStroke(start: number, end: number): void;
  toggleMeasureWindowVisibility(): void;
  toggleRenderingContent(): void;
  toggleShouldRenderWaveforms(): void;
  toggleShouldRenderSpectrograms(): void;
  resetWaveformPanelAmplitudes(): void;
  resetSelectedWaveformAmplitudeScaling(channelIds: string[], isMeasureWindow?: boolean): void;
}
/**
 * Type of display
 */
export enum DisplayType {
  /** String representation of line type 'LINE' */
  LINE = 'LINE',

  /** String representation of line type 'SCATTER' */
  SCATTER = 'SCATTER'
}

/**
 * Type of line
 */
export enum LineStyle {
  /** String representation of solid line */
  SOLID = 'solid',

  /** String representation of dashed line */
  DASHED = 'dashed',

  /** String representation of dotted line */
  DOTTED = 'dotted'
}

/**
 * Distance value's units degrees or kilometers
 */
export enum DistanceUnits {
  /** String representation of 'degrees' */
  degrees = 'degrees',

  /** String representation of 'km' */
  km = 'km'
}

// Enum to clarify pan direction
export enum PanType {
  Left,
  Right
}

/**
 * The display mode options for the waveform display.
 */
export enum WaveformDisplayMode {
  DEFAULT = 'Default',
  MEASUREMENT = 'Measurement'
}

export enum SplitMode {
  CREATE_SD = 'CREATE_SD',
  SELECT_WAVEFORM = 'SELECT_WAVEFORM'
}

export interface YAxisBounds {
  /** The height in percentage */
  heightInPercentage: number;

  /** Max amplitude as a number */
  maxAmplitude: number;

  /** Min amplitude as a number */
  minAmplitude: number;
}

/**
 * Time range of start time and end time
 */
export interface TimeRange {
  /** Start Time in seconds */
  startTimeSecs: number;

  /** End Time in seconds */
  endTimeSecs: number;
}

export interface MeasureWindowSelection {
  /** Station Id as a string */
  stationId: string;

  /** Channel config from the selection */
  channel: Channel;

  /** Epoch seconds of the start */
  startTimeSecs: number;

  /** Epoch seconds of the end */
  endTimeSecs: number;

  /** Indicates if default channel (used for specific event handling) */
  isDefaultChannel: boolean;

  /** Waveform amplitude scale factor  */
  waveformAmplitudeScaleFactor: number;

  /** Callback to remove the measure window selection div */
  removeSelection?(): void;
}

/**
 * Configuration object
 */
export interface Configuration {
  /** Default channel height in pixels */
  readonly defaultChannelHeightPx?: number;

  /** Label width in pixels */
  readonly labelWidthPx?: number;

  /** (optional) x-axis label */
  readonly xAxisLabel?: string;

  /** If true, then do not show the y-axis on the label */
  readonly suppressLabelYAxis?: boolean;

  /** true if waveforms should be rendered; false otherwise */
  readonly shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  readonly shouldRenderSpectrograms: boolean;

  /** Configuration of Hotkeys */
  readonly hotKeys?: HotKeysConfiguration;

  /** Default channel */
  readonly defaultChannel: ChannelConfiguration;

  /** Non default channel */
  readonly nonDefaultChannel: ChannelConfiguration;

  readonly backgroundColor: string;

  readonly outOfBoundsColor: string;

  readonly waveformDimPercent: number;

  readonly sdUncertainty: {
    readonly fractionDigits: number;
    readonly minUncertainty: number;
  };

  /**
   * Custom color scale. Returns a color
   * as a string for the given value.
   */
  colorScale?(value: number): string;
}

/**
 * Defines an individual hotkey
 */
export interface HotKeyConfiguration {
  /** Combination of keys to trigger the hotkey */
  combos: string[];
  category?: string;
  description?: string;
}

/**
 * Hotkeys
 */
export interface HotKeysConfiguration {
  /** Hotkey for creating a new signal detection with the current phase */
  createSignalDetectionWithCurrentPhase?: HotKeyConfiguration;

  /** Hotkey for creating a new signal detection with the default phase */
  createSignalDetectionWithDefaultPhase?: HotKeyConfiguration;

  /** Hotkey for creating a new signal detection with the chosen (from selection menu) phase */
  createSignalDetectionWithChosenPhase?: HotKeyConfiguration;

  /** Hotkey for creating a new signal detection not associated to a waveform with the current phase */
  createSignalDetectionNotAssociatedWithWaveformCurrentPhase?: HotKeyConfiguration;

  /** Hotkey for creating a new signal detection not associated to a waveform with the default phase */
  createSignalDetectionNotAssociatedWithWaveformDefaultPhase?: HotKeyConfiguration;

  /** Hotkey for creating a new signal detection not associated to a waveform with the chosen phase */
  createSignalDetectionNotAssociatedWithWaveformChosenPhase?: HotKeyConfiguration;

  /** Hotkey for scaling amplitude */
  scaleWaveformAmplitude?: HotKeyConfiguration;

  /** Hotkey for resetting amplitude of selected channels */
  resetSelectedWaveformAmplitudeScaling?: HotKeyConfiguration;

  /** Hotkey for resetting amplitude globally */
  resetAllWaveformAmplitudeScaling?: HotKeyConfiguration;

  /** Hotkey for scaling all amplitudes to the selected channel */
  scaleAllWaveformAmplitude?: HotKeyConfiguration;

  /** Hotkey for drawing the measure window (hold this key + click and drag) */
  drawMeasureWindow?: HotKeyConfiguration;

  /** Hotkey for hiding the measure window */
  hideMeasureWindow?: HotKeyConfiguration;

  /** Hotkey for creating mask */
  createQcSegments?: HotKeyConfiguration;

  /** Hotkey for viewing QC segment details */
  viewQcSegmentDetails?: HotKeyConfiguration;

  /** Hotkey for zooming out completely */
  zoomOutFully?: HotKeyConfiguration;

  /** Hotkey for editing uncertainty bars */
  editSignalDetectionUncertainty?: HotKeyConfiguration;

  /** Hotkey for toggling time uncertainty visibility */
  toggleUncertainty?: HotKeyConfiguration;

  /**  Hotkey for zooming in */
  zoomOutOneStep?: HotKeyConfiguration;

  /**  Hotkey for zooming out */
  zoomInOneStep?: HotKeyConfiguration;

  /** Hotkey for panning left */
  panLeft?: HotKeyConfiguration;

  /**  Hotkey for for panning right */
  panRight?: HotKeyConfiguration;

  /** Scroll down in the waveform display a distance equal to the entire viewport, minus one row */
  pageDown?: HotKeyConfiguration;

  /** Scroll up in the waveform display a distance equal to the entire viewport, minus one row */
  pageUp?: HotKeyConfiguration;

  /**  Hotkey for for toggling the current phase menu */
  toggleCurrentPhaseMenu?: HotKeyConfiguration;

  /** Hotkey to close the create signal detection overlay */
  closeCreateSignalDetectionOverlay?: HotKeyConfiguration;
}

/**
 * Channel Configuration
 */
export interface ChannelConfiguration {
  /** Indicate whether measure window is on or not */
  disableMeasureWindow?: boolean;

  /** Indicate whether mask modification is available */
  disableMaskModification?: boolean;
}

export interface LabelProps {
  /** Channel configuration (holds the data) */
  channel: Channel;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** Does have sub channels */
  isExpandable: boolean;

  /* Is this part of the Measure Window */
  isMeasureWindow: boolean;

  /** callback executed when closing expanded mode */
  closeSplitChannelOverlayCallback?: () => void;

  /** Displaying sub channels */
  expanded: boolean;

  /** The y-axis bounds for the waveform and the spectrogram */
  yAxisBounds: { waveformYAxisBounds?: YAxisBounds; spectrogramYAxisBounds?: YAxisBounds };

  /** Toggles red M when mask(s) is in view */
  showMaskIndicator: boolean;

  /** Distance */
  distance: number;

  /** Distance units */
  distanceUnits: DistanceUnits;

  /** Azimuth */
  azimuth: number;

  /** Added Channel Name to help keep track
   * which channel the label belongs to */
  channelName: string;

  /** (optional) callback events Ex on label click */
  events?: LabelEvents;

  /** Defines a custom component for displaying a custom label */
  customLabel?: React.FunctionComponent<LabelProps>;

  /** Optional text to be displayed in the top left of the channel's label */
  labelHeader?: string | JSX.Element;

  suppressLabelYAxis?: boolean;

  /** Tooltip for the Channel Label */
  channelLabelTooltip?: string;
}

/**
 * Station configuration
 */
export interface Station {
  /** Id of station */
  id: string;

  /** Name of station */
  name: string;

  /** Default channel information for station */
  defaultChannel: Channel;

  /** Non-default channels for station */
  nonDefaultChannels?: Channel[];

  /** Non-default channels for station */
  splitChannels?: Channel[];

  /** Indicates if the child weavess channels are displayed (label expanded) */
  areChannelsShowing?: boolean;

  /** Distance of station */
  distance?: number;

  /** Units for distance */
  distanceUnits?: DistanceUnits;

  /** Distance of station */
  azimuth?: number;

  /** Has QC masks */
  hasQcMasks?: boolean;
}

/** Specifies a range with a min and max */
export interface Range {
  /** the min */
  min?: number;
  /** the max */
  max?: number;
}

/**
 * An interface describing a channel, including whether it is in an error state.
 * The channel can also take a simple string as a description.
 */
export interface ChannelDescription {
  /** Shown in the bottom right corner of the channel row */
  message: string | undefined;

  /** shown in a tooltip on hover */
  tooltipMessage?: string;

  /** indicates that the description should be formatted as an error state */
  isError?: boolean;
}

/**
 * Channel configuration
 */
export interface Channel {
  /** Id of channel */
  id: string;

  /** Name of channel */
  name: string;

  /** Type of channel */
  channelType?: string;

  /** Height of the channel */
  height?: number;

  /** The number of seconds the data should be offset  */
  timeOffsetSeconds?: number;

  /** The arrival time of the station nearest the open event */
  baseStationTime?: number;

  /** Waveform content */
  waveform?: ChannelWaveformContent;

  /** Spectrogram content */
  spectrogram?: ChannelSpectrogramContent;

  /** default display range scale */
  defaultRange?: Range;

  /** the y axis ticks */
  yAxisTicks?: number[];

  /** Collection of markers to be rendered on the channel */
  markers?: Markers;

  /** Tooltip for the Channel Label */
  channelLabelTooltip?: string;

  /** Label for channels */
  channelLabel?: string;

  /** The description to show on the bottom right corner of the channel row */
  description?: string | ChannelDescription;

  /** Distance */
  distance?: number;

  /** Distance units */
  distanceUnits?: DistanceUnits;

  /** Azimuth */
  azimuth?: number;

  /** The split point in the timeline, if split mode is activated */
  splitChannelTime?: number;

  /** The phase of signal detection to be created by the split mode */
  splitChannelPhase?: string;

  configuredInputChannelNames?: string[];

  /** Optional text to be displayed in the top left of the channel's label */
  labelHeader?: string | JSX.Element;

  /** Whether this channel is selected */
  isSelected: boolean;
}

export interface ChannelWaveformContent {
  /** Id of channel segment */
  channelSegmentId: string;

  /** Collection of channel segments */
  channelSegmentsRecord: Record<string, ChannelSegment[]>;

  /** Collection of markers */
  markers?: Markers;

  /** Collection of masks */
  masks?: Mask[];

  /** Collection of signal detections */
  signalDetections?: PickMarker[];

  /** Collection of predictive phases */
  predictedPhases?: PickMarker[];

  /** Collection of theoretical phase windows */
  theoreticalPhaseWindows?: TheoreticalPhaseWindow[];

  /** Forces the channel to dim */
  isAutoDimmed?: boolean;
}

/** Channel Segment Boundaries contains:
 *  Amplitude min, max, avg and offset for each waveform content */
export interface ChannelSegmentBoundaries {
  /** Maximum value of top */
  topMax: number;

  /** Maximum value of bottom */
  bottomMax: number;

  /** Average of channel */
  channelAvg: number;

  /** The maximum magnitude of this channel */
  offset: number;

  /** Channel segment id */
  channelSegmentId: string | undefined;

  /** Samples count used to compute average helps
      when merging multiple boundaries */
  samplesCount?: number;

  /** topMax epoch seconds found */
  topMaxSecs?: number;

  /** bottomMax epoch seconds found */
  bottomMaxSecs?: number;
}

export interface ChannelSpectrogramContent {
  /** Spectrogram description */
  description?: string;

  /** Color of the label for the description */
  descriptionLabelColor?: string;

  /** Epoch start time in seconds */
  startTimeSecs: number;

  /** The time step of the spectrogram data (x-axis) */
  timeStep: number;

  /** The frequency step of the spectrogram data (y-axis) */
  frequencyStep: number;

  /**
   * The spectrogram data (time x frequency)
   * Provides the powers or intensity of the spectrogram
   */
  data: number[][];

  /** Collection of markers */
  markers?: Markers;

  /** Collection of signal detections */
  signalDetections?: PickMarker[];

  /** Collection of predictive phases */
  predictedPhases?: PickMarker[];

  /** Collection of theoretical phase windows */
  theoreticalPhaseWindows?: TheoreticalPhaseWindow[];
}

/** Channel Default Configuration */
export interface ChannelDefaultConfiguration {
  /** Display type */
  displayType: DisplayType[];

  /** Point size */
  pointSize: number;

  /** Color as a string */
  color: string;
}

export const UNFILTERED = 'Unfiltered';

/** Channel Segment */
export interface ChannelSegment {
  /** Name of the configured input of the channel, this will be stable between filters and can be used
   * to select original (unfiltered) channel record */
  configuredInputName: string;

  /** Channel Name of the Waveform */
  channelName: string;

  /** Waveform filter of the Waveform the default (Raw) data is 'unfiltered' */
  wfFilterId: string;

  /** Flags this channel segment is selected */
  isSelected: boolean;

  /** Collection of data segments */
  dataSegments: DataSegment[];

  /** Channel segment description */
  description?: string;

  /** Color of the label for the description */
  descriptionLabelColor?: string;

  /** processed Amplitude values during Typed Array conversion */
  channelSegmentBoundaries?: ChannelSegmentBoundaries;

  /** Units of the channel segment time series data */
  units?: string;

  /** The type of time series in this segment. */
  timeseriesType?: string;
}

/**
 * Represents data values by sample start time and sample rate
 */
export interface DataBySampleRate {
  /** Epoch start time in seconds */
  startTimeSecs: number;

  /** Epoch end time in seconds */
  endTimeSecs: number;

  /** Sample Rate */
  sampleRate: number;

  /** Collection representing data segment data */
  values: Float32Array | number[];
}

export interface DataClaimCheck extends Omit<DataBySampleRate, 'values'> {
  /** Collection representing data segment data */
  values: Float32Array | number[] | undefined;

  /** Claim check ID. Used to fetch and perform operations on this waveform sample data. */
  id: string;

  /** Used in conversion of waveform to set x (time) position */
  domainTimeRange: TimeRange;
}

/**
 * Represents a time value pair.
 */
export interface TimeValuePair {
  timeSecs: number;
  value: number;
}

/**
 * Represents data values by time.
 */
export interface DataByTime {
  values: TimeValuePair[] | Float32Array;
}

/** Data Segment */
export interface DataSegment {
  /** Color */
  color?: string;

  /** Display type */
  displayType?: DisplayType[];

  /** Point size */
  pointSize?: number;

  /** Collection representing data segment data */
  data: DataBySampleRate | DataByTime | DataClaimCheck;
}

/** Pick Marker Configuration */
export interface PickMarker {
  /** unique id of the pick marker */
  id: string;

  /** Time in seconds of the pick marker */
  timeSecs: number;

  /** Uncertainty in seconds of the time */
  uncertaintySecs: number;

  /** Show uncertainty bars on the channel */
  showUncertaintyBars: boolean;

  /** Label of pick marker */
  label: string;

  /** Color of pick marker */
  color: string;

  /** Is this pick in conflict */
  isConflicted: boolean;

  /** Is the marker selected */
  isSelected: boolean;

  /** Is the marker an action target */
  isActionTarget: boolean;

  /** Determines if a pick marker is draggable/moveable */
  isDraggable: boolean;

  /** Is this pick disabled for some other reason */
  isDisabled?: boolean;

  /**
   * A filter provided for the pick marker
   *
   * style.filter = "none | blur() | brightness() | contrast() | drop-shadow() |
   *                 grayscale() | hue-rotate() | invert() | opacity() | saturate() | sepia()"
   */
  filter?: string;
}

/** Theoretical Phase Window */
export interface TheoreticalPhaseWindow {
  /** Id of theoretical phase window */
  id: string;

  /** Epoch start time in seconds */
  startTimeSecs: number;

  /** Epoch end time in seconds */
  endTimeSecs: number;

  /** Label */
  label: string;

  /** Color */
  color: string;
}

/** Mask */
export interface Mask {
  /** Id of mask */
  id: string;

  /** Epoch start time of mask in seconds */
  startTimeSecs: number;

  /** Epoch end time of mask in seconds */
  endTimeSecs: number;

  /** Color of mask */
  color: string;

  /** Whether or not the mask is a processing mask */
  isProcessingMask: boolean;
}

/** Event Label */
export interface LabelEvents {
  /**
   * Event handler for channel expansion
   *
   * @param channelId a Channel Id as a string
   */
  onChannelExpanded?(channelId: string): void;
  /**
   * Event handler for channel collapse
   *
   * @param channelId a Channel Id as a string
   */
  onChannelCollapsed?(channelId: string): void;
  /**
   * Event handler for when a channel label is clicked
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   */
  onChannelLabelClick?(e: React.MouseEvent<HTMLDivElement>, channelId: string): void;

  /**
   * Event handler for when a channel label is right-clicked
   *
   * @param e mouse event
   * @param channelId name of the channel that was clicked as a string
   * @param isDefaultChannel boolean that specifies if the channel is top level or sub channel
   */
  onContextMenu?(
    e: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    amplitudeMinValue: number,
    amplitudeMaxValue: number,
    isDefaultChannel: boolean,
    isMeasureWindow: boolean
  ): void;
}

/** Channel content events */
export interface ChannelContentEvents {
  /**
   * Event handler for when context menu is displayed
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   */
  onContextMenu?(e: React.MouseEvent<HTMLDivElement>, channelId: string, timeSecs: number): void;

  /**
   * Event handler for when channel is clicked
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   * @param timeSecs epoch seconds of where clicked in respect to the data
   */
  onChannelClick?(
    e: React.MouseEvent<HTMLDivElement>,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isMeasureWindow?: boolean,
    isDragged?: boolean
  ): void;

  /**
   * Event handler for when signal detection is clicked
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param sdId a Signal Detection Id as a string
   */
  onSignalDetectionClick?(e: React.MouseEvent<HTMLDivElement>, sdId: string): void;

  /**
   * Event handler for when a signal detection is double-clicked
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param sdId a Signal Detection Id as a string
   */
  onSignalDetectionDoubleClick?(e: React.MouseEvent<HTMLDivElement>, sdId: string): void;

  /**
   * Event handler for when context menu is displayed
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   * @param sdId a Signal Detection Id as a string
   */
  onSignalDetectionContextMenu?(
    e: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    sdId: string
  ): void;

  /**
   * Event handler for when a signal detection drag ends
   *
   * @param sdId a Signal Detection Id as a string
   * @param timeSecs epoch seconds of where drag ended in respect to the data
   * @param uncertaintySecs seconds
   */
  onSignalDetectionDragEnd?(sdId: string, timeSecs: number, uncertaintySecs: number): void;

  /**
   * Event handler for when predictive phase is clicked
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param id a predictive phase Id as a string
   */
  onPredictivePhaseClick?(e: React.MouseEvent<HTMLDivElement>, id: string): void;

  /**
   * Event handler for when context menu is displayed
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   * @param id a Predictive Phase Id as a string
   */
  onPredictivePhaseContextMenu?(
    e: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    id: string
  ): void;

  /**
   * Event handler for clicking on mask
   *
   * @param event mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   * @param maskId mask Ids as a string array
   * @param maskCreateHotKey (optional) indicates a hotkey is pressed
   */
  onMaskClick?(
    event: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    maskId: string[],
    maskCreateHotKey?: boolean,
    viewQcSegmentHotKey?: boolean
  ): void;

  /**
   * Event handler for context clicking on a mask
   *
   * @param event mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId a Channel Id as a string
   * @param masks mask Ids as a string array
   */
  onMaskContextClick?(event: React.MouseEvent<HTMLDivElement>, channelId: string, masks: string[]);

  /**
   * Event handler for when a create mask drag ends
   *
   * @param event mouse event as React.MouseEvent<HTMLDivElement>
   * @param selectedStationIds names of currently selected stations/channels
   * @param startTimeSecs epoch seconds of where clicked started
   * @param endTimeSecs epoch seconds of where clicked ended
   */
  onMaskCreateDragEnd?(
    event: React.MouseEvent<HTMLDivElement>,
    selectedStationIds: string[],
    startTimeSecs: number,
    endTimeSecs: number
  ): void;

  /**
   * Event handler that is invoked and handled when the Measure Window is updated.
   *
   * @param isVisible true if the measure window is updated
   * @param channelId the unique channel id of the channel that the measure window on;
   * channel id is undefined if the measure window is not visible
   * @param startTimeSecs the start time in seconds of the measure window;
   * start time seconds is undefined if the measure window is not visible
   * @param endTimeSecs the end time in seconds of the measure window;
   * end time seconds is undefined if the measure window is not visible
   * @param heightPx the height in pixels of the measure window;
   * height pixels is undefined if the measure window is not visible
   */
  onMeasureWindowUpdated?(
    isVisible: boolean,
    channelId?: string,
    startTimeSecs?: number,
    endTimeSecs?: number,
    heightPx?: number
  ): void;

  /**
   * Event handler for updating markers value
   *
   * @param channelId the unique channel id of the channel
   * @param marker the marker
   */
  onUpdateMarker?(id: string, marker: Marker): void;

  /**
   * Event handler for invoked while the selection is moving
   *
   * @param channelId the unique channel id of the channel
   * @param selection the selection
   *
   */
  onMoveSelectionWindow?(channelId: string, selection: SelectionWindow): void;

  /**
   * Event handler for updating selections value
   *
   * @param channelId the unique channel id of the channel
   * @param selection the selection
   *
   */
  onUpdateSelectionWindow?(channelId: string, selection: SelectionWindow): void;

  /**
   * Event handler for click events within a selection
   *
   * @param channelId the unique channel id of the channel
   * @param selection the selection
   * @param timeSecs epoch seconds of where drag ended in respect to the data
   */
  onClickSelectionWindow?(channelId: string, selection: SelectionWindow, timeSecs: number): void;

  onWaveformSelectionMouseUp?(
    e: React.MouseEvent<HTMLDivElement>,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isMeasureWindow?: boolean,
    isDragged?: boolean
  );
}

/** Channel Events */
export interface ChannelEvents {
  /** Events of label */
  labelEvents?: LabelEvents;

  /** events on the channel content */
  events?: ChannelContentEvents;

  /**
   * Event handler for when a key is pressed
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param clientX x location of where the key was pressed
   * @param clientY y location of where the key was pressed
   * @param channelId a Channel Id as a string
   * @param timeSecs epoch seconds of where the key was pressed in respect to the data
   */
  onKeyPress?(
    e: React.KeyboardEvent<HTMLDivElement>,
    clientX: number,
    clientY: number,
    channel: WeavessTypes.Channel,
    timeSecs: number
  ): void;

  /**
   * Callback when the amplitude for a channel has been set
   */
  onSetAmplitude?(
    channelId: string,
    channelSegmentBounds: ChannelSegmentBoundaries,
    isMeasureWindow: boolean
  ): void;
}

/** Station Events */
export interface StationEvents {
  /** Default channel events */
  defaultChannelEvents?: ChannelEvents;

  /** Non-default channel events */
  nonDefaultChannelEvents?: ChannelEvents;
}

/** Events */
export interface Events {
  /** station events */
  stationEvents?: StationEvents;

  /**
   * Event handler for updating markers value
   *
   * @param channelId the unique channel id of the channel
   * @param marker the marker
   */
  onUpdateMarker?(marker: Marker): void;

  /**
   * Event handler for updating selections value
   *
   * @param selection the selection
   */
  onUpdateSelectionWindow?(selection: SelectionWindow): void;

  /**
   * Event handler for invoked while the selection is moving
   *
   * @param selection the selection
   *
   */
  onMoveSelectionWindow?(selection: SelectionWindow): void;

  /**
   * Event handler for click events within a selection
   *
   * @param selection the selection
   * @param timeSecs epoch seconds of where drag ended in respect to the data
   */
  onClickSelectionWindow?(SelectionWindow, timeSecs: number): void;

  /**
   * Event handler for on zoom change - fired when zoom changes
   *
   * @param timeRange the updated zoom time range
   */
  onZoomChange?(timeRange: TimeRange): void;

  /**
   * Callback for when the measure window is resized. Note that this can
   * occur even if the measure window has no selection.
   *
   * @param heightPx the new height of the measure window in pixels
   */
  onMeasureWindowResize?(heightPx: number): void;

  /**
   * Callback when the user presses the "reset all amplitudes" hotkeys
   */
  onResetAmplitude?(): void;

  /**
   * Callback for when the {@link WaveformDisplay} component mounts
   */
  onMount?(weavessInstance: WeavessInstance): void;

  /**
   * Callback for when the {@link WaveformDisplay} component unmounts.
   * Use to clean up event listeners
   */
  onUnmount?(): void;

  /**
   * Canvas resize
   */
  onCanvasResize?(heightPx?: number): void;
}

/** Mouse Position */
export interface MousePosition {
  /** x value of mouse position */
  clientX: number;

  /** y value of mouse position */
  clientY: number;
}

/** Marker Configuration */
export interface Markers {
  /** Vertical markers */
  verticalMarkers?: Marker[];

  /** Moveable markers */
  moveableMarkers?: Marker[];

  /** Selection windows */
  selectionWindows?: SelectionWindow[];
}

/** Marker Configuration */
export interface Marker {
  /** The id of the marker */
  id: string;

  /** The style */
  color: string;

  /** Style of line */
  lineStyle: LineStyle;

  /** Epoch time in seconds */
  timeSecs: number;

  /** The min time (in seconds) constraint on the marker */
  minTimeSecsConstraint?: number;

  /** The max time (in seconds) constraint on the marker */
  maxTimeSecsConstraint?: number;
}

/** Selection Window Configuration */
export interface SelectionWindow {
  /** The id of the selection */
  id: string;

  /** Start marker for selection window */
  startMarker: Marker;

  /** End marker for selection window */
  endMarker: Marker;

  /** Indicates if the selection is moveable */
  isMoveable: boolean;

  /** Color */
  color: string;

  /**
   * Minimum amount of time in seconds between this and a possible corresponding marker
   * (e.g.- start and end marker for selection windows) and callback to trigger when reached
   */
  minimumSelectionWindowDuration?: { durationInSeconds: number; onDurationReached: () => void };
}
