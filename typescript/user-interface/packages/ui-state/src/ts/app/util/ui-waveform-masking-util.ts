import type { ChannelTypes, WaveformTypes } from '@gms/common-model';
import { CommonTypes } from '@gms/common-model';
import type {
  ProcessingMask,
  ProcessingOperation
} from '@gms/common-model/lib/channel-segment/types';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import { convertToEntityReference } from '@gms/common-model/lib/faceted';
import type { ProcessingMaskDefinition } from '@gms/common-model/lib/processing-mask-definitions/types';
import type { QcSegmentVersion } from '@gms/common-model/lib/qc-segment';
import { MILLISECONDS_IN_SECOND, uuid4 } from '@gms/common-util';
import { doTimeRangesOverlap } from '@gms/weavess-core/lib/util';
import { unwrapResult } from '@reduxjs/toolkit';
import React from 'react';

import type { UiChannelSegment } from '../../types';
import { selectProcessingMaskDefinitionsByChannels } from '../api';
import type { GetProcessingMaskDefinitionsQueryArgs } from '../api/data/signal-enhancement/get-processing-mask-definitions';
import { getProcessingMaskDefinitions } from '../api/data/signal-enhancement/get-processing-mask-definitions';
import type { FindQCSegmentsByChannelAndTimeRangeQueryArgs } from '../api/data/waveform/find-qc-segments-by-channel-and-time-range';
import { UIStateError } from '../error-handling/ui-state-error';
import { useFetchRawChannels } from '../hooks/channel-hooks';
import { useEffectiveTime } from '../hooks/operational-time-period-configuration-hooks';
import { useFetchQcSegmentsByChannelsAndTimeRange } from '../hooks/qc-segment-hooks';
import { useAppDispatch, useAppSelector } from '../hooks/react-redux-hooks';
import { useStationGroupEffectiveForInterval } from '../hooks/station-definition-hooks';
import { useViewableInterval } from '../hooks/waveform-hooks';
import { handleCanceledRequests } from '../query/async-fetch-util';
import { getStore } from '../store';
import { createMasked } from './channel-factory';

/**
 * helper interface containing the array of qcSegmentVersions, the earliest start time, latest end time, and associated channel
 */
interface QcVersionGroup {
  qcSegmentVersions: QcSegmentVersion[];
  startTime: number;
  endTime: number;
}

/**
 * Helper function to sort qcVersions into groups.
 * Filters the array based on the definition and groups based on the merge threshold
 *
 * @param qcSegmentVersions array of qc segment versions
 * @param processingMaskDefinition a mask definition used to determine the merge threshold and QcSegment type and category
 * @returns QcVersionGroup[]
 */
function groupQcSegmentVersions(
  qcSegmentVersions: QcSegmentVersion[],
  processingMaskDefinition: ProcessingMaskDefinition
): QcVersionGroup[] {
  const filteredSegmentVersions = qcSegmentVersions
    .filter(qcVersion =>
      processingMaskDefinition.appliedQcSegmentCategoryAndTypes.find(
        appliedQcSegmentCategoryAndType =>
          appliedQcSegmentCategoryAndType.type === qcVersion.type &&
          appliedQcSegmentCategoryAndType.category === qcVersion.category
      )
    )
    .sort((a, b) => a.startTime - b.startTime);

  const versionGroups: QcVersionGroup[] = [];
  const { maskedSegmentMergeThreshold } = processingMaskDefinition;
  let currentGroup: QcVersionGroup | null = null;

  // Loop through all versions, adding to the existing group if they connect
  // Starting a new group if they do not
  filteredSegmentVersions.forEach(qcVersion => {
    // If the start time falls within the merge threshold of the current group add it.
    // Do not need to check end time because the qcSegmentVersions are sorted by start time
    if (
      currentGroup &&
      qcVersion.startTime > currentGroup.startTime - maskedSegmentMergeThreshold &&
      qcVersion.startTime < currentGroup.endTime + maskedSegmentMergeThreshold
    ) {
      currentGroup.qcSegmentVersions.push(qcVersion);
      // If the new versions end time is later then update the groups end time
      if (qcVersion.endTime > currentGroup.endTime) currentGroup.endTime = qcVersion.endTime;
    } else {
      // If the start time is not within the merge threshold start a new group
      // Because the data is sorted by start date, no future versions will have a start or end date that falls in the threshold

      // Push the previous group.  It is now complete
      if (currentGroup) {
        versionGroups.push(currentGroup);
      }

      // reset the current group to be based on the current version.  This will be the basis for the new group
      currentGroup = {
        qcSegmentVersions: [qcVersion],
        startTime: qcVersion.startTime,
        endTime: qcVersion.endTime
      };
    }
  });
  // push the last group
  if (currentGroup) versionGroups.push(currentGroup);

  return versionGroups;
}

/**
 * Operation to build the processing masks from an array of qc segment versions based on a processing mask definition
 *
 * @param qcSegmentVersions array of qc segment versions
 * @param processingMaskDefinition a mask definition used to determine the merge threshold and QcSegment type and category
 * @returns QcVersionGroup[]
 */
export function createProcessingMasksFromQCSegmentVersions(
  qcSegmentVersions: QcSegmentVersion[],
  processingMaskDefinition: ProcessingMaskDefinition
): ProcessingMask[] {
  return groupQcSegmentVersions(qcSegmentVersions, processingMaskDefinition).map(versionGroup => {
    return {
      id: uuid4(),
      effectiveAt: Date.now() / MILLISECONDS_IN_SECOND,
      startTime: versionGroup.startTime,
      endTime: versionGroup.endTime,
      appliedToRawChannel: convertToEntityReference(qcSegmentVersions[0].channels[0], 'name'),
      processingOperation: processingMaskDefinition.processingOperation,
      maskedQcSegmentVersions: versionGroup.qcSegmentVersions
    };
  });
}

/**
 * @returns a callback function to fetch processing mask definitions
 */
export function useFetchProcessingMaskDefinitions() {
  const dispatch = useAppDispatch();
  return React.useCallback(
    async (args: GetProcessingMaskDefinitionsQueryArgs) => {
      return dispatch(getProcessingMaskDefinitions(args))
        .then(handleCanceledRequests(unwrapResult))
        .catch(e => {
          throw new UIStateError(e);
        });
    },
    [dispatch]
  );
}

/**
 * A hook to build a function that creates processing masks
 * Requests the qcSegments, processingMaskDefinitions, and channels from redux state that are needed for the function
 *
 * @returns an async function createProcessingMasks that takes a uiChannelSegment, a processingOperation, and a phaseType
 * @throw errors if processing mask definitions are not loaded
 */
export function useCreateProcessingMasks() {
  const qcSegments = useAppSelector(state => state.data.qcSegments);
  const fetchQcSegmentsByChannelsAndTime = useFetchQcSegmentsByChannelsAndTimeRange();
  const processingMaskDefinitionsByChannels = useAppSelector(
    selectProcessingMaskDefinitionsByChannels
  );
  const fetchRawChannels = useFetchRawChannels();
  const [viewableInterval] = useViewableInterval();
  const effectiveTime = useEffectiveTime();
  const fetchProcessingMaskDefinitions = useFetchProcessingMaskDefinitions();
  const stationGroup = useStationGroupEffectiveForInterval();

  return React.useCallback(
    async (
      channelVersionReference: VersionReference<'name', ChannelTypes.Channel>,
      startTime: number,
      endTime: number,
      processingOperation: ProcessingOperation,
      phaseType: string
    ) => {
      const allChannelsRightNow = getStore().getState().data.channels;

      let channel = allChannelsRightNow.raw[channelVersionReference.name];

      if (channel == null) {
        CommonTypes.Util.validateTimeRange(viewableInterval);
        const result = await fetchRawChannels([channelVersionReference], viewableInterval);
        // search results for the channel that is currently effective
        const maybeChannel = result.find(
          chan => chan.effectiveAt < effectiveTime && chan.effectiveUntil > effectiveTime
        );
        if (maybeChannel == null) {
          throw new Error(`No channel found for effective time: ${effectiveTime}`);
        }
        channel = maybeChannel;
      }

      const processingMaskDefinitions = processingMaskDefinitionsByChannels.find(
        p => p.channel.name === channel.name && p.channel.effectiveAt === channel.effectiveAt
      )?.processingMaskDefinitions;

      let processingMaskDefinition = processingMaskDefinitions?.[phaseType]?.[processingOperation];

      // Fetch processing masks if not found
      if (processingMaskDefinition === undefined) {
        const result = await fetchProcessingMaskDefinitions({
          stationGroup,
          channels: [channel],
          phaseTypes: [phaseType],
          processingOperations: [processingOperation]
        });
        const processingMaskDefsByPhase = result?.processingMaskDefinitionByPhaseByChannel?.find(
          p => p.channel.name === channel.name && p.channel.effectiveAt === channel.effectiveAt
        )?.processingMaskDefinitionByPhase;
        processingMaskDefinition = processingMaskDefsByPhase?.[phaseType];
        if (processingMaskDefinition == null) {
          throw new Error(
            `Processing mask definition not loaded for ${channel.name}, ${phaseType}, ${processingOperation}`
          );
        }
      }
      const channelQcSegments = qcSegments[channel.name];
      let qcSegmentVersions: QcSegmentVersion[] = [];
      if (channelQcSegments == null) {
        CommonTypes.Util.validateTimeRange(viewableInterval);
        const args: FindQCSegmentsByChannelAndTimeRangeQueryArgs = {
          channels: [channel],
          startTime: viewableInterval.startTimeSecs,
          endTime: viewableInterval.endTimeSecs
        };
        const result = await fetchQcSegmentsByChannelsAndTime(args);
        if (result) {
          qcSegmentVersions = result
            .flatMap(segment => {
              return segment.versionHistory;
            })
            .filter(qcv =>
              doTimeRangesOverlap(
                {
                  startTimeSecs: startTime,
                  endTimeSecs: endTime
                },
                {
                  startTimeSecs: qcv.startTime,
                  endTimeSecs: qcv.endTime
                }
              )
            );
        }
      } else {
        qcSegmentVersions = Object.values(channelQcSegments)
          .map(qcSegment => qcSegment.versionHistory[qcSegment.versionHistory.length - 1])
          .filter(qcv =>
            doTimeRangesOverlap(
              {
                startTimeSecs: startTime,
                endTimeSecs: endTime
              },
              {
                startTimeSecs: qcv.startTime,
                endTimeSecs: qcv.endTime
              }
            )
          );
      }

      const processingMasks = createProcessingMasksFromQCSegmentVersions(
        qcSegmentVersions,
        processingMaskDefinition
      );

      // if no masks are generated return the unmasked channel and the empty array
      if (processingMasks.length === 0) {
        return { processingMasks, channel };
      }
      const maskedChannel = await createMasked(channel, processingMaskDefinition);
      return { processingMasks, channel: maskedChannel };
    },
    [
      effectiveTime,
      fetchProcessingMaskDefinitions,
      fetchQcSegmentsByChannelsAndTime,
      fetchRawChannels,
      processingMaskDefinitionsByChannels,
      qcSegments,
      stationGroup,
      viewableInterval
    ]
  );
}

/**
 * A hook to build a function that creates processing masks based on a UI channel segment
 * Requests the qcSegments, processingMaskDefinitions, and channels from redux state that are needed for the function
 *
 * @returns an async function createProcessingMasks that takes a uiChannelSegment, a processingOperation, and a phaseType
 * @throw errors if processing mask definitions are not loaded
 */
export function useCreateProcessingMasksFromChannelSegment() {
  const createProcessingMasks = useCreateProcessingMasks();
  return React.useCallback(
    async (
      uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>,
      processingOperation: ProcessingOperation,
      phaseType: string
    ) => {
      return createProcessingMasks(
        uiChannelSegment.channelSegmentDescriptor.channel,
        uiChannelSegment.channelSegmentDescriptor.startTime,
        uiChannelSegment.channelSegmentDescriptor.endTime,
        processingOperation,
        phaseType
      );
    },
    [createProcessingMasks]
  );
}
