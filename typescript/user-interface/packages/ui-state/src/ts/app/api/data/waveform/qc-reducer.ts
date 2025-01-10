import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type { ActionReducerMapBuilder, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import produce from 'immer';

import type { DataState } from '../types';

/**
 * The modify {@link QcSegment} action.
 */
export const updateQcSegment = createAction<QcSegment, 'data/updateQcSegment'>(
  'data/updateQcSegment'
);

/**
 * The create {@link QcSegment} action.
 */
export const createQcSegment = createAction<
  {
    qcSegment: QcSegment;
  },
  'data/createQcSegment'
>('data/createQcSegment');

/**
 * Updates a {@link QcSegment} in the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const updateQcSegmentReducer: CaseReducer<DataState, ReturnType<typeof updateQcSegment>> = (
  state,
  action
) => {
  state.qcSegments[action.payload.channel.name][action.payload.id] = action.payload;
};

/**
 * Create a new {@link QcSegment} in the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const createQcSegmentReducer: CaseReducer<DataState, ReturnType<typeof createQcSegment>> = (
  state,
  action
) => {
  state.qcSegments = produce(state.qcSegments, draft => {
    const { qcSegment } = action.payload;
    if (!draft[qcSegment.channel.name]) {
      draft[qcSegment.channel.name] = {};
      draft[qcSegment.channel.name][qcSegment.id] = qcSegment;
    } else {
      draft[qcSegment.channel.name][qcSegment.id] = qcSegment;
    }
  });
};

/**
 * Injects the quality control reducers to the provided builder.
 *
 * @param builder the action reducer map builder
 */
export const addQcReducers = (builder: ActionReducerMapBuilder<DataState>): void => {
  builder.addCase(createQcSegment, createQcSegmentReducer);
  builder.addCase(updateQcSegment, updateQcSegmentReducer);
};
