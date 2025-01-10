import type { WeavessTypes } from '@gms/weavess-core';

export interface PickMarkerProps {
  /** unique id */
  id: string;

  /** Channel Id as a string */
  channelId: string;

  /** Epoch seconds start time */
  startTimeSecs: number;

  /** Epoch seconds end time */
  endTimeSecs: number;

  /** viewable interval */
  viewableInterval: WeavessTypes.TimeRange;

  /** how much to offset the channel when event is open */
  offsetSecs: number;

  /** Actual physical css position as a percentage 0-100 */
  position: number;

  /** Label as a string */
  label: string;

  /** Color of the pick as a string */
  color: string;

  /**
   * A filter provided for the pick marker
   *
   * style.filter = "none | blur() | brightness() | contrast() | drop-shadow() |
   *                 grayscale() | hue-rotate() | invert() | opacity() | saturate() | sepia()"
   */
  filter?: string;

  /** Epoch Time the pick is located */
  timeSecs: number;

  /** Optional isPredicted */
  predicted: boolean;

  /** Is this pick in conflict */
  isConflicted: boolean;

  /** Indicates if the pick marker is selected */
  isSelected: boolean;

  /** Indicates if the pick marker is selectable i.e. PredictedPhases are not */
  isSelectable: boolean;

  /** Indicates that the pick marker is the target of an action. It will get a different style to show this. */
  isActionTarget: boolean;

  /** Indicates that the pick marker is draggable/movable */
  isDraggable: boolean;

  /** Adds the uncertainty markers to pick marker */
  children?: React.ReactNode[];

  /** Is this pick disabled for some other reason */
  isDisabled?: boolean;

  /**
   * Time seconds for client x
   *
   * @param clientX x position as a number
   * @returns ClientX as a number
   */
  getTimeSecsForClientX(clientX: number): number;

  /**
   * Returns clientX position in pixel space
   *
   * @param timeSecs in epoch seconds
   * @returns clientX position
   */
  getClientXForTimeSecs(timeSecs: number): number;

  /**
   * Drag indicator
   *
   * @param show boolean determines to show or not
   * @param color color of indicator as a string
   */
  toggleDragIndicator(show: boolean, color: string): void;

  /**
   * Position of drag indicator
   *
   * @param clientX client x position
   */
  positionDragIndicator(clientX: number): void;

  /**
   * Click event
   *
   * @param e mouse event as a React.MouseEvent<HTMLDivElement>
   * @param id unique id as a string of the pick
   */
  onClick?(e: React.MouseEvent<HTMLDivElement>, id: string): void;

  /**
   * Double click event
   *
   * @param e mouse event as a React.MouseEvent<HTMLDivElement>
   * @param id unique id as a string of the pick
   */
  onDoubleClick?(e: React.MouseEvent<HTMLDivElement>, id: string): void;

  /**
   * Creates context menu
   *
   * @param e mouse event as a React.MouseEvent<HTMLDivElement>
   * @param channelId channel id as a string
   * @param id unique id as a string of the pick
   */
  onContextMenu?(e: React.MouseEvent<HTMLDivElement>, channelId: string, id: string): void;

  /**
   * Sets pick marker time
   *
   * @param timeSecs epoch seconds of drag end
   */
  setPickerMarkerTime?(timeSecs: number): void;
}

export interface PickMarkerState {
  position: number;
}
