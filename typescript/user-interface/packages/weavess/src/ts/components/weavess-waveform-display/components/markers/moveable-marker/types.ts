import type { WeavessTypes } from '@gms/weavess-core';

export interface MoveableMarkerProps {
  /** The marker config */
  marker: WeavessTypes.Marker;

  /** The associated start marker (usually only for a selection window) */
  associatedStartMarker?: WeavessTypes.Marker;

  /** The associated end marker (usually only for a selection window) */
  associatedEndMarker?: WeavessTypes.Marker;

  /** Percentage Location 0-100 as number */
  percentageLocation: number;

  /** Label Width in px */
  labelWidthPx: number;

  /** React key but called name since key was causing fortify issues */
  name?: string;

  /**
   * Minimum amount of time in seconds between this and a possible corresponding marker
   * (e.g.- start and end marker for selection windows) and callback to trigger when reached
   */
  minimumSelectionWindowDuration?: { durationInSeconds: number; onDurationReached: () => void };

  /** Start and end of the entire time range */
  timeRange(): WeavessTypes.TimeRange;

  /** The ratio that the waveform panel is zoomed in: the zoom interval divided
   * by the total viewable interval. This is a unitless value. */
  getZoomRatio(): number;

  /** Returns container client width */
  containerClientWidth(): number;

  /** Returns the viewPort client width */
  viewportClientWidth(): number;

  /**
   * (optional) updates the location of the marker
   *
   * @param marker the marker
   */
  onUpdateMarker?(marker: WeavessTypes.Marker): void;

  /**  */
  updateTimeWindowSelection?(): void;
}

export interface MoveableMarkerState {
  marker: WeavessTypes.Marker;
}
