import type { EventTypes } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { UILogger } from '@gms/ui-util';
import type { WritableDraft } from 'immer/dist/internal';

const logger = UILogger.create('GMS_EVENT', process.env.GMS_EVENT);

/**
 * Returns true if there is a working event hypothesis for the provided event, false otherwise.
 *
 * @param event the event to check if it has a working hypothesis.
 * @returns true if the event has a working hypothesis; false otherwise.
 */
export const hasWorkingEventHypothesis = (event: WritableDraft<EventTypes.Event>): boolean => {
  return event._uiHasUnsavedChanges !== undefined;
};

/**
 * Returns the working event hypothesis for the provided event.
 *
 * !throws an exception if the event does not have a working hypothesis
 *
 * @param openIntervalName the open interval name
 * @param event the event to retrieve its working event hypothesis
 * @returns the working hypothesis
 */
export const getWorkingEventHypothesis = (
  openIntervalName: string,
  event: WritableDraft<EventTypes.Event>
): WritableDraft<EventTypes.EventHypothesis> => {
  const preferredEventHypothesisByStage = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    event,
    openIntervalName
  );

  if (!hasWorkingEventHypothesis(event) || !preferredEventHypothesisByStage) {
    logger.error(`Failed to get working event hypothesis`, event, openIntervalName);
    throw new Error(`Failed to get working event hypothesis: ${event.id}`);
  }

  return preferredEventHypothesisByStage as WritableDraft<EventTypes.EventHypothesis>;
};
