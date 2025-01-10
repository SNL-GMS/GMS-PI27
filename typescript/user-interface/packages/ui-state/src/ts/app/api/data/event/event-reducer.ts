import type { EventTypes } from '@gms/common-model';
import type { ActionReducerMapBuilder, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { DataState } from '../types';
import {
  associateSignalDetectionsToEvent,
  associateSignalDetectionToEventReducer
} from './associate-sds-to-event';
import {
  createEventFromSignalDetections,
  createEventFromSignalDetectionsReducer
} from './create-event-from-sds';
import { createVirtualEvent, createVirtualEventReducer } from './create-virtual-event';
import { deleteEvents, deleteEventsReducer } from './delete-events';
import { duplicateEvents, duplicateEventsReducer } from './duplicate-events';
import { eventAssociationConflict, eventAssociationConflictReducer } from './event-conflict';
import { rejectEvents, rejectEventsReducer } from './reject-events';
import {
  unassociateSignalDetectionsToEvent,
  unassociateSignalDetectionToEventReducer
} from './unassociate-sds-to-event';

/**
 * The add events action.
 */
export const addEvents = createAction<EventTypes.Event[], 'data/addEvents'>('data/addEvents');

/**
 * The update event action.
 */
export const updateEvent = createAction<EventTypes.Event, 'data/updateEvent'>('data/updateEvent');

/**
 * The clear events and history action.
 */
export const clearEventsAndHistory = createAction<undefined, 'data/clearEventsAndHistory'>(
  'data/clearEventsAndHistory'
);

/**
 * Add events to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addEventsReducer: CaseReducer<DataState, ReturnType<typeof addEvents>> = (
  state,
  action
) => {
  action.payload.forEach(event => {
    state.events[event.id] = event;
  });
};

/**
 * Add events to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const updateEventReducer: CaseReducer<DataState, ReturnType<typeof updateEvent>> = (
  state,
  action
) => {
  state.events[action.payload.id] = action.payload;
};

/**
 *  Clears the events and event request history from the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const clearEventsAndHistoryReducer: CaseReducer<
  DataState,
  ReturnType<typeof clearEventsAndHistory>
> = state => {
  state.queries.getEventsWithDetectionsAndSegmentsByTime = {};
  state.events = {};
};

/**
 * Injects the event reducers to the provided builder.
 *
 * @param builder the action reducer map builder
 */
export const addEventReducers = (builder: ActionReducerMapBuilder<DataState>): void => {
  builder
    .addCase(addEvents, addEventsReducer)
    .addCase(updateEvent, updateEventReducer)
    .addCase(clearEventsAndHistory, clearEventsAndHistoryReducer)
    .addCase(associateSignalDetectionsToEvent, associateSignalDetectionToEventReducer)
    .addCase(unassociateSignalDetectionsToEvent, unassociateSignalDetectionToEventReducer)
    .addCase(duplicateEvents, duplicateEventsReducer)
    .addCase(rejectEvents, rejectEventsReducer)
    .addCase(deleteEvents, deleteEventsReducer)
    .addCase(eventAssociationConflict, eventAssociationConflictReducer)
    .addCase(createEventFromSignalDetections, createEventFromSignalDetectionsReducer)
    .addCase(createVirtualEvent, createVirtualEventReducer);
};
