import type { WorkflowTypes } from '@gms/common-model';
import { ChannelTypes, convertToVersionReference } from '@gms/common-model';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';
import type { SignalDetection } from '@gms/common-model/lib/signal-detection';
import { getCurrentHypothesis } from '@gms/common-model/lib/signal-detection/util';
import type { IntervalId } from '@gms/common-model/lib/workflow/types';
import type { Draft } from 'immer';

import type { AddBeamsAndChannelsResult } from '../../../util';
import { buildAnalysisWaveform } from '../../../util/util';
import { createWorkingHypothesisAndUpdateAssociations } from '../event/create-working-hypothesis';
import type { DataState } from '../types';
import { addOrUpdateEventBeams } from './add-or-update-beams';
import { mutateUiChannelSegmentsRecord } from './mutate-channel-segment-record';

/**
 * Builds a list of channels that should be replaced
 */
export function buildRemovedChannelsRecord(
  state: DataState,
  eventId: string,
  results: AddBeamsAndChannelsResult[]
): Record<string, AddBeamsAndChannelsResult> {
  const removedChannelsRecord: Record<string, AddBeamsAndChannelsResult> = {};

  const { eventHypotheses } = state.events[eventId];

  Object.values(state.channels.beamed).forEach(channel => {
    const newChannel = results.find(
      result =>
        channel.station.name === result.beamedChannel.station.name &&
        channel?.processingMetadata?.BEAM_TYPE === BeamType.EVENT &&
        channel.processingMetadata?.BEAM_PHASE ===
          result.beamedChannel.processingMetadata?.BEAM_PHASE &&
        eventHypotheses?.find(
          eh =>
            eh.id.hypothesisId ===
            result.beamedChannel.processingMetadata?.BEAM_EVENT_HYPOTHESIS_ID.hypothesisId
        )
    );

    if (newChannel !== undefined) removedChannelsRecord[channel.name] = newChannel;
  });

  // Get any channels derived from the removed channels
  Object.values(state.channels.beamed).forEach(channel => {
    channel.configuredInputs.forEach(configuredInputChannel => {
      if (removedChannelsRecord[configuredInputChannel.name] !== undefined) {
        removedChannelsRecord[channel.name] = removedChannelsRecord[configuredInputChannel.name];
      }
    });
  });

  Object.values(state.channels.filtered).forEach(channel => {
    channel.configuredInputs.forEach(configuredInputChannel => {
      if (removedChannelsRecord[configuredInputChannel.name] !== undefined) {
        removedChannelsRecord[channel.name] = removedChannelsRecord[configuredInputChannel.name];
      }
    });
  });

  // Get any derivatives of the removed channels
  Object.values(removedChannelsRecord).forEach(channelRecord => {
    channelRecord.beamedChannel.configuredInputs.forEach(configuredInputChannel => {
      if (ChannelTypes.Util.isDerivedChannelName(configuredInputChannel.name)) {
        removedChannelsRecord[configuredInputChannel.name] = channelRecord;
      }
    });
  });

  return removedChannelsRecord;
}

/**
 * Helper function that cleans up signal detection references
 */
function mutateSignalDetectionsForEventBeams(
  state: Draft<DataState>,
  removedChannelsRecord: Record<string, AddBeamsAndChannelsResult>,
  username: string,
  openIntervalName: string,
  stageId: IntervalId,
  eventId: string
) {
  const replacedChannelNames = Object.keys(removedChannelsRecord);

  // Build a list of SDs to update
  const sdsToUpdate: SignalDetection[] = [];

  Object.values(state.signalDetections).forEach(sd => {
    const currentSdHypothesis = getCurrentHypothesis(sd.signalDetectionHypotheses);
    if (
      currentSdHypothesis.featureMeasurements.findIndex(fm =>
        replacedChannelNames.includes(fm.channel.name)
      ) !== -1
    ) {
      sdsToUpdate.push(sd);
    }
  });

  if (sdsToUpdate.length === 0) return;

  // create new working hypothesis if needed
  createWorkingHypothesisAndUpdateAssociations(state, {
    username,
    openIntervalName,
    stageId,
    eventIds: [eventId],
    signalDetectionIds: sdsToUpdate.map(sd => sd.id)
  });

  // Update all SDs found
  sdsToUpdate.forEach(sd => {
    const draftSignalDetectionHypothesis =
      state.signalDetections[sd.id].signalDetectionHypotheses[
        state.signalDetections[sd.id].signalDetectionHypotheses.length - 1
      ];
    draftSignalDetectionHypothesis.featureMeasurements.forEach(fm => {
      const removedChannelRecord = removedChannelsRecord[fm.channel.name];
      // if the fm channel is not found in the removed channels dont update
      if (removedChannelRecord === undefined) return;
      const channel = removedChannelRecord.filteredChannel || removedChannelRecord.beamedChannel;
      const channelVersionReference = convertToVersionReference(channel, 'name');
      const analysisWaveform = buildAnalysisWaveform(
        channel,
        convertToVersionReference(removedChannelRecord.beamedChannel, 'name'),
        removedChannelRecord.beamedChannelSegment.channelSegmentDescriptor,
        fm.featureMeasurementType
      );
      const channelSegment =
        removedChannelRecord.filteredChannelSegment || removedChannelRecord.beamedChannelSegment;

      fm.channel = channelVersionReference;
      fm.measuredChannelSegment = { id: channelSegment.channelSegmentDescriptor };
      fm.analysisWaveform = analysisWaveform;
    });
  });
}

/**
 * Helper function that removes existing channel segments for the same event, station, and phase
 * @param state data state draft
 * @param eventId event id for the event used in beaming
 * @param removedChannelRecord Record containing a list of all channels that need to be removed
 */
function removeOldChannelSegments(
  state: Draft<DataState>,
  eventId: string,
  removedChannelRecord: Record<string, AddBeamsAndChannelsResult>
) {
  const { eventHypotheses } = state.events[eventId];

  eventHypotheses.forEach(hypo => {
    // filter the array to remove any beams that match phase, station, and event
    // Since the record is by hypothesis we only need to check the station and phase while looping over event hypothesis
    if (state.eventBeams[hypo.id.hypothesisId]) {
      state.eventBeams[hypo.id.hypothesisId] = state.eventBeams[hypo.id.hypothesisId].filter(
        eventBeam =>
          // only keep beams that are not on removed channels
          removedChannelRecord[eventBeam.channelSegmentDescriptor.channel.name] === undefined
      );
    }
  });

  Object.entries(removedChannelRecord).forEach(entry => {
    const [, newChannel] = entry;
    // delete any ui channel segments on the removed channels
    if (state.uiChannelSegments[newChannel.beamedChannel.station.name]) {
      Object.entries(state.uiChannelSegments[newChannel.beamedChannel.station.name]).forEach(
        csEntry => {
          const [filterName, channelSegmentArray] = csEntry;

          state.uiChannelSegments[newChannel.beamedChannel.station.name][filterName] =
            channelSegmentArray.filter(
              eventBeam =>
                // only keep beams that are not on removed channels
                removedChannelRecord[eventBeam.channelSegmentDescriptor.channel.name] === undefined
            );
        }
      );
    }
  });
}

/**
 * Mutator to save event beams, event beam channels, and the filter results if applicable.
 * Cleans up any references to the old channels and removes them from state
 * @param state
 * @param username
 * @param openIntervalName
 * @param stageId
 * @param eventId
 * @param eventHypothesisId
 * @param results
 */
export function addEventBeamsAndChannelsMutation(
  state: Draft<DataState>,
  username: string,
  openIntervalName: string,
  stageId: WorkflowTypes.IntervalId,
  eventId: string,
  eventHypothesisId: string,
  results: AddBeamsAndChannelsResult[]
) {
  const removedChannelsRecord: Record<string, AddBeamsAndChannelsResult> =
    buildRemovedChannelsRecord(state, eventId, results);

  const channelSegments = results.map(result => result.beamedChannelSegment);

  removeOldChannelSegments(state, eventId, removedChannelsRecord);

  // save channel segments
  addOrUpdateEventBeams(state.eventBeams, eventHypothesisId, channelSegments);

  // save filtered channel segments
  results.forEach(result => {
    if (result.filterName && result.filteredChannel && result.filteredChannelSegment)
      mutateUiChannelSegmentsRecord(
        state.uiChannelSegments,
        result.filteredChannel.name,
        [result.filteredChannelSegment],
        result.filterName
      );
  });

  // A record mapping channel name to the new result to replace it with

  const replacedChannelNames = Object.keys(removedChannelsRecord);

  mutateSignalDetectionsForEventBeams(
    state,
    removedChannelsRecord,
    username,
    openIntervalName,
    stageId,
    eventId
  );

  // remove all channels cleaned up
  replacedChannelNames.forEach(channelName => {
    if (state.channels.beamed[channelName]) delete state.channels.beamed[channelName];
    if (state.channels.filtered[channelName]) delete state.channels.filtered[channelName];
  });

  // save new channels
  results.forEach(result => {
    state.channels.beamed[result.beamedChannel.name] = result.beamedChannel;
    if (result.filteredChannel)
      state.channels.filtered[result.filteredChannel.name] = result.filteredChannel;
  });
}
