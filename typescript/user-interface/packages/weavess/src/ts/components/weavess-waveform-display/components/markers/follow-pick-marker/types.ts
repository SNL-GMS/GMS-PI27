import type { WeavessTypes } from '@gms/weavess-core';

export interface FollowPickMarkerProps {
  /** waveform interval loaded and available to display */
  displayInterval: WeavessTypes.TimeRange;

  /** how much to offset the channel when event is open */
  offsetSecs: number;

  /** Actual physical css position as a percentage 0-100 */
  position: number;

  /** Label as a string */
  label: string;

  /** Color of the pick as a string */
  color: string;

  /** Pixel Width of the parent element */
  parentWidthPx?: number;

  /**
   * A filter provided for the pick marker
   *
   * style.filter = "none | blur() | brightness() | contrast() | drop-shadow() |
   *                 grayscale() | hue-rotate() | invert() | opacity() | saturate() | sepia()"
   */
  filter?: string;

  /**
   * Returns the time in seconds for the given clientX.
   *
   * @param clientX The clientX
   *
   * @returns The time in seconds; undefined if clientX is
   * out of the channel's bounds on screen.
   */
  getTimeSecsForClientX(clientX: number | undefined | null): number;
}
