import type { WaveformTypes } from '@gms/common-model';
import type { TimeRange } from '@gms/common-model/lib/common/types';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import { convertToVersionReference } from '@gms/common-model/lib/faceted';
import { UNFILTERED } from '@gms/common-model/lib/filter/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { unwrapResult } from '@reduxjs/toolkit';
import max from 'lodash/max';
import min from 'lodash/min';
import React, { useEffect, useMemo } from 'react';

import type { UiChannelSegment } from '../../types';
import {
  selectBeamedChannels,
  selectEventBeams,
  selectFilteredChannels,
  selectRawChannels,
  selectUiChannelSegments
} from '../api';
import { getChannelsByNamesTimeRange } from '../api/data/channel/get-channels-by-names-timerange';
import { UIStateError } from '../error-handling/ui-state-error';
import { flattenHistory, handleCanceledRequests } from '../query/async-fetch-util';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useGetSignalDetections } from './signal-detection-hooks';
import { useAllStations } from './station-definition-hooks';
import { useViewableInterval } from './waveform-hooks';

/**
 * Uses a selector to return an array of channels
 *
 * @returns returns an array of channels
 */
export const useChannels = () => {
  const rawChannels = useAppSelector(selectRawChannels);
  const beamedChannels = useAppSelector(selectBeamedChannels);
  return useMemo(() => {
    return [...Object.values(rawChannels), ...Object.values(beamedChannels)];
  }, [rawChannels, beamedChannels]);
};

/**
 * Uses a selector to return an array of raw channels
 *
 * @returns returns an array of channels
 */
export const useRawChannels = () => {
  const rawChannels = useAppSelector(selectRawChannels);
  return useMemo(() => {
    return Object.values(rawChannels);
  }, [rawChannels]);
};

/**
 * Uses a selector to return an array of raw channels and convert them to version references
 *
 * @returns returns an array of channels
 */
export const useRawChannelsVersionReference = () => {
  const rawChannels = useRawChannels();

  return useMemo(() => {
    return Object.values(rawChannels).map(channel => convertToVersionReference(channel, 'name'));
  }, [rawChannels]);
};

/**
 * Uses a selector to return an array of derived channels
 *
 * @returns returns an array of channels
 */
export const useBeamedChannels = () => {
  const beamedChannels = useAppSelector(selectBeamedChannels);
  return useMemo(() => {
    return Object.values(beamedChannels);
  }, [beamedChannels]);
};

/**
 * Uses a selector to return the channel record
 *
 * @returns returns a channel record
 */
export const useUnfilteredChannelsRecord = () => {
  const rawChannels = useAppSelector(selectRawChannels);
  const beamedChannels = useAppSelector(selectBeamedChannels);
  return useMemo(() => {
    return { ...rawChannels, ...beamedChannels };
  }, [rawChannels, beamedChannels]);
};

/**
 * Uses a selector to return all channels from the channel record
 *
 * @returns returns a channel record
 */
export const useAllChannelsRecord = () => {
  const rawChannels = useAppSelector(selectRawChannels);
  const beamedChannels = useAppSelector(selectBeamedChannels);
  const filteredChannels = useAppSelector(selectFilteredChannels);
  return useMemo(() => {
    return { ...rawChannels, ...beamedChannels, ...filteredChannels };
  }, [rawChannels, beamedChannels, filteredChannels]);
};

/**
 * Queries for all channels, without consideration for their visibility
 *
 * Uses the `useGetSignalDetections` hook to get derived channels.
 */
export const useGetChannelsQuery = () => {
  const dispatch = useAppDispatch();
  const [viewableInterval] = useViewableInterval();

  // useGetSignalDetections will populate uiChannelSegments with derived channels
  // so it must be called here to get ALL channels, not just raw
  useGetSignalDetections();

  const history = useAppSelector(state => state.data.queries.getChannelsByNamesTimeRange);

  const allStations = useAllStations();
  const uiChannelSegments = useAppSelector(selectUiChannelSegments);

  const rawChannelNames = useMemo(() => {
    if (!allStations) return [];
    return allStations.flatMap(station => station.allRawChannels.map(channel => channel.name));
  }, [allStations]);

  const derivedChannelNames = useMemo(() => {
    const allChannelsSet = new Set(
      Object.values(uiChannelSegments).flatMap(value => {
        if (!value[UNFILTERED]) return [];
        return value[UNFILTERED].map(
          uiChannelSegment => uiChannelSegment.channelSegment.id.channel.name
        );
      })
    );
    // Unique list of all channel names
    return Array.from(allChannelsSet);
  }, [uiChannelSegments]);

  const eventBeams = useAppSelector(selectEventBeams);
  const eventBeamUiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[] = useMemo(
    () => Object.values(eventBeams).flatMap(value => value),
    [eventBeams]
  );
  const eventBeamChannelNames = useMemo(() => {
    const allChannelsSet = new Set(
      Object.values(eventBeamUiChannelSegments).map(value => value.channelSegment.id.channel.name)
    );
    // Unique list of all channel names
    return Array.from(allChannelsSet);
  }, [eventBeamUiChannelSegments]);

  // Returns the interval extended to include the channels start / end times
  // This is required because event requests can return channels out of the current viewable interval.
  const extendedInterval = useMemo(() => {
    if (!viewableInterval?.startTimeSecs || !viewableInterval?.endTimeSecs) return viewableInterval;
    const flatUiChannelSegments = Object.values(uiChannelSegments)
      .flatMap(filterRecord => Object.values(filterRecord).flatMap(cs => cs))
      .filter(cs => derivedChannelNames.indexOf(cs.channelSegmentDescriptor.channel.name) >= 0);

    // include the {@link UiChannelSegment}s from the event beams
    flatUiChannelSegments.push(...eventBeamUiChannelSegments);

    return flatUiChannelSegments.reduce(
      (interval, cs) => ({
        ...interval,
        startTimeSecs: min([interval.startTimeSecs, cs.channelSegmentDescriptor.startTime]) || null,
        endTimeSecs: max([interval.endTimeSecs, cs.channelSegmentDescriptor.endTime]) || null
      }),
      { ...viewableInterval }
    );
  }, [uiChannelSegments, derivedChannelNames, eventBeamUiChannelSegments, viewableInterval]);

  // !exclude the derived channel names from the collection; those channels were created with the {@link UiChannelFactory}
  const channelNames = useMemo(
    () => [...rawChannelNames, ...eventBeamChannelNames],
    [rawChannelNames, eventBeamChannelNames]
  );

  //! useEffect updates redux state
  useEffect(() => {
    if (viewableInterval.startTimeSecs != null && viewableInterval.endTimeSecs != null) {
      dispatch(
        getChannelsByNamesTimeRange({
          channelNames,
          startTime: viewableInterval.startTimeSecs,
          endTime: viewableInterval.endTimeSecs
        })
      ).catch(error => {
        throw new UIStateError(error);
      });
    }
  }, [dispatch, viewableInterval.startTimeSecs, viewableInterval.endTimeSecs, channelNames]);

  //! useEffect updates redux state
  useEffect(() => {
    const entries = flattenHistory(history);
    if (extendedInterval?.startTimeSecs != null && extendedInterval?.endTimeSecs != null) {
      const cachedChannelNames = entries
        .filter(
          e =>
            extendedInterval.startTimeSecs != null &&
            extendedInterval.endTimeSecs != null &&
            e.arg.startTime >= extendedInterval.startTimeSecs &&
            e.arg.endTime <= extendedInterval.endTimeSecs
        )
        .flatMap(e => e.arg.channelNames);
      const filteredDerivedChannelNames = derivedChannelNames.filter(
        name => cachedChannelNames.indexOf(name) < 0
      );

      dispatch(
        getChannelsByNamesTimeRange({
          channelNames: filteredDerivedChannelNames,
          startTime: extendedInterval.startTimeSecs,
          endTime: extendedInterval.endTimeSecs
        })
      ).catch(error => {
        throw new UIStateError(error);
      });
    }
  }, [
    derivedChannelNames,
    dispatch,
    extendedInterval?.startTimeSecs,
    extendedInterval?.endTimeSecs,
    history
  ]);
};

/**
 * @returns a callback function which may be used to fetch raw channels
 * The callback takes two args, an array of channel version references,
 * and a timeRange corresponding to the time range for which to fetch
 * channel versions (possibly returning multiple channels if the channel changed
 * during that time period)
 */
export function useFetchRawChannels() {
  const dispatch = useAppDispatch();
  return React.useCallback(
    async (
      channels: VersionReference<'name', Channel>[],
      timeRange: TimeRange
    ): Promise<Channel[]> => {
      return dispatch(
        getChannelsByNamesTimeRange({
          channelNames: channels.map(channel => channel.name),
          startTime: timeRange.startTimeSecs,
          endTime: timeRange.endTimeSecs
        })
      )
        .then(handleCanceledRequests(unwrapResult))
        .catch(error => {
          throw new UIStateError(error);
        });
    },
    [dispatch]
  );
}
