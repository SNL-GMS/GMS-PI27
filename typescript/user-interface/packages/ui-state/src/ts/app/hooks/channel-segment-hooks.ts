import type {
  ChannelTypes,
  SignalDetectionTypes,
  StationTypes,
  TypeUtil,
  WaveformTypes
} from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes, FilterTypes } from '@gms/common-model';
import type { EventHypothesis } from '@gms/common-model/lib/event';
import { UNFILTERED } from '@gms/common-model/lib/filter';
import { getFilterName } from '@gms/common-model/lib/filter/filter-util';
import type { SignalDetectionHypothesis } from '@gms/common-model/lib/signal-detection/types';
import { FeatureMeasurementType } from '@gms/common-model/lib/signal-detection/types';
import { findArrivalTimeFeatureMeasurementUsingSignalDetection } from '@gms/common-model/lib/signal-detection/util';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { UILogger } from '@gms/ui-util';
import type { PriorityRequestConfig } from '@gms/ui-workers';
import type { WeavessTypes } from '@gms/weavess-core';
import { unwrapResult } from '@reduxjs/toolkit';
import produce from 'immer';
import defer from 'lodash/defer';
import flatMap from 'lodash/flatMap';
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import unionWith from 'lodash/unionWith';
import uniq from 'lodash/uniq';
import React, { useCallback, useMemo } from 'react';

import { areUiChannelSegmentChannelSegmentDescriptorsEqual } from '../../type-util';
import type {
  ChannelFilterRecord,
  ChannelSegmentsToSignalDetectionHypothesisRecord,
  UiChannelSegment,
  UIChannelSegmentRecord
} from '../../types';
import type { AppDispatch, UiChannelSegmentByEventHypothesisId } from '..';
import { selectEventBeams, selectRawChannels, selectUiChannelSegments } from '../api';
import type { GetChannelSegmentsByChannelQueryArgs } from '../api/data/waveform/get-channel-segments-by-channel';
import {
  getChannelSegmentsByChannel,
  getChannelSegmentsByChannelQuery,
  usePreCacheChannelSegmentsByChannel
} from '../api/data/waveform/get-channel-segments-by-channel';
import { UIStateError } from '../error-handling/ui-state-error';
import type { AsyncFetchResult, FetchHistoryStatus } from '../query';
import { handleCanceledRequests } from '../query/async-fetch-util';
import {
  analystActions,
  selectPreferredEventHypothesisByStageForOpenEvent,
  selectSelectedWaveforms
} from '../state';
import { selectChannelFilters } from '../state/waveform/selectors';
import { getNamesOfAllDisplayedChannels } from '../state/waveform/util';
import { getChannelNameComponents } from '../util/channel-factory-util';
import { useFetchRawChannels, useRawChannelsVersionReference } from './channel-hooks';
import { useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent } from './event-beams-by-event-hypothesis-and-stations-hooks';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useEffectiveTime } from './operational-time-period-configuration-hooks';
import { useOldQueryDataIfReloading } from './query-util-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import {
  useGetSelectedSdIds,
  useGetSignalDetections,
  useSignalDetectionHypotheses,
  useSignalDetections
} from './signal-detection-hooks';
import { useGetAllStationsQuery } from './station-definition-hooks';
import { useStationsVisibility, useViewableInterval } from './waveform-hooks';

const logger = UILogger.create(
  'GMS_LOG_CHANNEL_SEGMENT_HOOKS',
  process.env.GMS_LOG_CHANNEL_SEGMENT_HOOKS
);

/**
 * Defines async fetch result for the channel segments. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type ChannelSegmentFetchResult = AsyncFetchResult<UIChannelSegmentRecord>;

/**
 * Helper function that filters a UIChannelSegmentRecord for the provided unique names.
 *
 *
 * @returns a filtered UIChannelSegmentRecord
 */
const filterChannelSegmentsByNames = (
  channelSegments: UIChannelSegmentRecord,
  names: string[]
): UIChannelSegmentRecord => {
  const filteredChannelSegments: UIChannelSegmentRecord = {};
  if (names) {
    names.forEach(name => {
      if (channelSegments[name]) {
        filteredChannelSegments[name] = channelSegments[name];
      }
    });
  }
  return filteredChannelSegments;
};

/**
 * Helper function that filters a UIChannelSegmentRecord for the provided start and end times.
 * channels segments that partially fall within the time range are returned
 *
 *
 * @returns a filtered UIChannelSegmentRecord
 */
const filterChannelSegmentsByTime = (
  channelSegments: UIChannelSegmentRecord,
  startTime: number | null,
  endTime: number | null
): UIChannelSegmentRecord => {
  if (!startTime || !endTime) {
    return channelSegments;
  }
  const filteredChannelSegments: UIChannelSegmentRecord = {};
  Object.entries(channelSegments).forEach(channelEntry => {
    const filteredRecord = {};
    Object.entries(channelEntry[1]).forEach(typeEntry => {
      filteredRecord[typeEntry[0]] = typeEntry[1].filter(
        channelSegment =>
          channelSegment.channelSegmentDescriptor.startTime <= endTime &&
          channelSegment.channelSegmentDescriptor.endTime >= startTime
      );
    });
    filteredChannelSegments[channelEntry[0]] = filteredRecord;
  });
  return filteredChannelSegments;
};

/**
 * A hook that can be used to return the current history of the channel segments by channel query.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the `getChannelSegmentsByChannel` queries
 *
 * @returns the current history of the channel segments by channel query.
 */
const useGetChannelSegmentsByChannelHistory = (): FetchHistoryStatus => {
  const history = useAppSelector(state => state.data.queries.getChannelSegmentsByChannel);
  return useFetchHistoryStatus<GetChannelSegmentsByChannelQueryArgs>(history);
};

/**
 * @returns the skipped result for the get channel segments by channels query
 */
const useGetChannelSegmentsByChannelsSkippedResult = (): ChannelSegmentFetchResult => {
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
 * A hook that can be used to retrieve channel segments by channels.
 * Makes an individual async request for each channel.
 *
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the channel segments from all requests
 *
 * ! the returned results are filtered so that the results only match what the query args requested
 *
 * @param args the channel segments by channels query arguments
 *
 * @returns the channel segments fetch result.
 */
export const useGetChannelSegmentsByChannels = (
  args: GetChannelSegmentsByChannelQueryArgs
): ChannelSegmentFetchResult => {
  const history = useGetChannelSegmentsByChannelHistory();

  // retrieve all channel segments from the state
  const channelSegments = useAppSelector(selectUiChannelSegments);
  const skippedReturnValue = useGetChannelSegmentsByChannelsSkippedResult();

  const data = React.useMemo(() => {
    if (args.startTime && args.endTime) {
      // filter out the channel segments based on the query parameters
      return filterChannelSegmentsByTime(
        filterChannelSegmentsByNames(
          channelSegments,
          args.channels.map(c => c.name)
        ),
        args.startTime,
        args.endTime
      );
    }
    return {};
  }, [args, channelSegments]);

  return React.useMemo(() => {
    if (getChannelSegmentsByChannelQuery.shouldSkip(args)) {
      return skippedReturnValue;
    }
    return { ...history, data };
  }, [args, data, history, skippedReturnValue]);
};

/**
 * A hook to pre cache channel segments for all channels
 *
 * @param viewableInterval
 */
export const useCacheChannelSegmentsByChannels = (
  viewableInterval: CommonTypes.TimeRange
): void => {
  const channels = useRawChannelsVersionReference();
  const effectiveAt = useEffectiveTime();
  const stationsVisibility = useStationsVisibility();

  const args = React.useMemo(() => {
    const updatedChannels = channels.map(channelName => {
      return {
        name: channelName.name,
        effectiveAt
      };
    });
    return {
      channels: updatedChannels,
      startTime: viewableInterval?.startTimeSecs,
      endTime: viewableInterval?.endTimeSecs
    };
  }, [channels, effectiveAt, viewableInterval]);

  const getPreCachePriority = React.useCallback(
    (requestConfig: PriorityRequestConfig<GetChannelSegmentsByChannelQueryArgs>) => {
      const visible = requestConfig.data
        ? requestConfig.data.channels.some(channel =>
            stationsVisibility.isStationVisible(channel.name.split('.')?.[0])
          )
        : false;
      return visible ? 0 : Number.MIN_SAFE_INTEGER;
    },
    [stationsVisibility]
  );

  const preCacheChannelSegmentsByChannel = usePreCacheChannelSegmentsByChannel();

  React.useEffect(() => {
    if (!getChannelSegmentsByChannelQuery.shouldSkip(args)) {
      defer(() => {
        preCacheChannelSegmentsByChannel(args, getPreCachePriority).catch(error => {
          throw new UIStateError(error);
        });
      });
    }
    // ! only re-query if the args change: channels, effectiveAt, viewableInterval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args]);
};

/**
 * A hook that can be used to retrieve channel segments for the signal detections
 * that were received by stations and time.
 *
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the channel segments from all requests
 *
 * ! the returned results are filtered so that the results only match what the query args requested
 *
 * @param args the channel segments by channels query arguments
 *
 * @returns the channel segments fetch result.
 */
export const useGetChannelSegmentsForSignalDetections = (
  interval: TypeUtil.Nullable<CommonTypes.TimeRange>
): ChannelSegmentFetchResult => {
  const signalDetections = useGetSignalDetections();
  const channelSegments = useAppSelector(selectUiChannelSegments);

  // get the unique station names for each signal detection
  const stations: string[] = React.useMemo(
    () => flatMap((signalDetections?.data || []).map(sd => sd.station.name)),
    [signalDetections.data]
  );

  // filter out out the channel segments for stations and out of interval segments
  const data = React.useMemo(
    () =>
      filterChannelSegmentsByTime(
        filterChannelSegmentsByNames(channelSegments, stations),
        interval?.startTimeSecs,
        interval?.endTimeSecs
      ),
    [channelSegments, stations, interval]
  );

  const status = React.useMemo(
    () => ({
      fulfilled: signalDetections.fulfilled,
      isError: signalDetections.isError,
      isLoading: signalDetections.isLoading,
      pending: signalDetections.pending,
      rejected: signalDetections.rejected
    }),
    [
      signalDetections.fulfilled,
      signalDetections.isError,
      signalDetections.isLoading,
      signalDetections.pending,
      signalDetections.rejected
    ]
  );

  return React.useMemo(() => {
    return {
      ...status,
      data
    };
  }, [status, data]);
};

/**
 * A hook that can be used to retrieve query arguments based on the current state.
 * Accounts for the current interval and visible stations.
 *
 * @returns the channel segments by channels query args.
 */
export const useQueryArgsForGetChannelSegmentsByChannels =
  (): GetChannelSegmentsByChannelQueryArgs => {
    const effectiveAt = useEffectiveTime();
    const stationsQuery = useGetAllStationsQuery(effectiveAt);
    const stationData = useOldQueryDataIfReloading<StationTypes.Station[]>(stationsQuery);
    const [viewableInterval] = useViewableInterval();
    const stationsVisibility = useAppSelector(state => state.app.waveform.stationsVisibility);

    const channels = React.useMemo(
      () =>
        getNamesOfAllDisplayedChannels(stationsVisibility, stationData || []).map(channelName => {
          return {
            name: channelName,
            effectiveAt
          };
        }),
      [stationsVisibility, stationData, effectiveAt]
    );

    return React.useMemo(
      () => ({
        channels,
        startTime: viewableInterval?.startTimeSecs,
        endTime: viewableInterval?.endTimeSecs
      }),
      [channels, viewableInterval]
    );
  };

/**
 * Merges in event beams to the given ui channel segment record.
 * @param uiChannelSegmentRecord the base uiChannelSegmentRecord to add event beams into
 * @param preferredEventHypothesis the preferred in stage hypothesis for the currently open event
 * @param eventBeams the event beams
 * @returns new uiChannelSegmentRecord with event beams
 */
function mergeUiChannelSegmentRecordWithEventBeams(
  uiChannelSegmentRecord: UIChannelSegmentRecord,
  preferredEventHypothesis?: EventHypothesis,
  eventBeams?: UiChannelSegmentByEventHypothesisId
): UIChannelSegmentRecord {
  return produce(uiChannelSegmentRecord || {}, draft => {
    if (preferredEventHypothesis?.id.hypothesisId) {
      eventBeams?.[preferredEventHypothesis.id.hypothesisId]?.forEach(
        (eventBeam: UiChannelSegment<WaveformTypes.Waveform>) => {
          const { stationName } = getChannelNameComponents(
            eventBeam.channelSegmentDescriptor.channel.name
          );

          if (draft?.[stationName]?.[UNFILTERED] == null) {
            // There may be filtered beams in the uiChannelSegmentRecord, the destructure copy accounts for that
            draft[stationName] = { ...draft[stationName], [UNFILTERED]: [] };
          }

          // Add the unfiltered event beam to the uiChannelSegmentRecord
          draft[stationName] = {
            ...draft[stationName],
            [UNFILTERED]: draft[stationName][UNFILTERED].concat(eventBeam)
          };
        }
      );
    }
  });
}

/**
 * A hook that can be used to retrieve channel segments including event beams for the current
 * interval and visible channels/stations.
 *
 * @returns the channel segments fetch results including event beams
 */
export const useGetChannelSegments = (
  interval: TypeUtil.Nullable<CommonTypes.TimeRange>
): ChannelSegmentFetchResult => {
  const channelArgs = useQueryArgsForGetChannelSegmentsByChannels();
  const channelSegmentsResult = useGetChannelSegmentsByChannels(channelArgs);
  const channelSegmentsForSdsResult = useGetChannelSegmentsForSignalDetections(interval);
  const eventBeams = useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent();

  const preferredEventHypothesis = useAppSelector(
    selectPreferredEventHypothesisByStageForOpenEvent
  );

  return React.useMemo(() => {
    const channelSegmentsResultData = channelSegmentsResult?.data || {};
    const channelSegmentsForSdsResultData = channelSegmentsForSdsResult?.data || {};

    const data = mergeUiChannelSegmentRecordWithEventBeams(
      merge(channelSegmentsResultData, channelSegmentsForSdsResultData),
      preferredEventHypothesis,
      eventBeams?.data
    );

    // combine the data (channel segments) and statuses from both results
    return {
      pending:
        channelSegmentsResult.pending + channelSegmentsForSdsResult.pending + eventBeams.pending,
      fulfilled:
        channelSegmentsResult.fulfilled +
        channelSegmentsForSdsResult.fulfilled +
        eventBeams.fulfilled,
      rejected:
        channelSegmentsResult.rejected + channelSegmentsForSdsResult.rejected + eventBeams.rejected,
      isLoading:
        channelSegmentsResult.isLoading ||
        channelSegmentsForSdsResult.isLoading ||
        eventBeams.isLoading,
      isError:
        channelSegmentsResult.isError || channelSegmentsForSdsResult.isError || eventBeams.isError,
      data
    };
  }, [channelSegmentsResult, channelSegmentsForSdsResult, eventBeams, preferredEventHypothesis]);
};

/**
 * This hook will return all the uiChannelSegments in the data slice, combined with event beams.
 * @returns memoized result of combining the uiChannelSegments with event beams
 */
export const useUiChannelSegmentsWithEventBeams = () => {
  const uiChannelSegmentsRecord: UIChannelSegmentRecord = useAppSelector(selectUiChannelSegments);
  const eventBeams = useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent();
  const preferredEventHypothesis = useAppSelector(
    selectPreferredEventHypothesisByStageForOpenEvent
  );
  return React.useMemo(() => {
    return mergeUiChannelSegmentRecordWithEventBeams(
      uiChannelSegmentsRecord,
      preferredEventHypothesis,
      eventBeams?.data
    );
  }, [eventBeams?.data, preferredEventHypothesis, uiChannelSegmentsRecord]);
};

/**
 * Creates a memoized UIChannelSegmentRecord that only contains channel segments within the viewable interval
 * (if any sample of the segment is within range) and event beams.
 */
export const useVisibleChannelSegments = (): UIChannelSegmentRecord => {
  const [viewableInterval] = useViewableInterval();
  const uiChannelSegmentsRecord: UIChannelSegmentRecord = useAppSelector(selectUiChannelSegments);
  const eventBeams = useAppSelector(selectEventBeams);
  const preferredEventHypothesis = useAppSelector(
    selectPreferredEventHypothesisByStageForOpenEvent
  );
  return React.useMemo(() => {
    if (!viewableInterval) return {};
    const visibleChannelSegments = Object.entries(uiChannelSegmentsRecord).reduce(
      (chanWithinRange, [channelName, filterChanSegRecord]) => {
        const filterList = Object.entries(filterChanSegRecord).reduce(
          (csWithinRange, [filterName, chanSegs]) => {
            const chanSegmentsWithinInterval = chanSegs.filter(
              cs =>
                viewableInterval.startTimeSecs &&
                viewableInterval.endTimeSecs &&
                ((cs.channelSegmentDescriptor.startTime >= viewableInterval.startTimeSecs &&
                  cs.channelSegmentDescriptor.startTime <= viewableInterval.endTimeSecs) ||
                  (cs.channelSegmentDescriptor.endTime >= viewableInterval.startTimeSecs &&
                    cs.channelSegmentDescriptor.endTime <= viewableInterval.endTimeSecs))
            );
            return { ...csWithinRange, [filterName]: chanSegmentsWithinInterval };
          },
          {}
        );
        return { ...chanWithinRange, [channelName]: filterList };
      },
      {}
    );

    return mergeUiChannelSegmentRecordWithEventBeams(
      visibleChannelSegments,
      preferredEventHypothesis,
      eventBeams
    );
  }, [eventBeams, preferredEventHypothesis, uiChannelSegmentsRecord, viewableInterval]);
};

/**
 * Generates a memoized record of channel segment descriptor strings to signal detection hypothesis id
 *
 * @returns a record of channel segment descriptor strings to signal detection hypothesis id
 */
export const useChannelSegmentsToSignalDetectionHypothesis =
  (): ChannelSegmentsToSignalDetectionHypothesisRecord => {
    const signalDetectionHypotheses: SignalDetectionHypothesis[] = useSignalDetectionHypotheses();

    return useMemo(() => {
      const result = {};
      signalDetectionHypotheses.forEach(signalDetectionHypothesis => {
        const fm = signalDetectionHypothesis.featureMeasurements.find(
          featureMeasurement =>
            featureMeasurement.featureMeasurementType === FeatureMeasurementType.ARRIVAL_TIME
        );

        // If signal detections are created from the ui they might not have a measuredChannelSegment
        if (fm?.analysisWaveform?.waveform) {
          result[
            ChannelSegmentTypes.Util.createChannelSegmentString(fm.analysisWaveform.waveform.id)
          ] = signalDetectionHypothesis.id.id;
        }
      });

      return result;
    }, [signalDetectionHypotheses]);
  };

/**
 * Hook that returns an array of visible uiChannelSegments
 *
 * @returns function that will find an array of uiChannelSegments by the station, and a time
 */
export const useGetVisibleChannelSegmentsByStationAndTime = () => {
  const uiChannelSegmentsRecord = useVisibleChannelSegments();
  const channelFilters: ChannelFilterRecord = useAppSelector(selectChannelFilters);

  return useCallback(
    (stationId: string, timeSecs: number): UiChannelSegment<WaveformTypes.Waveform>[] => {
      const filterName = getFilterName(channelFilters?.[stationId], UNFILTERED);

      return (
        uiChannelSegmentsRecord?.[stationId]?.[filterName]?.filter(
          cs =>
            timeSecs >= cs.channelSegmentDescriptor.startTime &&
            timeSecs <= cs.channelSegmentDescriptor.endTime
        ) || []
      );
    },
    [uiChannelSegmentsRecord, channelFilters]
  );
};

/**
 * Helper function to handle case of measure window waveform selection
 * Can only deselect waveforms in measure window
 * Reduces code complexity
 *
 * @param dispatch
 * @param uiChannelSegments
 * @param selectedWaveforms
 */
const updateMeasureWindowWaveformSelection = (
  dispatch: AppDispatch,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[],
  selectedChannelSegment: ChannelSegmentTypes.ChannelSegmentDescriptor
): void => {
  // deselect if no overlap
  if (
    uiChannelSegments.length === 1 &&
    ChannelSegmentTypes.Util.isSelectedWaveform(selectedChannelSegment, selectedWaveforms)
  ) {
    dispatch(analystActions.setSelectedSdIds([]));
    dispatch(analystActions.setSelectedWaveforms([]));
  }
  // check for overlap, deselect if an overlapping waveform is selected
  if (uiChannelSegments.length > 1) {
    let i = 0;
    while (i < uiChannelSegments.length) {
      const channelSegmentDescriptor =
        uiChannelSegments[i].channelSegment?._uiConfiguredInput ||
        uiChannelSegments[i].channelSegmentDescriptor;
      if (
        ChannelSegmentTypes.Util.isSelectedWaveform(channelSegmentDescriptor, selectedWaveforms)
      ) {
        dispatch(analystActions.setSelectedWaveforms([]));
        break;
      }
      i += 1;
    }
  }
};

/**
 * Helper function to collect associated SDs to be selected/deselected upon waveform single selection
 * exported for testing
 */
export const collectSdIdsToSingleSelect = (
  selectedChannelSegment: ChannelSegmentTypes.ChannelSegmentDescriptor,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[]
): string[] => {
  let sdIdsToSelect: string[] = [];
  if (ChannelSegmentTypes.Util.isSelectedWaveform(selectedChannelSegment, selectedWaveforms)) {
    return sdIdsToSelect;
  }
  let i = 0;
  while (i < signalDetections.length) {
    const arrivalTimeFm = findArrivalTimeFeatureMeasurementUsingSignalDetection(
      signalDetections[i]
    );
    if (
      arrivalTimeFm.analysisWaveform &&
      isEqual(arrivalTimeFm.analysisWaveform.waveform.id, selectedChannelSegment)
    ) {
      sdIdsToSelect = [signalDetections[i].id];
      break;
    }
    i += 1;
  }
  return sdIdsToSelect;
};

/**
 * Helper function to collect associated SDs to be selected/deselected upon waveform single selection
 * exported for testing
 */
export const collectSdIdsToMultiSelect = (
  channelSegment: ChannelSegmentTypes.ChannelSegmentDescriptor,
  selectedSdIds: string[],
  signalDetections: SignalDetectionTypes.SignalDetection[]
): string[] => {
  let sdIdsToSelect: string[] = [...selectedSdIds];
  signalDetections.forEach(sd => {
    const arrivalTimeFm = findArrivalTimeFeatureMeasurementUsingSignalDetection(sd);
    if (arrivalTimeFm?.analysisWaveform?.waveform.id) {
      if (isEqual(arrivalTimeFm.analysisWaveform.waveform.id, channelSegment)) {
        if (!sdIdsToSelect.includes(sd.id)) {
          sdIdsToSelect.push(sd.id);
        } else {
          sdIdsToSelect = sdIdsToSelect.filter(sdId => sdId !== sd.id);
        }
      }
    }
  });
  return sdIdsToSelect;
};

/**
 * Helper function to collect associated SDs to be selected/deselected upon waveform single selection
 * exported for testing
 */
export const collectWaveformsToSingleSelect = (
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[],
  selectedChannelSegment: ChannelSegmentTypes.ChannelSegmentDescriptor
): ChannelSegmentTypes.ChannelSegmentDescriptor[] => {
  let waveformsToSelect: ChannelSegmentTypes.ChannelSegmentDescriptor[] = [];
  if (!ChannelSegmentTypes.Util.isSelectedWaveform(selectedChannelSegment, selectedWaveforms)) {
    waveformsToSelect = [selectedChannelSegment];
  }
  return waveformsToSelect;
};

/**
 * Helper function to collect associated SDs to be selected/deselected upon waveform single selection
 * exported for testing
 */
export const collectWaveformsToMultiSelect = (
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[],
  selectedChannelSegment: ChannelSegmentTypes.ChannelSegmentDescriptor
): ChannelSegmentTypes.ChannelSegmentDescriptor[] => {
  let waveformsToSelect: ChannelSegmentTypes.ChannelSegmentDescriptor[] = [];
  if (ChannelSegmentTypes.Util.isSelectedWaveform(selectedChannelSegment, selectedWaveforms)) {
    waveformsToSelect = selectedWaveforms.filter(wf => wf !== selectedChannelSegment);
  } else {
    waveformsToSelect = [...selectedWaveforms, selectedChannelSegment];
  }
  return waveformsToSelect;
};

/**
 * Hook to obtain and update selected waveforms and associated SDs in the waveform display
 */
export const useSelectedWaveforms = (): [
  ChannelSegmentTypes.ChannelSegmentDescriptor[],
  (
    stationId: string,
    timeSecs: number,
    channelSegments: WeavessTypes.ChannelSegment[],
    signalDetections: SignalDetectionTypes.SignalDetection[],
    isMultiSelect: boolean,
    isMeasureWindow?: boolean
  ) => Promise<void>
] => {
  const dispatch = useAppDispatch();
  const getVisibleChannelSegmentsByStationAndTime = useGetVisibleChannelSegmentsByStationAndTime();
  const selectedWaveforms = useAppSelector(selectSelectedWaveforms);
  const selectedSdIds = useGetSelectedSdIds();

  const updateSelectedWaveforms = React.useCallback(
    async (
      stationId: string,
      timeSecs: number,
      channelSegments: WeavessTypes.ChannelSegment[],
      signalDetections: SignalDetectionTypes.SignalDetection[],
      isMultiSelect: boolean,
      isMeasureWindow?: boolean
    ): Promise<void> => {
      const configuredChannelSegmentDescriptors = channelSegments.map(cs =>
        JSON.parse(cs.configuredInputName)
      );
      const selectedUiChannelSegments = getVisibleChannelSegmentsByStationAndTime(
        stationId,
        timeSecs
      ).filter(uiChannelSegment => {
        if (
          channelSegments?.length &&
          uiChannelSegment.channelSegment.id.startTime <= timeSecs &&
          uiChannelSegment.channelSegment.id.endTime >= timeSecs
        ) {
          return (
            ChannelSegmentTypes.Util.isSelectedWaveform(
              uiChannelSegment.channelSegment.id,
              configuredChannelSegmentDescriptors
            ) ||
            (uiChannelSegment.channelSegment._uiConfiguredInput &&
              ChannelSegmentTypes.Util.isSelectedWaveform(
                uiChannelSegment.channelSegment._uiConfiguredInput,
                configuredChannelSegmentDescriptors
              ))
          );
        }
        return false;
      });

      // 0 indicates no waveform clicked
      if (selectedUiChannelSegments.length > 0) {
        /*
          We must save the unfiltered channel segment string in all cases. Signal detections are selected
          by the analysis waveform (unfiltered channel segment) and to maintain waveform selection while
          filtering, we also need the unfiltered channel segment string (configured input).
        */
        const configuredInputChannelSegment =
          selectedUiChannelSegments[0].channelSegment?._uiConfiguredInput ||
          selectedUiChannelSegments[0].channelSegmentDescriptor;
        if (isMeasureWindow) {
          updateMeasureWindowWaveformSelection(
            dispatch,
            selectedUiChannelSegments,
            selectedWaveforms,
            configuredInputChannelSegment
          );
          // default channel or split channel (no overlap); should never be > 1
        } else if (selectedUiChannelSegments.length === 1) {
          let sdIdsToSelect: string[] = [];
          let waveformsToSelect: ChannelSegmentTypes.ChannelSegmentDescriptor[] = [];
          if (!isMultiSelect) {
            sdIdsToSelect = collectSdIdsToSingleSelect(
              configuredInputChannelSegment,
              signalDetections,
              selectedWaveforms
            );
            waveformsToSelect = collectWaveformsToSingleSelect(
              selectedWaveforms,
              configuredInputChannelSegment
            );
          } else {
            sdIdsToSelect = collectSdIdsToMultiSelect(
              configuredInputChannelSegment,
              selectedSdIds,
              signalDetections
            );
            waveformsToSelect = collectWaveformsToMultiSelect(
              selectedWaveforms,
              configuredInputChannelSegment
            );
          }

          await new Promise<void>(() => {
            dispatch(analystActions.setSelectedWaveforms(waveformsToSelect));
            dispatch(analystActions.setSelectedSdIds(sdIdsToSelect));
          });
        }
      }
    },
    [dispatch, getVisibleChannelSegmentsByStationAndTime, selectedSdIds, selectedWaveforms]
  );
  return [selectedWaveforms, updateSelectedWaveforms];
};

/**
 * Create a callback that fetches channel segments when given channels.
 * optional time range parameter constrains the request to channel segments
 * with the range provided. Defaults to the viewable interval.
 *
 * @throws if no timeRange is given and no viewable interval is available
 * or if timeRange given is invalid
 *
 * @returns a callback function that will fetch and return channel segments
 * for the provided channels and time range
 */
export function useFetchUiChannelSegmentsForChannelTimeRange() {
  const dispatch = useAppDispatch();
  const [viewableInterval] = useViewableInterval();
  return React.useCallback(
    async (
      channels: Channel[],
      timeRange = viewableInterval
    ): Promise<UiChannelSegment<WaveformTypes.Waveform>[] | undefined> => {
      CommonTypes.Util.validateTimeRange(timeRange);
      return dispatch(
        getChannelSegmentsByChannel({
          channels,
          endTime: timeRange.endTimeSecs,
          startTime: timeRange.startTimeSecs
        })
      )
        .then(handleCanceledRequests(unwrapResult))
        .catch(e => {
          throw new Error(e);
        });
    },
    [dispatch, viewableInterval]
  );
}

/**
 * Create a callback to get the uiChannelSegments for all raw channels
 *
 * @returns a callback that returns unfiltered ui channel segments. Will fetch them if they
 * are not found for the raw channels in the redux store
 */
export function useGetRawUnfilteredUiChannelSegments() {
  const rawChannelsRecord = useAppSelector(selectRawChannels);
  const uiChannelSegmentsRecord = useAppSelector(selectUiChannelSegments);
  const fetchRawChannels = useFetchRawChannels();
  return useCallback(async () => {
    let rawUiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[] = [];
    await Promise.all(
      Object.values(uiChannelSegmentsRecord).map(async channelSegmentRecord => {
        if (
          channelSegmentRecord?.Unfiltered?.length > 0 &&
          rawChannelsRecord[
            channelSegmentRecord?.Unfiltered[0].channelSegmentDescriptor.channel.name
          ]
        ) {
          rawUiChannelSegments = rawUiChannelSegments.concat(channelSegmentRecord.Unfiltered);
        } else if (
          !rawChannelsRecord[
            channelSegmentRecord?.Unfiltered[0].channelSegmentDescriptor.channel.name
          ]
        ) {
          await fetchRawChannels(
            [channelSegmentRecord?.Unfiltered[0].channelSegmentDescriptor.channel],
            {
              startTimeSecs: channelSegmentRecord?.Unfiltered[0].channelSegmentDescriptor.startTime,
              endTimeSecs: channelSegmentRecord?.Unfiltered[0].channelSegmentDescriptor.endTime
            }
          ).catch(e => logger.error(e));
        }
      })
    ).catch(e => logger.error(e));
    return rawUiChannelSegments;
  }, [fetchRawChannels, rawChannelsRecord, uiChannelSegmentsRecord]);
}

/**
 * Hook that returns a function to set selected waveforms, by providing an array of
 * channel segment descriptors.
 *
 * @returns a callback function to set selected waveforms which accepts a list of channel
 * segment descriptors
 */
export const useSetSelectedWaveformsByChannelSegmentDescriptorIds = () => {
  const dispatch = useAppDispatch();

  const uiChannelSegments = useUiChannelSegmentsWithEventBeams();
  const allSignalDetections = useSignalDetections();

  return React.useCallback(
    (selectedChannelSegmentDescriptorIds: string[]) => {
      const uniqueIds = uniq(selectedChannelSegmentDescriptorIds);

      let selectedChannelSegmentDescriptors: ChannelSegmentTypes.ChannelSegmentDescriptor[] = [];
      let selectedSignalDetectionIds: string[] = [];

      // Only run the expensive checks when required
      if (uniqueIds.length > 0) {
        const flatUiChannelSegments = Object.values(uiChannelSegments).flatMap(filterRecord =>
          Object.values(filterRecord).flatMap(cs => cs)
        );

        selectedChannelSegmentDescriptors = flatUiChannelSegments.reduce<
          ChannelSegmentTypes.ChannelSegmentDescriptor[]
        >((results, uiChannelSegment) => {
          if (
            uniqueIds.includes(
              ChannelSegmentTypes.Util.createChannelSegmentString(
                uiChannelSegment.channelSegmentDescriptor
              )
            )
          ) {
            return [...results, uiChannelSegment.channelSegmentDescriptor];
          }

          return results;
        }, []);

        selectedSignalDetectionIds = Object.values(allSignalDetections)
          .filter(signalDetection => {
            const arrivalTimeFm =
              findArrivalTimeFeatureMeasurementUsingSignalDetection(signalDetection);
            const channelSegmentDescriptor = arrivalTimeFm.analysisWaveform?.waveform?.id;

            return (
              channelSegmentDescriptor != null &&
              uniqueIds.includes(
                ChannelSegmentTypes.Util.createChannelSegmentString(channelSegmentDescriptor)
              )
            );
          })
          .map(signalDetection => signalDetection.id);
      }

      dispatch(analystActions.setSelectedWaveforms(selectedChannelSegmentDescriptors));
      dispatch(analystActions.setSelectedSdIds(selectedSignalDetectionIds));
    },
    [allSignalDetections, dispatch, uiChannelSegments]
  );
};

/**
 * Create a callback to get the raw {@link UiChannelSegment}s for a provided
 * fully-populated station.
 *
 * @returns callback that returns unfiltered UIChannelSegments for a given station.
 */
export function useGetStationRawUnfilteredUiChannelSegments(): (
  station: StationTypes.Station
) => Promise<Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>> {
  const fetchUiChannelSegments = useFetchUiChannelSegmentsForChannelTimeRange();
  const uiChannelSegments = useAppSelector(selectUiChannelSegments);

  return React.useCallback(
    async (station: StationTypes.Station) => {
      // request all channels not just selected ones to properly hit precache
      const fetchedChannelSegments = await fetchUiChannelSegments(station.allRawChannels);

      const stationAllRawChannelSegments: Record<
        ChannelTypes.Channel['name'],
        UiChannelSegment<WaveformTypes.Waveform>[]
      > = {};
      station.allRawChannels.forEach(rawChannel => {
        const fetchedRawChannelSegments = fetchedChannelSegments?.filter(
          uiCS => uiCS.channelSegmentDescriptor.channel.name === rawChannel.name
        );

        const existingUiCS = uiChannelSegments[rawChannel.name]?.[FilterTypes.UNFILTERED];

        const allRawSegmentsForChannel = unionWith<UiChannelSegment<WaveformTypes.Waveform>>(
          fetchedRawChannelSegments ?? [],
          existingUiCS,
          areUiChannelSegmentChannelSegmentDescriptorsEqual
        );

        stationAllRawChannelSegments[rawChannel.name] = allRawSegmentsForChannel;
      });

      return stationAllRawChannelSegments;
    },
    [fetchUiChannelSegments, uiChannelSegments]
  );
}
