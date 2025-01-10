import type { WorkflowTypes } from '@gms/common-model';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { DataState } from '../types';
import { RejectOrDeleteAction, rejectOrDeleteEvent } from './utils';

export const rejectEventsAction = 'data/rejectEvent' as const;

/**
 * The action for rejecting events
 */
export const rejectEvents = createAction<
  {
    /** IDs of events to be rejected */
    eventIds: string[];
    /** StageID for the currently open interval */
    stageId?: WorkflowTypes.IntervalId;
    /** Active user */
    username: string;
    /** eg; AL1, AL2, Auto Network */
    openIntervalName: string;
  },
  typeof rejectEventsAction
>(rejectEventsAction);

/**
 * Returns true if the action is of type {@link rejectEvents}.
 */
export const isRejectEventsAction = (
  action: AnyAction
): action is ReturnType<typeof rejectEvents> => action.type === rejectEventsAction;

/**
 * Rejects the provided {@link EventTypes.Event}(s).
 *
 * @param state the current redux state of the data slice
 * @param action the action being invoked
 */
export const rejectEventsReducer: CaseReducer<DataState, ReturnType<typeof rejectEvents>> = (
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
    RejectOrDeleteAction.REJECT
  );
};
