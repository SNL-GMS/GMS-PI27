import type { Draft } from 'immer';

import type { AddBeamsAndChannelsResult } from '../../../util';
import type { DataState } from '../types';
import { mutateUiChannelSegmentsRecord } from './mutate-channel-segment-record';

/**
 * Removes previous beamed channel from beamed and filtered channels
 */
export function removedChannelsRecord(state: DataState, signalDetectionId: string): void {
  const signalDetection = state.signalDetections[signalDetectionId];
  if (!signalDetection._uiFkBeamChannelSegmentDescriptorId) return;

  const beamedChannelName = signalDetection._uiFkBeamChannelSegmentDescriptorId.channel.name;
  if (state.channels.beamed[beamedChannelName]) {
    delete state.channels.beamed[beamedChannelName];
  }

  Object.values(state.channels.filtered).forEach(channel => {
    const foundMatch = channel.configuredInputs.some(
      configuredInputChannel => configuredInputChannel.name === beamedChannelName
    );
    if (foundMatch) {
      delete state.channels.filtered[channel.name];
    }
  });
}

/**
 * Helper function for {@link addFkBeamsAndChannelsMutation}, removes existing channel segments for the same
 * signal detection, station and phase
 */
function removeOldChannelSegments(state: Draft<DataState>, signalDetectionId: string) {
  // Remove all the old beams
  if (state.uiChannelSegments[signalDetectionId]) {
    state.uiChannelSegments[signalDetectionId] = {};
  }
}

/**
 * Mutator to save fk beams, fk beam channels, and the filter results if applicable.
 * Cleans up any references to the old channels and removes them from state.
 * @param state Writable draft of the Data state
 * @param signalDetectionHypothesis Signal Detection Hypothesis that should be updated with the new information
 * @param results Collection of BeamsAndChannels to be added to state
 */
export function addFkBeamsAndChannelsMutation(
  state: Draft<DataState>,
  signalDetectionId: string,
  results: AddBeamsAndChannelsResult[]
) {
  removeOldChannelSegments(state, signalDetectionId);

  // Save the beamed channel segment
  results.forEach(result => {
    if (result.beamedChannelSegment) {
      // Remove current beamed channels from beamed and filtered channels
      removedChannelsRecord(state, signalDetectionId);

      state.signalDetections[signalDetectionId]._uiFkBeamChannelSegmentDescriptorId =
        result.beamedChannelSegment.channelSegment.id;

      state.channels.beamed[result.beamedChannel.name] = result.beamedChannel;
      mutateUiChannelSegmentsRecord(
        state.uiChannelSegments,
        signalDetectionId,
        [result.beamedChannelSegment],
        result.filterName
      );

      // Save the filtered channel segments
      if (result.filterName && result.filteredChannel && result.filteredChannelSegment) {
        mutateUiChannelSegmentsRecord(
          state.uiChannelSegments,
          signalDetectionId,
          [result.filteredChannelSegment],
          result.filterName
        );
      }
    }
  });
}
