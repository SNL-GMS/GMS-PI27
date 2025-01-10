import type { WeavessTypes } from '@gms/weavess-core';

export interface PredictedPhasesProps {
  /** Station Id as string */
  stationId: string;

  /** Channel Id as string */
  channelId: string;

  /** The predicted phases */
  predictedPhases: WeavessTypes.PickMarker[] | undefined;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** waveform interval loaded and available to display */
  displayInterval: WeavessTypes.TimeRange;

  /** viewable interval */
  viewableInterval: WeavessTypes.TimeRange;

  /** how much to offset the channel when event is open */
  offsetSecs: number;

  /** (optional) callback events */
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
   * Returns clientX position for a given time in epoch seconds.
   *
   * @param clientX The clientX
   * @returns clientX position
   */
  getClientXForTimeSecs(timeSecs: number): number;

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

export interface PredictedPhasesState {}
