import type { WeavessTypes } from '@gms/weavess-core';

export interface EmptyRendererProps {
  /** waveform interval loaded and available to display */
  displayInterval: WeavessTypes.TimeRange;
}

export interface EmptyRendererState {}
