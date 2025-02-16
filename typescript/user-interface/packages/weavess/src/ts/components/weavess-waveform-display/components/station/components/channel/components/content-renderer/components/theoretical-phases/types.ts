import type { WeavessTypes } from '@gms/weavess-core';

export interface TheoreticalPhasesProps {
  /** Station Id as string */
  stationId: string;

  /** The theoretical phase windows */
  theoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** waveform interval loaded and available to display */
  displayInterval: WeavessTypes.TimeRange;

  /** (optional) callback events Ex on waveform click */
  events?: WeavessTypes.ChannelContentEvents;

  /**
   * Returns the time in seconds for the given clientX.
   *
   * @param clientX The clientX
   *
   * @returns The time in seconds; undefined if clientX is
   * out of the channel's bounds on screen.
   */
  getTimeSecsForClientX(clientX: number): number;

  /**
   * Toggle display of the drag indicator for this channel
   *
   * @param show True to show drag indicator
   * @param color The color of the drag indicator
   */
  toggleDragIndicator(show: boolean, color: string): void;

  /**
   * Set the position for the drag indicator
   *
   * @param clientX The clientX
   */
  positionDragIndicator(clientX: number): void;
}

export interface TheoreticalPhasesState {}
