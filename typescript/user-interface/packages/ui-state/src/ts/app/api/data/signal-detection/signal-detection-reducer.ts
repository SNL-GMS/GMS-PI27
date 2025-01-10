import type { SignalDetectionTypes } from '@gms/common-model';
import type { ActionReducerMapBuilder, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { DataState } from '../types';
import { acceptFk, acceptFkReducer } from './accept-fk-reducer';
import { revertFk, revertFkReducer } from './revert-fk-reducer';
import {
  createSignalDetection,
  createSignalDetectionAndAssociate,
  createSignalDetectionAndAssociateReducer,
  createSignalDetectionReducer,
  deleteSignalDetection,
  deleteSignalDetectionReducer,
  updateArrivalTimeSignalDetection,
  updateArrivalTimeSignalDetectionReducer,
  updatePhaseSignalDetection,
  updatePhaseSignalDetectionReducer
} from './update-signal-detection-reducers';

/**
 * The add signal detection action.
 */
export const addSignalDetections = createAction<
  SignalDetectionTypes.SignalDetection[],
  'data/addSignalDetections'
>('data/addSignalDetections');

/**
 * The clear signal detections and signal detection request history from the state action.
 */
export const clearSignalDetectionsAndHistory = createAction<
  undefined,
  'data/clearSignalDetectionsAndHistory'
>('data/clearSignalDetectionsAndHistory');

/**
 * Add signal detections to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addSignalDetectionReducer: CaseReducer<
  DataState,
  ReturnType<typeof addSignalDetections>
> = (state, action) => {
  action.payload.forEach(sd => {
    state.signalDetections[sd.id] = sd;
  });
};

/**
 *  Clears the signal detections and signal detection request history from the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const clearSignalDetectionsAndHistoryReducer: CaseReducer<
  DataState,
  ReturnType<typeof clearSignalDetectionsAndHistory>
> = state => {
  state.queries.getSignalDetectionWithSegmentsByStationAndTime = {};
  state.signalDetections = {};
};

/**
 * Injects the signal detection reducers to the provided builder.
 *
 * @param builder the action reducer map builder
 */
export const addSignalDetectionReducers = (builder: ActionReducerMapBuilder<DataState>): void => {
  builder
    .addCase(addSignalDetections, addSignalDetectionReducer)
    .addCase(clearSignalDetectionsAndHistory, clearSignalDetectionsAndHistoryReducer)
    .addCase(updateArrivalTimeSignalDetection, updateArrivalTimeSignalDetectionReducer)
    .addCase(updatePhaseSignalDetection, updatePhaseSignalDetectionReducer)
    .addCase(deleteSignalDetection, deleteSignalDetectionReducer)
    .addCase(createSignalDetection, createSignalDetectionReducer)
    .addCase(createSignalDetectionAndAssociate, createSignalDetectionAndAssociateReducer)
    .addCase(acceptFk, acceptFkReducer)
    .addCase(revertFk, revertFkReducer);
};
