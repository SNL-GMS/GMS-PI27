import type { WorkflowTypes } from '@gms/common-model';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { DataState } from '../types';
import { RejectOrDeleteAction, rejectOrDeleteEvent } from './utils';

export const deleteEventsAction = 'data/deleteEvents' as const;

/**
 * The action for deleting an event.
 */
export const deleteEvents = createAction<
  {
    /** IDs of events to be deleted */
    eventIds: string[];
    /** StageID for the currently open interval */
    stageId?: WorkflowTypes.IntervalId;
    /** Active user */
    username: string;
    /** eg; AL1, AL2, Auto Network */
    openIntervalName: string;
  },
  typeof deleteEventsAction
>(deleteEventsAction);

/**
 * Returns true if the action is of type {@link rejectEvents}.
 */
export const isDeleteEventsAction = (
  action: AnyAction
): action is ReturnType<typeof deleteEvents> => action.type === deleteEventsAction;

/**
 * Deletes the provided {@link EventTypes.Event}(s).
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const deleteEventsReducer: CaseReducer<DataState, ReturnType<typeof deleteEvents>> = (
  state,
  action
) => {
  const { eventIds, stageId, username, openIntervalName } = action.payload;
  if (!openIntervalName || !stageId) return;

  rejectOrDeleteEvent(
    state,
    eventIds,
    stageId,
    username,
    openIntervalName,
    RejectOrDeleteAction.DELETE
  );
};
