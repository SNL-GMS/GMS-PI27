import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { ActionReducerMapBuilder, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { MaskAndRotate2dResult } from '../../../../types';
import type { SDHypothesisArgs } from '../../../util';
import { batchPublishDerivedChannelsCreatedEvents } from '../../../util/channel-factory';
import type { DataState } from '../types';
import { saveRotationResultsAndUpdateSignalDetections } from '../waveform/save-rotation-results-and-update-signal-detections';

/**
 * The add raw channels action.
 */
export const addRawChannels = createAction<Channel[], 'data/addRawChannels'>('data/addRawChannels');

/**
 * The add derived channels action.
 */
export const addBeamedChannels = createAction<Channel[], 'data/addBeamedChannels'>(
  'data/addBeamedChannels'
);

/**
 * The action used to store and mutate channel rotation results
 * rotationResults: newly rotated channels
 * config: contains values from analyst configuration necessary for processing rotation results
 * newSDHypothesisArgs: used to create new SD Hypothesis when updating signal detections to reference newly rotated channels/channel segments
 */
export const addRotatedChannelsAndChannelSegments = createAction<
  {
    rotationResults: MaskAndRotate2dResult[];
    config: {
      rotationReplacementAzimuthToleranceDeg: number;
    };
    newSDHypothesisArgs: SDHypothesisArgs;
  },
  'data/addRotatedChannelsAndChannelSegments'
>('data/addRotatedChannelsAndChannelSegments');

/**
 * The add filtered channels action.
 */
export const addFilteredChannels = createAction<Channel[], 'data/addFilteredChannels'>(
  'data/addFilteredChannels'
);

/**
 * Adds raw channels to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addRawChannelsReducer: CaseReducer<DataState, ReturnType<typeof addRawChannels>> = (
  state,
  action
) => {
  action.payload.forEach(channel => {
    state.channels.raw[channel.name] = channel;
  });
};

/**
 * Adds derived channels to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addDerivedChannelsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addBeamedChannels>
> = (state, action) => {
  action.payload.forEach(channel => {
    state.channels.beamed[channel.name] = channel;
  });
};

/**
 * Adds filtered channels to the state.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addFilteredChannelsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addFilteredChannels>
> = (state, action) => {
  action.payload.forEach(channel => {
    state.channels.filtered[channel.name] = channel;
  });

  batchPublishDerivedChannelsCreatedEvents(action.payload);
};

/**
 * Adds rotated Channels and Channel Segments to the state
 * Replaces previously rotated versions of the same Channels and Channel Segments,
 * and updates Signal Detection Hypothesis to reference the new versions
 *
 * @param state current state of the redux slice
 * @param action the action being invoked
 */
export const addRotatedChannelsAndChannelSegmentsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addRotatedChannelsAndChannelSegments>
> = (state, action) => {
  const { rotationResults, config, newSDHypothesisArgs } = action.payload;
  if (config == null || config.rotationReplacementAzimuthToleranceDeg == null) {
    throw new Error(
      'Cannot rotate. Processing configuration does not have the a rotation.rotationReplacementAzimuthToleranceDeg value.'
    );
  }
  saveRotationResultsAndUpdateSignalDetections(state, rotationResults, config, newSDHypothesisArgs);
};

/**
 * Injects the channel reducers to the provided builder.
 *
 * @param builder the action reducer map builder
 */
export const addChannelReducers = (builder: ActionReducerMapBuilder<DataState>): void => {
  builder
    .addCase(addRawChannels, addRawChannelsReducer)
    .addCase(addBeamedChannels, addDerivedChannelsReducer)
    .addCase(addFilteredChannels, addFilteredChannelsReducer)
    .addCase(addRotatedChannelsAndChannelSegments, addRotatedChannelsAndChannelSegmentsReducer);
};
