import type { EventTypes } from '@gms/common-model';
import { convertToVersionReference } from '@gms/common-model';
import type { ChannelSegmentDescriptor } from '@gms/common-model/lib/channel-segment';
import { createChannelSegmentString } from '@gms/common-model/lib/channel-segment/util';
import {
  isSignalDetectionOpenAssociated,
  isSignalDetectionUnassociated
} from '@gms/common-model/lib/event/util';
import {
  type SignalDetection,
  type SignalDetectionHypothesis
} from '@gms/common-model/lib/signal-detection';
import {
  findArrivalTimeFeatureMeasurement,
  findPhaseFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import { isRotatedChannelName } from '@gms/common-model/lib/station-definitions/channel-definitions/util';
import type { Waveform } from '@gms/common-model/lib/waveform/types';
import { UILogger } from '@gms/ui-util';
import { type Draft } from 'immer';
import type { WritableDraft } from 'immer/dist/types/types-external';
import cloneDeep from 'lodash/cloneDeep';

import type { ChannelRecord, MaskAndRotate2dResult, UiChannelSegment } from '../../../../types';
import { type SDHypothesisArgs } from '../../..';
import { channelsHaveSameCode } from '../../../util/channel-factory-util';
import {
  areChannelAzimuthsWithinTolerance,
  channelBelongsToStation,
  channelsHaveMatchingOrientationType,
  getChannelFromPhaseFeatureMeasurement
} from '../../../util/channel-util';
import { buildAnalysisWaveform } from '../../../util/util';
import { createWorkingHypothesisAndUpdateAssociations } from '../event/create-working-hypothesis';
import type { DataState } from '../types';
import { mutateUiChannelSegmentsRecord } from './mutate-channel-segment-record';

const logger = UILogger.create(
  'GMS_LOG_UI_ROTATION_RESULTS_PROCESSOR',
  process.env.GMS_LOG_UI_ROTATION_RESULTS_PROCESSOR
);

/**
 * Matches ChannelSegmentDescriptors based on startTime, endTime, creationTime, and the channel name codes.
 * Doesn't match channel names directly, but verifies they have the same codes so that we can match across filters
 * i.e. differently filtered versions of the same channel segment should return a match
 *
 * @param channelSegmentDescriptor1
 * @param channelSegmentDescriptor2
 * @returns boolean
 */
export function channelSegmentDescriptorsMatch(
  channelSegmentDescriptor1: ChannelSegmentDescriptor,
  channelSegmentDescriptor2: ChannelSegmentDescriptor
): boolean {
  return (
    channelSegmentDescriptor1.startTime === channelSegmentDescriptor2.startTime &&
    channelSegmentDescriptor1.endTime === channelSegmentDescriptor2.endTime &&
    channelSegmentDescriptor1.creationTime === channelSegmentDescriptor2.creationTime &&
    channelsHaveSameCode(
      channelSegmentDescriptor1.channel.name,
      channelSegmentDescriptor2.channel.name
    )
  );
}

/**
 * !mutates state in place
 *
 * If the incoming rotated channel segment does not match the provided {@param chanSegToDelete}
 * delete the unfiltered version and all filtered versions from the uiChannelSegments record
 *
 * @param state state containing the uiChannelSegments record
 * @param chanSegToDelete channel segment to be deleted if it is not an exact match for {@param incomingChannelSegment}
 * @param incomingChannelSegment the new channel segment intended to replace {@param chanSegToDelete}
 * @param stationName station name used for traversing the uiChannelSegments record (should correspond to the weavess row name)
 */
export function deleteChannelSegmentAndFilteredVersions(
  state: WritableDraft<DataState>,
  chanSegToDelete:
    | WritableDraft<{
        readonly id: ChannelSegmentDescriptor;
      }>
    | undefined,
  incomingChannelSegment: UiChannelSegment<Waveform>,
  stationName: string
): void {
  if (!chanSegToDelete) {
    logger.debug('no channel segment to delete');
    return;
  }
  const chanSegString = createChannelSegmentString(chanSegToDelete.id);
  if (!chanSegString) {
    logger.debug('No channel segment string found');
    return;
  }
  logger.debug('attempting to delete chan seg string: ', chanSegString);

  /* If exact channel segment descriptor for newly rotated channel segment matches the one we're trying to delete,
   * don't delete it because filter cache will not know to re-filter it
   */
  if (
    channelSegmentDescriptorsMatch(
      chanSegToDelete.id,
      incomingChannelSegment.channelSegmentDescriptor
    ) &&
    chanSegToDelete.id.channel.name === incomingChannelSegment.channelSegmentDescriptor.channel.name
  ) {
    logger.debug(
      'Will not delete channel segment: ',
      chanSegString,
      ' matches incoming channel segment exactly',
      incomingChannelSegment.channelSegment.id
    );
    return;
  }

  // delete channel segments for each filter
  Object.entries(state.uiChannelSegments[stationName]).forEach(filterNameToChanSegArrayTuple => {
    const [filterName] = filterNameToChanSegArrayTuple;
    const indexToDelete = state.uiChannelSegments[stationName][filterName].findIndex(
      channelSegment =>
        channelSegmentDescriptorsMatch(chanSegToDelete.id, channelSegment.channelSegmentDescriptor)
    );

    if (state.uiChannelSegments[stationName][filterName][indexToDelete]) {
      logger.debug('Deleting channel segment: ', chanSegString);
      // delete the channel segment
      state.uiChannelSegments[stationName][filterName].splice(indexToDelete, 1);
    }
  });
}

/**
 * !Mutates provided state in place
 *
 *  Traverse the most current SignalDetectionHypothesis object's FeatureMeasurement collection and
 *  if necessary, updates each FeatureMeasurement object's channel, measuredChannelSegment, and
 *  analysisWaveform attributes to reference the new filtered rotated waveform's Channel and UiChannelSegment
 *  rather than the previous rotated waveform's Channel and UiChannelSegment.
 *
 *  !Deletes newly unreferenced channels and channel segments from state
 *
 * @param state Draft state to mutate in place
 * @param sd Signal detection to work on
 * @param rotationResult newly rotated channels/channel segments that we are updating feature measurements to point towards
 * @param allRotatedChannels a copy of the channels in state that have been previously rotated- used to find matches that need updating
 * @param config contains configured rotationReplacementAzimuthToleranceDeg used to determine matches
 */
export function updateWorkingSDHypoFeatureMeasurements(
  state: WritableDraft<DataState>,
  sd: WritableDraft<SignalDetection>,
  rotationResult: MaskAndRotate2dResult,
  allRotatedChannels: WritableDraft<ChannelRecord>,
  config: {
    rotationReplacementAzimuthToleranceDeg: number;
  }
): void {
  const sdHypo: WritableDraft<SignalDetectionHypothesis> = getCurrentHypothesis(
    sd.signalDetectionHypotheses
  );
  const newlyRotatedMeasuredChannel =
    rotationResult.filteredChannel ?? rotationResult.rotatedChannel;
  const phaseFmChannel = getChannelFromPhaseFeatureMeasurement(sdHypo);
  const fullyPopulatedPhaseFmChannel = allRotatedChannels[phaseFmChannel.name];
  if (fullyPopulatedPhaseFmChannel == null) {
    throw new Error(
      `Cannot find fully populated channel matching the channel used to make the feature measurement: ${phaseFmChannel.name}`
    );
  }

  sdHypo.featureMeasurements.forEach(fm => {
    if (
      fm.channel.name === phaseFmChannel.name &&
      areChannelAzimuthsWithinTolerance(
        config.rotationReplacementAzimuthToleranceDeg,
        newlyRotatedMeasuredChannel,
        allRotatedChannels[fm.channel.name]
      )
    ) {
      // update measured channel segment with filtered segment if it exists, otherwise with unfiltered, rotated segment
      const measuredChannelSegment =
        rotationResult.filteredUiChannelSegment ?? rotationResult.rotatedUiChannelSegment;
      deleteChannelSegmentAndFilteredVersions(
        state,
        fm.measuredChannelSegment,
        measuredChannelSegment,
        rotationResult.stationName
      );
      // Disabled eslint because we are working within a draft
      // eslint-disable-next-line no-param-reassign
      fm.measuredChannelSegment = { id: measuredChannelSegment.channelSegmentDescriptor };

      // Disabled eslint because we are working within a draft
      // eslint-disable-next-line no-param-reassign
      fm.analysisWaveform = buildAnalysisWaveform(
        newlyRotatedMeasuredChannel,
        convertToVersionReference(rotationResult.rotatedChannel, 'name'),
        rotationResult.rotatedUiChannelSegment.channelSegmentDescriptor,
        fm.featureMeasurementType
      );
    }
  });
  /**
   * TODO: Derivatives
   * The InteractiveAnalysisStateManager must also look for and replace derivatives of the previous rotated waveform,
   * such as rotated and then filtered Channel and UiChannelSegment objects. Every FeatureMeasurement the
   * InteractiveAnalysisStateManager updates is associated to the new filtered rotated Channel and UiChannelSegment.
   */
  // Delete newly unreferenced channels (previous rotated versions of newly rotated channels)
  if (
    state.channels.beamed[phaseFmChannel.name] &&
    areChannelAzimuthsWithinTolerance(
      config.rotationReplacementAzimuthToleranceDeg,
      newlyRotatedMeasuredChannel,
      fullyPopulatedPhaseFmChannel
    )
  ) {
    logger.debug('deleting unfiltered channel', phaseFmChannel.name);
    delete state.channels.beamed[phaseFmChannel.name];
  }

  if (
    state.channels.filtered[phaseFmChannel.name] &&
    areChannelAzimuthsWithinTolerance(
      config.rotationReplacementAzimuthToleranceDeg,
      newlyRotatedMeasuredChannel,
      fullyPopulatedPhaseFmChannel
    )
  ) {
    logger.debug('deleting filtered channel', phaseFmChannel.name);
    delete state.channels.filtered[phaseFmChannel.name];
  }
}

/**
 * !Mutates provided state in place
 *
 * -If the Signal Detection current version is a current version with unsaved changes,
 *  update it's feature measurements with {@link updateWorkingSDHypoFeatureMeasurements}
 * -If there isn't an in-progress working version, create one and update that instead.
 *
 * @param state to be modified in place
 * @param sd Signal Detection to update
 * @param rotationResult newly rotated channels and channel segments
 * @param previouslyRotatedChannels a copy of the channel record filtered down to only contain rotated channels
 * @param config contains values from analyst configuration
 * @param newSDHypothesisArgs contains values used for creating new SD Hypothesis
 */
export function handleSDHypothesisUpdate(
  state: WritableDraft<DataState>,
  sd: WritableDraft<SignalDetection>,
  rotationResult: MaskAndRotate2dResult,
  previouslyRotatedChannels: WritableDraft<ChannelRecord>,
  config: {
    rotationReplacementAzimuthToleranceDeg: number;
  },
  newSDHypothesisArgs: SDHypothesisArgs
): void {
  if (!sd._uiHasUnsavedChanges) {
    /**
     * If the signal detection does not have a working SD Hypothesis, clone the current (saved)
     * SignalDetectionHypothesis in place, which will updated in the next step
     */
    createWorkingHypothesisAndUpdateAssociations(state, {
      username: newSDHypothesisArgs.username,
      openIntervalName: newSDHypothesisArgs.openIntervalName,
      stageId: newSDHypothesisArgs.stageId,
      eventIds: newSDHypothesisArgs?.currentEventId ? [newSDHypothesisArgs?.currentEventId] : [],
      signalDetectionIds: [sd.id]
    });
  }
  // update most current SD Hypothesis
  updateWorkingSDHypoFeatureMeasurements(
    state,
    sd,
    rotationResult,
    previouslyRotatedChannels,
    config
  );
}

function doRotatedWaveformTimesOverlapArrivalTime(
  sdHypothesis: SignalDetectionHypothesis,
  rotationResult: MaskAndRotate2dResult
): boolean {
  const maybeArrivalFm = findArrivalTimeFeatureMeasurement(sdHypothesis.featureMeasurements);

  const { arrivalTime } = maybeArrivalFm.measurementValue;
  return (
    (arrivalTime.value >=
      rotationResult.rotatedUiChannelSegment.channelSegmentDescriptor.startTime &&
      arrivalTime.value <=
        rotationResult.rotatedUiChannelSegment.channelSegmentDescriptor.endTime) ||
    (rotationResult.filteredUiChannelSegment &&
      arrivalTime.value >=
        rotationResult.filteredUiChannelSegment.channelSegmentDescriptor.startTime &&
      arrivalTime.value <=
        rotationResult.filteredUiChannelSegment.channelSegmentDescriptor.endTime) ||
    false
  );
}

/**
 *
 * @param sdHypothesis
 * @param newSDHypothesisArgs contains open event id
 * @returns true if SDHypothesis is either
 * 1) associated to the event open at the time of rotation
 * or
 * 2) not associated to any event
 */
export function sdHypothesisAssociatedToOpenEventOrIsUnassociated(
  sd: SignalDetection,
  eventArray: EventTypes.Event[],
  openEventId: string | undefined,
  openIntervalName: string
) {
  return (
    (openEventId &&
      isSignalDetectionOpenAssociated(sd, eventArray, openEventId, openIntervalName)) ||
    isSignalDetectionUnassociated(
      getCurrentHypothesis(sd.signalDetectionHypotheses),
      eventArray,
      openIntervalName
    )
  );
}

/**
 * Determine if current SignalDetectionHypothesis has at least one FeatureMeasurement associated to a
 * previously created rotated Channel with the same Station, PhaseType, and ChannelOrientationType
 * combination as the new rotated Channel
 *
 * It must also be either
 * 1) associated to the open event
 * or
 * 2) unassociated to an event
 *
 * @param sdHypothesis Signal Detection Hypothesis to check
 * @param rotationResult  newly rotated channels/channel segments from a single rotation
 * @param PreviouslyRotatedChannels a copy of the channel record filtered down to only contain rotated channels
 * @param config contains values from analyst configuration
 * @returns true if SDHypothesis is determined to be referencing a previously rotated version of the new {@param rotationResult}
 */
export function containsMatchingFeatureMeasurement(
  sdHypothesis: SignalDetectionHypothesis,
  rotationResult: MaskAndRotate2dResult,
  PreviouslyRotatedChannels: WritableDraft<ChannelRecord>,
  config: {
    rotationReplacementAzimuthToleranceDeg: number;
  }
): boolean {
  const phaseFm = findPhaseFeatureMeasurement(sdHypothesis.featureMeasurements);
  const phaseFeatureMeasurementChannel = PreviouslyRotatedChannels[phaseFm.channel.name];
  if (phaseFeatureMeasurementChannel == null) {
    return false;
  }

  const isRotatedChannel: boolean = isRotatedChannelName(phaseFeatureMeasurementChannel.name);
  const OrientationTypeMatch: boolean = channelsHaveMatchingOrientationType(
    phaseFeatureMeasurementChannel,
    rotationResult.rotatedChannel
  );
  const stationMatch: boolean = channelBelongsToStation(
    phaseFeatureMeasurementChannel,
    rotationResult.stationName
  );
  const phaseMatch: boolean = rotationResult.phase === phaseFm.measurementValue.value;
  const azimuthMatch: boolean = areChannelAzimuthsWithinTolerance(
    config.rotationReplacementAzimuthToleranceDeg,
    phaseFeatureMeasurementChannel,
    rotationResult.rotatedChannel
  );
  const timeMatch = doRotatedWaveformTimesOverlapArrivalTime(sdHypothesis, rotationResult);
  return (
    isRotatedChannel &&
    OrientationTypeMatch &&
    stationMatch &&
    phaseMatch &&
    azimuthMatch &&
    timeMatch
  );
}

/**
 * !Mutates provided state in place
 * Cycles through the Signal Detections in state and searches for ones that contain current SD Hypotheses
 * that reference channels or channel segments that are previous versions of our rotation results.
 *
 * Calls {@link handleSDHypothesisUpdate} when matches are found
 *
 * @param state state to be operated upon
 * @param rotationResults newly rotated channels/channel segments
 * @param allRotatedChannels a copy of the channel record filtered down to only contain rotated channels
 * @param config contains values from analyst configuration
 * @param newSDHypothesisArgs contains values used for creating new SD Hypothesis
 */
export function updateSDsAndRemoveUnreferencedChannels(
  state: Draft<DataState>,
  rotationResults: MaskAndRotate2dResult[],
  allRotatedChannels: WritableDraft<ChannelRecord>,
  config: {
    rotationReplacementAzimuthToleranceDeg: number;
  },
  newSDHypothesisArgs: SDHypothesisArgs
): void {
  const { signalDetections } = state;
  const eventArray: EventTypes.Event[] = Object.values(state.events);

  Object.values(signalDetections).forEach(sd => {
    // Only update SD hypothesis if the SD is associated to the currently open event, or if it is unassociated to events
    if (
      sdHypothesisAssociatedToOpenEventOrIsUnassociated(
        sd,
        eventArray,
        newSDHypothesisArgs.currentEventId,
        newSDHypothesisArgs.openIntervalName
      )
    ) {
      rotationResults.forEach(rotationResult => {
        if (sd.station.name !== rotationResult.stationName) {
          return;
        }
        const currentSDHypothesis: WritableDraft<SignalDetectionHypothesis> = getCurrentHypothesis(
          sd.signalDetectionHypotheses
        );
        if (!currentSDHypothesis || currentSDHypothesis.featureMeasurements.length === 0) {
          return;
        }

        if (
          containsMatchingFeatureMeasurement(
            currentSDHypothesis,
            rotationResult,
            allRotatedChannels,
            config
          )
        ) {
          handleSDHypothesisUpdate(
            state,
            sd,
            rotationResult,
            allRotatedChannels,
            config,
            newSDHypothesisArgs
          );
        }
      });
    }
  });
}

/**
 * Returns a Channel Record containing only "beamed" and filtered channels that have been rotated
 * @param state
 * @returns channel record derived from provided state
 */
export function getRotatedChannels(state: Draft<DataState>): WritableDraft<ChannelRecord> {
  const rotatedChannels: WritableDraft<ChannelRecord> = {};

  Object.entries(state.channels.beamed).forEach(entry => {
    if (isRotatedChannelName(entry[0])) {
      rotatedChannels[entry[0]] = cloneDeep(entry[1]);
    }
  });
  Object.entries(state.channels.filtered).forEach(entry => {
    if (isRotatedChannelName(entry[0])) {
      rotatedChannels[entry[0]] = cloneDeep(entry[1]);
    }
  });

  return rotatedChannels;
}

/**
 * !Mutates provided state in place
 * After rotation this function:
 * - Saves newly rotated channels and channel segments
 * - Updates current signal detection hypotheses from the previous version of the rotated channel/channel segments to reference the newly rotated version
 * - Removes previous rotated versions of the newly rotated channels/channel segments as the become unreferenced
 * @param state the state to be mutated
 * @param rotationResults newly rotated channels/channel segments
 * @param config values from configuration relevant to determining matches and finding the previously rotated version of the channels
 * @param newSDHypothesisArgs used to create a new SD hypothesis for SDs without a current working version
 */
export function saveRotationResultsAndUpdateSignalDetections(
  state: Draft<DataState>,
  rotationResults: MaskAndRotate2dResult[],
  config: {
    rotationReplacementAzimuthToleranceDeg: number;
  },
  newSDHypothesisArgs: SDHypothesisArgs
) {
  logger.debug(`rotation results to be processed: `, rotationResults);

  // create filtered record of rotated channels to reduce the amount of scanning we need to do
  const allRotatedChannels = getRotatedChannels(state);

  // update SDs and removed unreferenced channels and channel segments
  if (Object.values(allRotatedChannels).length > 0) {
    updateSDsAndRemoveUnreferencedChannels(
      state,
      rotationResults,
      allRotatedChannels,
      config,
      newSDHypothesisArgs
    );
  }
  // save rotation results. Must take place after updating SDs, or channel segment removal might not be successful.
  rotationResults.forEach(
    ({
      rotatedChannel,
      rotatedUiChannelSegment,
      filteredChannel,
      filteredUiChannelSegment,
      stationName
    }) => {
      // save unfiltered rotated Channels
      state.channels.beamed[rotatedChannel.name] = rotatedChannel;
      logger.debug('Saving unfiltered channel', rotatedChannel.name);
      // save unfiltered rotated Channel Segments
      logger.debug('Saving unfiltered channel segment', rotatedUiChannelSegment.channelSegment.id);
      mutateUiChannelSegmentsRecord(state.uiChannelSegments, stationName, [
        rotatedUiChannelSegment
      ]);

      // save filtered rotated Channels
      if (filteredChannel) {
        state.channels.filtered[filteredChannel.name] = filteredChannel;
        logger.debug('Saving filtered channel', filteredChannel.name);
      }

      // save filtered rotated Channel Segments
      if (filteredUiChannelSegment) {
        logger.debug('saving filtered channel segment', filteredUiChannelSegment.channelSegment.id);
        mutateUiChannelSegmentsRecord(
          state.uiChannelSegments,
          stationName,
          [filteredUiChannelSegment],
          filteredUiChannelSegment.channelSegment._uiFilterId
        );
      }
    }
  );
}
