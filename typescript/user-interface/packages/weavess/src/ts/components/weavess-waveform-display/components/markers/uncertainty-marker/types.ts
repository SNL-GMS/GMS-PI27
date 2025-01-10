import type { WeavessTypes } from '@gms/weavess-core';

export interface UncertaintyMarkerProps {
  /** Pick marker epoch seconds */
  pickMarkerTimeSecs: number;

  /** Actual physical css position of the pick marker */
  pickMarkerPosition: number;

  /** Uncertainty seconds */
  uncertaintySecs: number;

  /** Epoch seconds start time */
  startTimeSecs: number;

  /** Epoch seconds end time */
  endTimeSecs: number;

  /** Color of the pick as a string */
  color: string;

  /** Is this uncertainty marker the left side or right side */
  isLeftUncertaintyBar: boolean;

  /** Configuration for weavess */
  initialConfiguration: WeavessTypes.Configuration;

  /** for disabling features in split mode */
  isSplitChannelOverlayOpen: boolean;

  /**
   * Time seconds for client x
   *
   * @param clientX x position as a number
   * @returns ClientX as a number
   */
  getTimeSecsForClientX(clientX: number): number | undefined;

  /**
   * Sets uncertainty seconds and flags to update when drag ends
   *
   * @param uncertaintySecs
   * @param dragEnded indicates update uncertainty
   */
  setUncertaintySecs(uncertaintySecs: number, dragEnded: boolean): void;

  /**
   * A setter for setting the isEditingTimeUncertainty state in the signal detection,
   * which should add a class to the element indicating it as in the process of being edited
   *
   * @param isEditing the value to which to set the state
   */
  setIsEditingTimeUncertainty(isEditing: boolean): void;
}
