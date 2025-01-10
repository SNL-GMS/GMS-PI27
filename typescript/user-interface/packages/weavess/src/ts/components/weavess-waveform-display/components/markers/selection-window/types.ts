import type { WeavessTypes } from '@gms/weavess-core';

export interface SelectionWindowProps {
  /** Selection window props as a StationWindowConfig */
  selectionWindow: WeavessTypes.SelectionWindow;

  /** Label Width in pixels */
  labelWidthPx: number;

  /** Start and end of the entire time range */
  timeRange(): WeavessTypes.TimeRange;

  /** The ratio of the zoom interval divided by the total viewable interval. Unitless. */
  getZoomRatio: () => number;

  /** Ref to the html canvas element */
  canvasRef(): HTMLCanvasElement | null;

  /** Returns container client width  */
  containerClientWidth(): number;

  /** Returns the viewPort client width */
  viewportClientWidth(): number;

  /**
   * Minimum amount of time in seconds between this and a possible corresponding marker
   * (e.g.- start and end marker for selection windows) and callback to trigger when reached
   */
  minimumSelectionWindowDuration?: { durationInSeconds: number; onDurationReached: () => void };

  /**
   * Computes the time in seconds for the mouse x position.
   *
   * @param mouseXPosition the mouse x position to compute the time on
   *
   * @returns The computed time in seconds
   */
  computeTimeSecsForMouseXPosition(mouseXPosition: number): number;

  /**
   * (optional) Event handler for invoked while the selection is moving
   *
   * @param selection the selection
   */
  onMoveSelectionWindow?(selection: WeavessTypes.SelectionWindow): void;

  /**
   * (optional) updates the location of the marker
   *
   * @param selection the selection
   */
  onUpdateSelectionWindow?(selection: WeavessTypes.SelectionWindow): void;

  /**
   * (optional) Event handler for click events within a selection
   *
   * @param selection the selection
   * @param timeSecs epoch seconds of where drag ended in respect to the data
   */
  onClickSelectionWindow?(selection: WeavessTypes.SelectionWindow, timeSecs: number): void;

  /**
   * Mouse Move event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onMouseMove(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * Mouse down event
   *
   * @param e React.MouseEvent<HTMLDivElement>
   */
  onMouseDown(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * Mouse up event
   *
   * @param e React.MouseEvent<HTMLDivElement>
   */
  onMouseUp(e: React.MouseEvent<HTMLDivElement>): void;
}

export interface SelectionWindowState {
  selectionWindow: WeavessTypes.SelectionWindow;
}

export enum SelectionWindowBoundaryMarkerType {
  LEAD,
  LAG
}

export interface SelectionWindowBoundaryMarkerProps {
  // /** type of marker to determine which side of the selection window we are dragging */
  boundaryType: SelectionWindowBoundaryMarkerType;

  /** epoch time in seconds */
  timeSecs: number;

  /** react key but called name since key was causing fortify issues */
  name?: string;

  /** Start and end of the entire time range */
  timeRange(): WeavessTypes.TimeRange;

  /**
   * (optional) updates the location of the marker
   *
   * @param marker the marker
   */
  onMarkerUpdated(boundaryType: SelectionWindowBoundaryMarkerType, timeSecs: number): void;

  /**
   * gets the time from the mouse position
   * @param clientX
   */
  getTimeSecsForClientX(clientX: number): number | undefined;

  /**
   * sets the updating property
   * @param isUpdating
   */
  setIsUpdating(isUpdating: boolean): void;
}

export interface SelectionWindowBoundaryMarkerState {
  marker: WeavessTypes.Marker;
}
