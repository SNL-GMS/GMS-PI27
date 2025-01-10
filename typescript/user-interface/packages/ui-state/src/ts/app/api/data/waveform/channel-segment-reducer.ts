import type { WaveformTypes, WorkflowTypes } from '@gms/common-model';
import { epochSecondsNow } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type { ActionReducerMapBuilder, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { Action } from 'reduce-reducers';

import type { UiChannelSegment } from '../../../../types';
import { clearWaveforms } from '../../../../workers/api/clear-waveforms';
import type { AddBeamsAndChannelsResult } from '../../../util';
import type { DataState } from '../types';
import { addEventBeamsAndChannelsMutation } from './add-event-beams-and-channels';
import { addFkBeamsAndChannelsMutation } from './add-fk-beams-and-channels';
import { mutateUiChannelSegmentsRecord } from './mutate-channel-segment-record';

const logger = UILogger.create('GMS_DATA_SLICE', process.env.GMS_DATA_SLICE);

const addEventBeamsAndChannelsAction = 'data/addEventBeamsAndChannels' as const;

/**
 * The action to add {@link UiChannelSegment}s.
 */
export const addChannelSegments = createAction<
  {
    name: string;
    channelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
  }[],
  'data/addChannelSegments'
>('data/addChannelSegments');

/**
 * The action to add filtered {@link UiChannelSegment}s.
 */
export const addFilteredChannelSegments = createAction<
  {
    name: string;
    filterName: string;
    channelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
  }[],
  'data/addFilteredChannelSegments'
>('data/addFilteredChannelSegments');

export interface AddEventBeamsAndChannelsPayload {
  readonly username: string;
  readonly openIntervalName: string;
  readonly stageId: WorkflowTypes.IntervalId;
  readonly eventId: string;
  readonly eventHypothesisId: string;
  readonly phase: string;
  readonly results: AddBeamsAndChannelsResult[];
}

/**
 * The action to add event-beamed {@link UiChannelSegment}s.
 */
export const addEventBeamsAndChannels = createAction<
  AddEventBeamsAndChannelsPayload,
  typeof addEventBeamsAndChannelsAction
>(addEventBeamsAndChannelsAction);

/**
 * The action to add fk-beamed {@link UiChannelSegment}s.
 */
export const addFkBeamsAndChannels = createAction<
  {
    signalDetectionId: string;
    results: AddBeamsAndChannelsResult[];
  },
  'data/addFkBeamsAndChannels'
>('data/addFkBeamsAndChannels');

/**
 * Returns true if the action is of type {@link addEventBeamsAndChannels}.
 */
export const isAddEventBeamsAndChannels = (
  action: Action
): action is ReturnType<typeof addEventBeamsAndChannels> =>
  action.type === addEventBeamsAndChannelsAction;

/**
 * The action to clear the channel segments and channel segment request history from the state
 */
export const clearChannelSegmentsAndHistory = createAction<
  undefined,
  'data/clearChannelSegmentsAndHistory'
>('data/clearChannelSegmentsAndHistory');

/**
 * Add {@link UiChannelSegment}s to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addChannelSegmentsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addChannelSegments>
> = (state, action) => {
  action.payload.forEach(entry => {
    mutateUiChannelSegmentsRecord(state.uiChannelSegments, entry.name, entry.channelSegments);
  });
};

/**
 * Add filtered {@link UiChannelSegment}s to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addFilteredChannelSegmentsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addFilteredChannelSegments>
> = (state, action) => {
  action.payload.forEach(entry => {
    mutateUiChannelSegmentsRecord(
      state.uiChannelSegments,
      entry.name,
      entry.channelSegments,
      entry.filterName
    );
  });
};

/**
 * Add event-beamed {@link UiChannelSegment}s to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addEventBeamsAndChannelsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addEventBeamsAndChannels>
> = (state, action) => {
  const { username, openIntervalName, stageId, eventId, eventHypothesisId, results } =
    action.payload;

  if (results.length > 0) {
    addEventBeamsAndChannelsMutation(
      state,
      username,
      openIntervalName,
      stageId,
      eventId,
      eventHypothesisId,
      results
    );

    // flag the event as having changes
    state.events[eventId]._uiHasUnsavedChanges = epochSecondsNow();
  }
};

/**
 * Add fk-beamed {@link UiChannelSegment}s to the state
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addFkBeamsAndChannelsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addFkBeamsAndChannels>
> = (state, action) => {
  const { signalDetectionId, results } = action.payload;

  addFkBeamsAndChannelsMutation(state, signalDetectionId, results);
};

/**
 * Clears the channel segments and channel segment request history from the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const clearChannelSegmentsAndHistoryReducer: CaseReducer<
  DataState,
  ReturnType<typeof clearChannelSegmentsAndHistory>
> = state => {
  state.queries.getChannelSegmentsByChannel = {};
  state.uiChannelSegments = {};
  clearWaveforms().catch(e => {
    logger.error(`Failed to clear out waveform cache`, e);
  });
};

/**
 * Injects the channel segment reducers to the provided builder.
 *
 * @param builder the action reducer map builder
 */
export const addChannelSegmentReducers = (builder: ActionReducerMapBuilder<DataState>): void => {
  builder
    .addCase(addChannelSegments, addChannelSegmentsReducer)
    .addCase(addFilteredChannelSegments, addFilteredChannelSegmentsReducer)
    .addCase(clearChannelSegmentsAndHistory, clearChannelSegmentsAndHistoryReducer)
    .addCase(addEventBeamsAndChannels, addEventBeamsAndChannelsReducer)
    .addCase(addFkBeamsAndChannels, addFkBeamsAndChannelsReducer);
};
