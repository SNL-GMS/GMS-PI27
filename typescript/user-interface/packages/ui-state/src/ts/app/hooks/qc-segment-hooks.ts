import type { ChannelSegmentDescriptor } from '@gms/common-model/lib/channel-segment/types';
import type { Faceted } from '@gms/common-model/lib/faceted';
import { convertToVersionReference } from '@gms/common-model/lib/faceted';
import type { QcSegment, QcSegmentType, QcSegmentVersion } from '@gms/common-model/lib/qc-segment';
import { QcSegmentCategory } from '@gms/common-model/lib/qc-segment';
import { epochSecondsNow, uuid4 } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import { UNFILTERED } from '@gms/weavess-core/lib/types';
import { unwrapResult } from '@reduxjs/toolkit';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { batch } from 'react-redux';

import type { QcSegmentRecord } from '../../types';
import { selectUiChannelSegments } from '../api';
import type {
  FindQCSegmentsByChannelAndTimeRangeHistory,
  FindQCSegmentsByChannelAndTimeRangeQueryArgs
} from '../api/data/waveform/find-qc-segments-by-channel-and-time-range';
import {
  findQCSegmentsByChannelAndTimeRange,
  findQCSegmentsByChannelAndTimeRangeQuery
} from '../api/data/waveform/find-qc-segments-by-channel-and-time-range';
import { createQcSegment, updateQcSegment } from '../api/data/waveform/qc-reducer';
import { UIStateError } from '../error-handling/ui-state-error';
import type { AsyncFetchResult, FetchHistoryStatus } from '../query';
import { handleCanceledRequests } from '../query/async-fetch-util';
import { selectChannelFilters } from '../state/waveform/selectors';
import { useRawChannels } from './channel-hooks';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useUsername } from './user-session-hooks';
import { useViewableInterval } from './waveform-hooks';
import { useStageId } from './workflow-hooks';

const logger = UILogger.create('GMS_LOG_QC_SEGMENTS', process.env.GMS_LOG_QC_SEGMENTS);

/**
 * Defines async fetch result for the qc segments by channel history.
 *
 * @see {@link AsyncFetchResult}
 */
export type FindQCSegmentsByChannelAndTimeRangeHistoryFetchResult =
  AsyncFetchResult<FindQCSegmentsByChannelAndTimeRangeHistory>;

/**
 * Defines async fetch result for the qc segments. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type QcSegmentFetchResult = AsyncFetchResult<QcSegmentRecord>;

/**
 * A hook that can be used to return the current history of the qc segments by channel query.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the `getChannelSegmentsByChannel` queries
 *
 * @see {@link FindQCSegmentsByChannelAndTimeRangeHistoryFetchResult}
 *
 * @returns the current history of the qc segments by channel query.
 */
export const useFindQCSegmentsByChannelAndTimeRangeHistory = (): FetchHistoryStatus => {
  const history = useAppSelector(state => state.data.queries.findQCSegmentsByChannelAndTimeRange);
  return useFetchHistoryStatus<FindQCSegmentsByChannelAndTimeRangeQueryArgs>(history);
};

/**
 * @returns the skipped result for the get qc segments by channels query
 */
const useFindQcSegmentsByChannelsSkippedResult = (): QcSegmentFetchResult => {
  const result = React.useRef({
    data: {},
    pending: 0,
    fulfilled: 0,
    rejected: 0,
    isLoading: false,
    isError: false
  });
  return result.current;
};

/**
 * A hook that issues the requests for the qc segments by channels query.
 *
 * @param args the qc segments by channels query arguments
 */
const useFetchQcSegmentsByChannelsAndTimeRangeQuery = (
  args: FindQCSegmentsByChannelAndTimeRangeQueryArgs | undefined
): void => {
  const dispatch = useAppDispatch();
  React.useEffect(() => {
    if (args) {
      dispatch(findQCSegmentsByChannelAndTimeRange(args)).catch(error => {
        throw new UIStateError(error);
      });
    }
  }, [dispatch, args]);
};

/**
 * Helper function that filters a QcSegmentRecord for the provided unique names.
 *
 *
 * @returns a filtered QcSegmentRecord
 */
export const filterQcSegmentsByChannelNames = (
  qcSegments: QcSegmentRecord,
  names: string[]
): QcSegmentRecord => {
  const filteredQcSegments: QcSegmentRecord = {};
  if (names) {
    names.forEach(name => {
      if (qcSegments[name]) {
        filteredQcSegments[name] = qcSegments[name];
      }
    });
  }
  return filteredQcSegments;
};

/**
 * Helper function that filters a QcSegmentRecord for the provided start and end times.
 * channels segments that partially fall within the time range are returned
 *
 *
 * @returns a filtered QcSegmentRecord
 */
const filterQcSegmentsByTime = (
  qcSegments: QcSegmentRecord,
  startTime: number | undefined,
  endTime: number | undefined
): QcSegmentRecord => {
  if (!startTime || !endTime) {
    return qcSegments;
  }
  const filteredQcSegments: QcSegmentRecord = {};
  Object.entries(qcSegments).forEach(channelEntry => {
    const filteredRecord = {};
    Object.entries(channelEntry[1]).forEach(segmentEntry => {
      const [id, qcSegment] = segmentEntry;
      if (
        (qcSegment.versionHistory[qcSegment.versionHistory.length - 1].startTime <= endTime &&
          qcSegment.versionHistory[qcSegment.versionHistory.length - 1].startTime >= startTime) ||
        (qcSegment.versionHistory[qcSegment.versionHistory.length - 1].endTime >= startTime &&
          qcSegment.versionHistory[qcSegment.versionHistory.length - 1].endTime <= endTime)
      ) {
        filteredRecord[id] = qcSegment;
      }
    });
    filteredQcSegments[channelEntry[0]] = filteredRecord;
  });
  return filteredQcSegments;
};

/**
 * A hook that can be used to retrieve qc segments for the current interval and visible channels/stations.
 *
 * @returns the qc segments result.
 */
export const useQcSegments = (
  args: FindQCSegmentsByChannelAndTimeRangeQueryArgs | undefined
): QcSegmentFetchResult => {
  const history = useFindQCSegmentsByChannelAndTimeRangeHistory();

  // issue any new fetch requests
  useFetchQcSegmentsByChannelsAndTimeRangeQuery(args);

  // retrieve all qc segments from the state
  const qcSegments = useAppSelector(state => state.data.qcSegments);
  const skippedReturnValue = useFindQcSegmentsByChannelsSkippedResult();

  const data = React.useMemo(
    () =>
      args
        ? // filter out the qc segments based on the query parameters
          filterQcSegmentsByTime(
            filterQcSegmentsByChannelNames(
              qcSegments,
              args.channels.map(c => c.name)
            ),
            args.startTime,
            args.endTime
          )
        : {},
    [args, qcSegments]
  );

  return React.useMemo(() => {
    if (args && findQCSegmentsByChannelAndTimeRangeQuery.shouldSkip(args)) {
      return skippedReturnValue;
    }

    return { ...history, data };
  }, [args, data, history, skippedReturnValue]);
};

/**
 * Helper hook to set up the params and request the masks for the viewable interval
 *
 * @returns qc masks record
 */
export const useQcMasksForViewableInterval = (): QcSegmentFetchResult => {
  const [viewableInterval] = useViewableInterval();
  const channels = useRawChannels();
  const channelVersionReferences = React.useMemo(
    () => channels.map(channel => convertToVersionReference(channel, 'name')),
    [channels]
  );

  const args = React.useMemo(
    () =>
      viewableInterval.startTimeSecs != null && viewableInterval.endTimeSecs != null
        ? {
            startTime: viewableInterval.startTimeSecs,
            endTime: viewableInterval.endTimeSecs,
            channels: channelVersionReferences
          }
        : undefined,
    [channelVersionReferences, viewableInterval]
  );
  return useQcSegments(args);
};

/**
 * Returns a function that modifies a qc segment
 */
export const useModifyQcSegment = (): ((
  qcSegment: QcSegment,
  startTime: number,
  endTime: number,
  type: QcSegmentType,
  rationale: string
) => void) => {
  const dispatch = useAppDispatch();
  const workflowDefinitionId = useStageId()?.definitionId;
  const user = useUsername();
  return React.useCallback(
    (
      qcSegment: QcSegment,
      startTime: number,
      endTime: number,
      type: QcSegmentType,
      rationale: string
    ): void => {
      const modifiedSegment = cloneDeep(qcSegment);
      const previousVersion: QcSegmentVersion =
        qcSegment.versionHistory[qcSegment.versionHistory.length - 1];
      const newVersion: QcSegmentVersion = {
        ...previousVersion,
        id: { parentQcSegmentId: qcSegment.id, effectiveAt: epochSecondsNow() },
        startTime,
        endTime,
        createdBy: user,
        rationale,
        type,
        stageId: workflowDefinitionId,
        category: QcSegmentCategory.ANALYST_DEFINED
      };
      modifiedSegment.versionHistory.push(newVersion);

      dispatch(updateQcSegment(modifiedSegment));
    },
    [dispatch, user, workflowDefinitionId]
  );
};

/**
 * Returns a function that creates a new QC segment
 * Adds to channel's record if segments are already present
 * Creates new channel record if not
 */
export const useCreateQcSegments = (): ((
  qcSegment: QcSegment,
  startTime: number,
  endTime: number,
  type: QcSegmentType,
  rationale: string
) => void) => {
  const dispatch = useAppDispatch();
  const [viewableInterval] = useViewableInterval();
  const channelFilters = useAppSelector(selectChannelFilters);
  const channelSegments = useAppSelector(selectUiChannelSegments);
  const workflowDefinitionId = useStageId()?.definitionId;
  const user = useUsername();
  const id = uuid4();

  return React.useCallback(
    (
      qcSegment: QcSegment,
      startTime: number,
      endTime: number,
      type: QcSegmentType,
      rationale: string
    ): void => {
      const { channels, category } = qcSegment.versionHistory[qcSegment.versionHistory.length - 1];
      const discoveredOn: Faceted<{
        id: ChannelSegmentDescriptor;
      }>[] = [];
      const newQcSegments: QcSegment[] = [];

      channels.forEach(channel => {
        // get latest filter applied to channel to narrow down channel segments
        let filterName = UNFILTERED;
        if (channelFilters[channel.name] && !channelFilters[channel.name]?.unfiltered) {
          filterName =
            channelFilters[channel.name].namedFilter ||
            channelFilters[channel.name].filterDefinition?.name ||
            UNFILTERED;
        }
        // collect segment descriptors with matching channel name, filter name, start/end time
        try {
          if (channelSegments[channel.name][filterName]) {
            const value = channelSegments[channel.name][filterName].find(
              segment =>
                segment &&
                segment.channelSegmentDescriptor &&
                segment.channelSegmentDescriptor.startTime === viewableInterval.startTimeSecs &&
                segment.channelSegmentDescriptor.endTime === viewableInterval.endTimeSecs
            );
            if (value) {
              discoveredOn.push({
                id: value.channelSegmentDescriptor
              });
            }
          }
        } catch {
          logger.error(`Failed to obtain channel segment descriptor for ${channel.name}`);
        }
      });

      const saveEffectiveAt = epochSecondsNow();
      try {
        channels
          .flatMap(channel => ({
            ...channel,
            effectiveAt: discoveredOn.find(descriptorId =>
              descriptorId.id.channel.name.includes(channel.name)
            )?.effectiveAt
          }))
          .forEach(channel => {
            const newQcSegment: QcSegment = {
              id,
              channel: { name: channel.name },
              versionHistory: [
                {
                  id: { parentQcSegmentId: id, effectiveAt: saveEffectiveAt },
                  startTime,
                  endTime,
                  createdBy: user,
                  rejected: false,
                  rationale,
                  type,
                  discoveredOn,
                  stageId: workflowDefinitionId,
                  category,
                  channels
                }
              ]
            };
            newQcSegments.push(newQcSegment);
          });
        batch(() => {
          newQcSegments.forEach(newQcSegment =>
            dispatch(createQcSegment({ qcSegment: newQcSegment }))
          );
        });
      } catch {
        logger.error(`Failed to obtain effectiveAt time for all selected channels`);
      }
    },
    [
      channelFilters,
      channelSegments,
      dispatch,
      id,
      user,
      viewableInterval.endTimeSecs,
      viewableInterval.startTimeSecs,
      workflowDefinitionId
    ]
  );
};

/**
 * Returns a function that rejects a qc segment
 */
export const useRejectQcSegment = (): ((qcSegment: QcSegment, rationale: string) => void) => {
  const dispatch = useAppDispatch();
  const user = useUsername();
  const workflowDefinitionId = useStageId()?.definitionId;
  return React.useCallback(
    (qcSegment: QcSegment, rationale: string): void => {
      const modifiedSegment = cloneDeep(qcSegment);
      const previousVersion: QcSegmentVersion =
        qcSegment.versionHistory[qcSegment.versionHistory.length - 1];
      const newVersion: QcSegmentVersion = {
        ...previousVersion,
        id: { parentQcSegmentId: qcSegment.id, effectiveAt: epochSecondsNow() },
        createdBy: user,
        rationale,
        type: undefined,
        category: undefined,
        rejected: true,
        stageId: workflowDefinitionId
      };
      modifiedSegment.versionHistory.push(newVersion);
      dispatch(updateQcSegment(modifiedSegment));
    },
    [dispatch, user, workflowDefinitionId]
  );
};

/**
 * @throws if the request fails
 * @returns a callback function that fetches qc segments by channels and time range
 */
export function useFetchQcSegmentsByChannelsAndTimeRange() {
  const dispatch = useAppDispatch();
  return React.useCallback(
    async function fetchQcSegmentsByChannelsAndTimeRange(
      args: FindQCSegmentsByChannelAndTimeRangeQueryArgs
    ): Promise<QcSegment[]> {
      return dispatch(findQCSegmentsByChannelAndTimeRange(args))
        .then(handleCanceledRequests(unwrapResult))
        .catch(e => {
          throw new Error(e);
        });
    },
    [dispatch]
  );
}
