import type { WeavessTypes } from '@gms/weavess-core';
import type React from 'react';

import type { PositionConverters } from '../../../../../../../../util/types';
import type { AnimationFrameOptions, updateMeasureWindow } from '../../../../../../types';

export interface ContentRendererProps {
  /** Station Id as string */
  stationId: string;

  /** The description rendered in the bottom right corner of the ContentRenderer */
  description?: string | WeavessTypes.ChannelDescription;

  /** The description label color */
  descriptionLabelColor?: string;

  /** Channel Id as string */
  channelId: string;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** viewable interval plus its min/max offsets; full amount of data window */
  displayInterval: WeavessTypes.TimeRange;

  /** viewable interval */
  viewableInterval: WeavessTypes.TimeRange;

  /** how much to offset the channel when event is open */
  offsetSecs: number;

  /** The ratio of the zoom interval divided by the total viewable interval. Unitless. */
  getZoomRatio: () => number;

  /** The signal detections */
  signalDetections: WeavessTypes.PickMarker[] | undefined;

  /** The predicted phases */
  predictedPhases: WeavessTypes.PickMarker[] | undefined;

  /** The theoretical phase windows */
  theoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined;

  /** Collection of markers */
  markers?: WeavessTypes.Markers;

  /**
   * Whether the channel rendering this content renderer
   */
  isChannelSelected: boolean;

  /** Indicate if the channel is split is open */
  isSplitChannelOverlayOpen?: boolean;

  /** Indicate if the channel is being split */
  isSplitStation?: boolean;

  activeSplitModeType?: WeavessTypes.SplitMode;

  /** The phase of signal detection to be created by the split mode */
  splitChannelPhase?: string;

  /** (optional) callback events */
  events?: WeavessTypes.ChannelContentEvents;

  /** Configuration for weavess */
  initialConfiguration: WeavessTypes.Configuration;

  /** React elements to render in the content-renderer-content area */
  contentRenderers: React.ReactElement[];

  splitModePickMarkerColor?: string;

  // Functions

  converters: PositionConverters;

  /** Ref to the html canvas element */
  canvasRef(): HTMLCanvasElement | null;

  /** Issues a rerender of the graphics */
  renderWaveforms(options?: AnimationFrameOptions): void;

  /**
   * Mouse move event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onMouseMove(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * Mouse down event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onMouseDown(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * onMouseUp event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onMouseUp(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * onContextMenu event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onContextMenu(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * onKeyDown event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param timeForMouseXPosition the time for the current mouse position X
   */
  onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void;

  /**
   * (optional) Updates the measure window
   */
  updateMeasureWindow?: updateMeasureWindow;
}

export interface ContentRendererState {
  /** Tracking based on mouse focus and selection  */
  backgroundColor: string;
  /** Tracking mouse focus  */
  mouseFocus: boolean;
}
