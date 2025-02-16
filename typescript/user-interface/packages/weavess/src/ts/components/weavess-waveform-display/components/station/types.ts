import type { WeavessTypes } from '@gms/weavess-core';

import type { PositionConverters } from '../../../../util/types';
import type { AnimationFrameOptions, updateMeasureWindow } from '../../types';

export interface CommonStationProps {
  /** waveform interval loaded and available to display */
  displayInterval: WeavessTypes.TimeRange;

  /** viewable time interval, the amount of data initially loaded into weavess (excluding offsets) */
  viewableInterval: WeavessTypes.TimeRange;

  /** The ratio of the zoom interval divided by the total viewable interval. Unitless. */
  getZoomRatio: () => number;

  /** A set of converter functions that convert between screen units and time units */
  converters: PositionConverters;

  /** Issues a re-render to re-paint the canvas */
  renderWaveforms(options: AnimationFrameOptions): void;

  /**
   * Mouse move event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param xPct percentage location x of mouse as a number
   * @param timeSecs the time in seconds
   */
  onMouseMove(e: React.MouseEvent<HTMLDivElement>, xPct: number, timeSecs: number): void;

  /**
   * Mouse down event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param xPct percentage location x of mouse as a number
   * @param channel the channel that was clicked
   * @param timeSecs epoch seconds of mouse down
   * @param isDefaultChannel boolean
   */
  onMouseDown(
    e: React.MouseEvent<HTMLDivElement>,
    xPct: number,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isDefaultChannel: boolean,
    isMeasureWindow: boolean
  ): void;

  /**
   * Mouse up event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param xPct percentage location x of mouse as a number
   * @param channel the channel that was clicked
   * @param timeSecs timeSecs epoch seconds of mouse down
   * @param isDefaultChannel boolean
   */
  onMouseUp(
    e: React.MouseEvent<HTMLDivElement>,
    xPct: number,
    channel: WeavessTypes.Channel,
    timeSecs: number,
    isDefaultChannel: boolean,
    isMeasureWindow?: boolean,
    isDragged?: boolean
  ): void;

  /* Is this part of the Measure Window */
  isMeasureWindow: boolean;

  /** Amplitude scale factor to apply to measure window's waveform renderer */
  msrWindowWaveformAmplitudeScaleFactor?: number;

  /**
   * (optional) context menu creation
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId channelId channel Id as a string
   * @param sdId station id as a string
   * @param timeSecs the time of the x position that was clicked
   */
  onContextMenu?(
    e: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    timeSecs?: number,
    sdId?: string
  ): void;

  /**
   * (optional) Updates the measure window
   */
  updateMeasureWindow?: updateMeasureWindow;

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
    channelSegment?: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange
  ): Promise<WeavessTypes.ChannelSegmentBoundaries | undefined>;
}

export interface StationProps extends CommonStationProps {
  /** Configuration for weavess */
  initialConfiguration: WeavessTypes.Configuration;

  /** Station configuration (holds the data) */
  station: WeavessTypes.Station;

  /** callback executed when closing expanded mode */
  closeSplitChannelOverlayCallback?: () => void;

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;

  /** (optional) callbacks for events EX on station click */
  events?: WeavessTypes.StationEvents;

  /** Defines a custom component for displaying a custom label */
  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** the min boundary (x value) in gl units */
  glMin: number;

  /** the max boundary (x value) in gl units */
  glMax: number;

  /** true if qc masks are present */
  hasQcMasks?: boolean;

  /** true if station's channels are targeted for qc mask creation */
  isMaskTarget?: boolean;

  splitModePickMarkerColor?: string;

  /** A flag to determine if we are in the split channel mode */
  isSplitChannelOverlayOpen: boolean;

  /** A flag to determine if we are the split station */
  isSplitStation?: boolean;

  activeSplitModeType?: WeavessTypes.SplitMode;

  // callbacks
  /** Ref to the html canvas element */
  canvasRef(): HTMLCanvasElement | null;

  /** Gets the bounding rectangle for the canvas */
  getCanvasBoundingRect(): DOMRect;

  /**
   * checks to see if the given time is inside of the zoom interval
   * (ie, within the time range displayed on the screen)
   */
  isWithinTimeRange(timeRangeToCheck: WeavessTypes.TimeRange): boolean;
}
