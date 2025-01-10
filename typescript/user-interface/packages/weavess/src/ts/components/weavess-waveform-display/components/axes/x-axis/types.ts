import type { WeavessTypes } from '@gms/weavess-core';

export interface XAxisProps {
  /** waveform interval loaded and available to display */
  displayInterval: WeavessTypes.TimeRange;

  /** Add border to top */
  borderTop: boolean;

  /** Label width in px */
  labelWidthPx: number;

  /** Scrollbar width in px */
  scrollbarWidthPx: number;

  /** (optional) x-axis label  */
  label?: string;
}

export interface XAxisState {}
