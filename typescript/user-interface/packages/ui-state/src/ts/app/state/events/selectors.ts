import type { Event, EventHypothesis } from '@gms/common-model/lib/event';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { UILogger } from '@gms/ui-util';
import { createSelector } from '@reduxjs/toolkit';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';

import type { AssociationConflictRecord, EventsRecord } from '../../../types';
import {
  selectAssociationConflict,
  selectEvents,
  selectOpenEventId
} from '../../api/data/selectors';
import type { AppState } from '../../store';
import { selectOpenIntervalName } from '../workflow/selectors';
import type { EventsState } from './types';

const logger = UILogger.create('GMS_EVENTS_SELECTORS', process.env.GMS_EVENTS_SELECTORS);
/**
 * Uses the associationConflict record from state, to return the SD Ids in conflict
 */
export const selectEventAssociationConflictIds: (state: AppState) => string[] = createSelector(
  [selectAssociationConflict],
  (associationConflict: AssociationConflictRecord) =>
    uniq(
      flatMap(
        Object.values(associationConflict).map(conflict =>
          conflict.eventHypothesisIds.map(e => e.eventId)
        )
      )
    )
);

/**
 * Uses the events and open event id to return the currently open event
 * @returns Event object or undefined if not found
 */
export const selectOpenEvent: (state: AppState) => Event | undefined = createSelector(
  [selectEvents, selectOpenEventId],
  (events: EventsRecord, openEventId: string) => events[openEventId]
);

/**
 * uses the open event and open interval name to return the preferred
 * event hypothesis by stage for the currently open event
 */
// TODO: This should NOT return undefined; requires refactoring for other components
export const selectPreferredEventHypothesisByStageForOpenEvent: (
  state: AppState
) => EventHypothesis | undefined = createSelector(
  [selectOpenEvent, selectOpenIntervalName],
  (openEvent: Event | undefined, openIntervalName: string) => {
    const preferredHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      openEvent,
      openIntervalName
    );
    if (openIntervalName != null && openEvent != null && !preferredHypothesis) {
      logger.warn('Unable to find preferred event hypothesis by stage for open event');
    }
    return preferredHypothesis;
  }
);

/**
 * Redux selector for the events table columns to be displayed
 */
export const selectEventsColumnsToDisplay = (state: AppState): EventsState['eventsColumns'] =>
  state.app.events.eventsColumns;

/**
 * Redux selector for the events to be displayed
 */
export const selectDisplayedEventsConfiguration = (state: AppState) =>
  state.app.events.displayedEventsConfiguration;
