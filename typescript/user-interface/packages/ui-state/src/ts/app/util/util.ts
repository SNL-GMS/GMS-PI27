import type {
  ChannelSegmentTypes,
  ChannelTypes,
  FacetedTypes,
  WaveformTypes
} from '@gms/common-model';
import { FilterTypes, FilterUtil, SignalDetectionTypes } from '@gms/common-model';
import type {
  ProcessingMask,
  Timeseries,
  TimeseriesType
} from '@gms/common-model/lib/channel-segment';
import type { TimeRange } from '@gms/common-model/lib/common';
import type { EventHypothesis } from '@gms/common-model/lib/event';
import type { RotationDefinition } from '@gms/common-model/lib/rotation/types';
import type { SignalDetectionHypothesis } from '@gms/common-model/lib/signal-detection';
import { findPhaseFeatureMeasurementValue } from '@gms/common-model/lib/signal-detection/util';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { ChannelOrientationType } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import {
  epochSecondsNow,
  HALF_CIRCLE_DEGREES,
  THREE_QUARTER_CIRCLE_DEGREES
} from '@gms/common-util';
import produce from 'immer';
import includes from 'lodash/includes';
import sortBy from 'lodash/sortBy';

import type { UiChannelSegment } from '../../types';

/**
 * Determines all associable signal detections
 *
 * @param preferredEventHypothesisByStageForOpenEvent
 * @param selectedSignalDetectionsCurrentHypotheses
 * @returns ids of all associable signal detections
 */
export const determineAllAssociableSignalDetections = (
  preferredEventHypothesisByStageForOpenEvent: EventHypothesis | undefined,
  selectedSignalDetectionsCurrentHypotheses: SignalDetectionHypothesis[]
): string[] => {
  const result: string[] = [];
  const associatedSignalDetectionHypothesesIds = preferredEventHypothesisByStageForOpenEvent
    ? preferredEventHypothesisByStageForOpenEvent?.associatedSignalDetectionHypotheses?.map(
        associatedSignalDetectionHypothesis => associatedSignalDetectionHypothesis.id.id
      )
    : [];
  result.push(
    ...selectedSignalDetectionsCurrentHypotheses
      .filter(
        signalDetectionHypothesis =>
          !signalDetectionHypothesis.deleted &&
          !includes(associatedSignalDetectionHypothesesIds, signalDetectionHypothesis.id.id)
      )
      .map(hypothesis => hypothesis.id.signalDetectionId)
  );
  return result;
};

/**
 * Determines all non-associable signal detections
 *
 * @param preferredEventHypothesisByStageForOpenEvent
 * @param selectedSignalDetectionsCurrentHypotheses
 * @returns ids of all non associable signal detections
 */
export const determineAllNonAssociableSignalDetections = (
  preferredEventHypothesisByStageForOpenEvent: EventHypothesis | undefined,
  selectedSignalDetectionsCurrentHypotheses: SignalDetectionHypothesis[]
): string[] => {
  const result: string[] = [];
  if (!preferredEventHypothesisByStageForOpenEvent) return result;
  const associatedSignalDetectionHypothesesIds =
    preferredEventHypothesisByStageForOpenEvent?.associatedSignalDetectionHypotheses?.map(
      associatedSignalDetectionHypothesis => associatedSignalDetectionHypothesis.id.id
    );
  result.push(
    ...selectedSignalDetectionsCurrentHypotheses
      .filter(
        signalDetectionHypothesis =>
          !signalDetectionHypothesis.deleted &&
          includes(associatedSignalDetectionHypothesesIds, signalDetectionHypothesis.id.id)
      )
      .map(hypothesis => hypothesis.id.signalDetectionId)
  );
  return result;
};

/**
 * Determines all deletable signal detections
 *
 * @param selectedSignalDetectionsCurrentHypotheses
 * @returns sdIds that are deletable
 */
export const determineAllDeletableSignalDetections = (
  selectedSignalDetectionsCurrentHypotheses: SignalDetectionHypothesis[]
): string[] => {
  return selectedSignalDetectionsCurrentHypotheses
    .filter(signalDetectionHypothesis => !signalDetectionHypothesis.deleted)
    .map(hypothesis => hypothesis.id.signalDetectionId);
};

/**
 * Determines all valid signal detections for phase change
 *
 * @param selectedSignalDetectionsCurrentHypotheses
 * @param phase string value for phase change
 * @returns sdIds that are valid for phase changes
 */
export const determineAllValidPhaseChangesForSignalDetections = (
  selectedSignalDetectionsCurrentHypotheses: SignalDetectionHypothesis[],
  phase: string
): string[] => {
  return selectedSignalDetectionsCurrentHypotheses
    .filter(signalDetectionHypothesis => {
      const phaseFmValue = findPhaseFeatureMeasurementValue(
        signalDetectionHypothesis.featureMeasurements
      );
      return phaseFmValue && phaseFmValue.value !== phase && !signalDetectionHypothesis.deleted;
    })
    .map(hypothesis => hypothesis.id.signalDetectionId);
};

/**
 * Determines all sds valid for show fk
 *
 * @param selectedSignalDetectionsCurrentHypotheses
 * @param signalDetectionsIdsToShowFk fks that have already been calculated to show fk
 * @param associableSignalDetectionIds sds that are able to be associated (az slow auto fks associated sds)
 * @returns sdIds that are valid to show fk
 */
export const determineAllValidShowFkSignalDetections = (
  selectedSignalDetectionsCurrentHypotheses: SignalDetectionHypothesis[],
  signalDetectionsIdsToShowFk: string[],
  associableSignalDetectionIds: string[]
): string[] => {
  return selectedSignalDetectionsCurrentHypotheses
    .filter(signalDetectionHypothesis => !signalDetectionHypothesis.deleted)
    .map(hypothesis => hypothesis.id.signalDetectionId)
    .filter(
      sd => !signalDetectionsIdsToShowFk.includes(sd) && associableSignalDetectionIds.includes(sd)
    );
};

/**
 * Takes a UI Channel Segment and trims it down so that times are within the provided time range.
 * If the channel segment was already within the provided time range, no change will occur.
 *
 * @param chanSeg a channel segment to trim
 * @param range a time range to which to trim the channel segment
 * @returns a version of the UI Channel Segment that has its start and end times trimmed to be
 * within the range provided
 */
export function trimUiChannelSegment<T extends Timeseries>(
  chanSeg: UiChannelSegment<T>,
  range: TimeRange
): UiChannelSegment<T> {
  return produce(chanSeg, draft => {
    draft.channelSegmentDescriptor.startTime = range.startTimeSecs;
    draft.channelSegmentDescriptor.endTime = range.endTimeSecs;
    draft.channelSegment.timeseries.forEach(draftSeg => {
      // eslint-disable-next-line no-param-reassign
      draftSeg.sampleCount =
        draftSeg.sampleCount -
        Math.abs(draftSeg.startTime - range.startTimeSecs) * draftSeg.sampleRateHz -
        Math.abs(draftSeg.endTime - range.endTimeSecs) * draftSeg.sampleRateHz;
      // eslint-disable-next-line no-param-reassign
      draftSeg.startTime = Math.max(draftSeg.startTime, range.startTimeSecs);
      // eslint-disable-next-line no-param-reassign
      draftSeg.endTime = Math.min(draftSeg.endTime, range.endTimeSecs);
    });
  });
}

/**
 * Merges a list of UiChannelSegments from a channel into a single UiChannelSegment
 * with the timeseries sorted in ascending order based on the start time
 *
 * @param uiChannelSegments
 * @returns merged channel segment into a single UiChannelSegment
 */
export function mergeUiChannelSegments(
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
): UiChannelSegment<WaveformTypes.Waveform> {
  let combinedStartTime = Infinity;
  let combinedEndTime = -Infinity;
  let combinedMissingInputChannels: ChannelSegmentTypes.TimeRangesByChannel[] = [];
  let combinedMaskedBy: ChannelSegmentTypes.ProcessingMask[] = [];

  let timeseriesList = uiChannelSegments.flatMap(uiCs => {
    if (uiCs.channelSegmentDescriptor.startTime < combinedStartTime) {
      combinedStartTime = uiCs.channelSegmentDescriptor.startTime;
    }
    if (uiCs.channelSegmentDescriptor.endTime > combinedEndTime) {
      combinedEndTime = uiCs.channelSegmentDescriptor.endTime;
    }
    combinedMaskedBy = combinedMaskedBy.concat(uiCs.channelSegment.maskedBy);
    combinedMissingInputChannels = combinedMissingInputChannels.concat(
      uiCs.channelSegment.missingInputChannels
    );
    return uiCs.channelSegment.timeseries;
  });
  // Sort timeseries in ascending order based on start time
  timeseriesList = sortBy(timeseriesList, ts => ts.startTime);

  // Build the combined Channel Segment
  const baseUiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> = uiChannelSegments[0];
  const channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor = {
    ...baseUiChannelSegment.channelSegmentDescriptor,
    startTime: combinedStartTime,
    endTime: combinedEndTime
  };
  return {
    ...baseUiChannelSegment,
    channelSegmentDescriptor,
    channelSegment: {
      ...baseUiChannelSegment.channelSegment,
      timeseries: timeseriesList,
      id: channelSegmentDescriptor,
      missingInputChannels: combinedMissingInputChannels,
      maskedBy: combinedMaskedBy
    }
  };
}

/**
 * Helper function to build the analysis waveform for a feature measurement. The analysis waveform is
 * typically the unfiltered original channel segment used to create a waveform, for example:
 * in the case it has been filtered. The analysis waveform is typically used for signal detection and
 * waveform selection.
 * @param populatedChannel the fully populated channel associated with the filtered waveform
 * @param unfilteredChannelVersionReference the channel version reference of the original unfiltered waveform
 * @param uiChannelSegment the ui channel segment (used for the start and end times)
 * @param featureMeasurementType the type typically ARRIVAL or PHASE
 * @returns a new feature measurement
 */
export const buildAnalysisWaveform = (
  measuredChannel: ChannelTypes.Channel | undefined,
  channelVersionReference: FacetedTypes.VersionReference<'name', ChannelTypes.Channel> | undefined,
  channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined,
  featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType
): SignalDetectionTypes.WaveformAndFilterDefinition | undefined => {
  if (!measuredChannel || !channelVersionReference) {
    return undefined;
  }
  let filterDefinition: FilterTypes.FilterDefinition | undefined;

  // processingDefinition may not be a filter definition so we need to confirm
  if (FilterUtil.isFilterDefinition(measuredChannel.processingDefinition)) {
    filterDefinition = {
      name: measuredChannel.processingDefinition?.name,
      comments: measuredChannel.processingDefinition?.comments,
      filterDescription: measuredChannel.processingDefinition?.filterDescription
    };
  }

  let filterDefinitionUsage: FilterTypes.FilterDefinitionUsage | undefined;

  // Only set the filterDefinitionUsage if the featureMeasurementType is ARRIVAL_TIME
  // and the filterDefinition is extracted from the channel processingDefinition
  if (
    featureMeasurementType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME &&
    filterDefinition
  ) {
    filterDefinitionUsage = FilterTypes.FilterDefinitionUsage.DETECTION;
  }

  return channelSegmentDescriptor
    ? {
        waveform: {
          id: {
            channel: channelVersionReference,
            startTime: channelSegmentDescriptor.startTime,
            endTime: channelSegmentDescriptor.endTime,
            creationTime: channelSegmentDescriptor.creationTime
          }
        },
        filterDefinitionUsage,
        filterDefinition
      }
    : undefined;
};

/**
 * Given a rotation definition and channel orientation this will update the horizontalAngleDeg in the required
 * way for rotated channel construction.
 *
 * @param rotationDefinition the rotation definition to adjust
 * @param channelOrientationType the channel orientation to adjust to
 * @returns the updated rotation definition
 */
export function adjustRotationDefinitionForChannelOrientation(
  rotationDefinition: RotationDefinition,
  channelOrientationType: ChannelOrientationType
): RotationDefinition {
  let { horizontalAngleDeg } = rotationDefinition.rotationParameters.orientationAngles;

  if (channelOrientationType === ChannelOrientationType.RADIAL) {
    // For Channel (R), Assign the horizontalAngleDeg attribute of the orientationAngles to be the value of the
    // RotationDefinition object's receiverToSourceAzimuthDeg plus 180 degrees.
    horizontalAngleDeg =
      rotationDefinition.rotationParameters.receiverToSourceAzimuthDeg + HALF_CIRCLE_DEGREES;
  } else if (channelOrientationType === ChannelOrientationType.TRANSVERSE) {
    // For Channel (T), Assign the horizontalAngleDeg attribute of the orientationAngles to be the value of the
    // RotationDefinition object's receiverToSourceAzimuthDeg plus 270 degrees.
    horizontalAngleDeg =
      rotationDefinition.rotationParameters.receiverToSourceAzimuthDeg +
      THREE_QUARTER_CIRCLE_DEGREES;
  }

  return {
    ...rotationDefinition,
    rotationParameters: {
      ...rotationDefinition.rotationParameters,
      orientationAngles: {
        ...rotationDefinition.rotationParameters.orientationAngles,
        horizontalAngleDeg
      }
    }
  };
}

/**
 * Finds processing masks that overlap the given waveforms.
 *
 * @param processingMasks the processing masks to compare against
 * @param rotatedWaveforms the waveforms the masks are expected to overlap
 * @returns a filtered array of processing masks
 */
export function findOverlappingProcessingMasks(
  processingMasks: ProcessingMask[],
  rotatedWaveforms: WaveformTypes.Waveform[]
): ProcessingMask[] {
  return processingMasks.filter(({ startTime, endTime }) => {
    return rotatedWaveforms.some(
      ({ startTime: startTimeSecs, endTime: endTimeSecs }) =>
        (startTime >= startTimeSecs && startTime <= endTimeSecs) ||
        (endTime >= startTimeSecs && endTime <= endTimeSecs)
    );
  });
}

/**
 * Creates a rotated ui channel segment.
 * @param channel the rotated channel (see createRotated)
 * @param rotationTimeInterval the time interval of the rotation
 * @param timeseries the timeseries that will be associated with the ui channel segment
 * @param timeseriesType the time series type
 * @param processingMasks the processing masks
 * @returns ui channel segments
 */
export function createRotatedUiChannelSegment(
  channel: Channel,
  rotationTimeInterval: TimeRange,
  domainTimeRange: TimeRange,
  timeseries: WaveformTypes.Waveform[],
  timeseriesType: TimeseriesType,
  processingMasks: ProcessingMask[],
  missingInputChannels: ChannelSegmentTypes.TimeRangesByChannel[]
): UiChannelSegment<WaveformTypes.Waveform> {
  const creationTime = epochSecondsNow();

  return {
    channelSegmentDescriptor: {
      channel: {
        name: channel.name,
        effectiveAt: channel.effectiveAt
      },
      startTime: rotationTimeInterval.startTimeSecs,
      endTime: rotationTimeInterval.endTimeSecs,
      creationTime
    },
    channelSegment: {
      id: {
        channel: {
          name: channel.name,
          effectiveAt: channel.effectiveAt
        },
        startTime: rotationTimeInterval.startTimeSecs,
        endTime: rotationTimeInterval.endTimeSecs,
        creationTime
      },
      units: channel.units,
      timeseriesType,
      timeseries,
      maskedBy: processingMasks,
      missingInputChannels
    },
    domainTimeRange
  };
}
