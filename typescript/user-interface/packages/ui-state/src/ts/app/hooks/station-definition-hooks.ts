import { FacetedTypes, type StationTypes } from '@gms/common-model';
import flatMap from 'lodash/flatMap';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import React from 'react';

import { useGetProcessingStationGroupNamesConfigurationQuery } from '../api/processing-configuration';
import type { StationQuery } from '../api/station-definition';
import {
  useGetStationGroupsByNamesQuery,
  useGetStationsQuery,
  useGetStationsWithChannelsQuery
} from '../api/station-definition';
import { useEffectiveTime } from './operational-time-period-configuration-hooks';
import { useOldQueryDataIfReloading } from './query-util-hooks';
import { useAppSelector } from './react-redux-hooks';
import { useGetVisibleStationsFromStationList } from './waveform-hooks';

/**
 * Queries for provided effective time and station group names, query for all stations.
 *
 * Uses the `useGetStationsQuery` query hook.
 *
 * @returns returns the station query result
 */
const useGetStationGroupsAndGetStationQuery = (
  effectiveTime: number,
  stationGroupNames: string[]
): StationQuery => {
  const stationGroupsByNamesQuery = useGetStationGroupsByNamesQuery({
    effectiveTime,
    stationGroupNames
  });

  // If there are station groups get unique sorted list of station names
  const stationNames = React.useMemo(() => {
    const stationGroups = stationGroupsByNamesQuery.data;
    return sortBy(uniq(flatMap((stationGroups || []).map(x => x.stations.map(y => y.name)))));
  }, [stationGroupsByNamesQuery.data]);

  return useGetStationsQuery({ effectiveTime, stationNames });
};

/**
 * Queries for provided effective time, query for all stations for the configured station groups.
 *
 * Uses the `useGetStationsQuery` query hook.
 *
 * @returns returns the station query result
 */
export const useGetAllStationsQuery = (effectiveTime: number): StationQuery => {
  const processingStationGroupNamesConfiguration =
    useGetProcessingStationGroupNamesConfigurationQuery();
  const stationGroupNames = React.useMemo(
    () => sortBy(processingStationGroupNamesConfiguration.data?.stationGroupNames ?? []),
    [processingStationGroupNamesConfiguration.data?.stationGroupNames]
  );
  return useGetStationGroupsAndGetStationQuery(effectiveTime, stationGroupNames);
};

/**
 * Queries for provided effective time, query for all stations for the configured station groups.
 *
 * Uses the `useGetStationsQuery` query hook.
 *
 * @returns returns the station query result
 */
export const useGetAllStationsWithChannelsQuery = (effectiveTime: number): StationQuery => {
  const processingStationGroupNamesConfiguration =
    useGetProcessingStationGroupNamesConfigurationQuery();
  const stationGroupNames = React.useMemo(
    () => sortBy(processingStationGroupNamesConfiguration.data?.stationGroupNames ?? []),
    [processingStationGroupNamesConfiguration.data?.stationGroupNames]
  );
  const stationGroupsByNamesQuery = useGetStationGroupsByNamesQuery({
    effectiveTime,
    stationGroupNames
  });
  const stationNames = React.useMemo(
    () =>
      sortBy(uniq(flatMap(stationGroupsByNamesQuery.data?.map(x => x.stations.map(y => y.name))))),
    [stationGroupsByNamesQuery.data]
  );
  return useGetStationsWithChannelsQuery({ effectiveTime, stationNames });
};

/**
 * Uses all stations query and visible stations list hooks to return an array of stations visible in the waveform display
 *
 * @returns return an array of visible stations
 */
export const useVisibleStations = (): StationTypes.Station[] => {
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);
  const getVisibleStationsFromStationList = useGetVisibleStationsFromStationList();
  const stationData = useOldQueryDataIfReloading<StationTypes.Station[]>(stationsQuery);
  return React.useMemo(
    () => (stationData ? getVisibleStationsFromStationList(stationData) : []),
    [getVisibleStationsFromStationList, stationData]
  );
};

/**
 *
 * @returns an array of version references of visible stations
 */
export const useGetVisibleStationsVersionReferences = (): FacetedTypes.VersionReference<
  'name',
  StationTypes.Station
>[] => {
  const visibleStations = useVisibleStations();
  return React.useMemo(() => {
    if (visibleStations) {
      return visibleStations.map(station =>
        FacetedTypes.convertToVersionReference(
          { effectiveAt: station.effectiveAt, name: station.name },
          'name'
        )
      );
    }
    return [];
  }, [visibleStations]);
};

/**
 * Uses all stations query to return an array of all stations with channels for this effective time
 *
 * @returns return an array of all stations
 */
export const useAllStations = (): StationTypes.Station[] => {
  const empty = React.useRef<StationTypes.Station[]>([]);
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);
  return useOldQueryDataIfReloading<StationTypes.Station[]>(stationsQuery) || empty.current;
};

/**
 * Create a new station group with the effective time from the workflow redux state start time and the current station group.
 * Used for fetching processing masks.
 *
 * @returns a station group matching the one currently open via workflow, effective at the workflow start time
 */
export function useStationGroupEffectiveForInterval() {
  const stationGroup = useAppSelector(state => state.app.workflow.stationGroup);
  const startTimeSecs = useAppSelector(state => state.app.workflow.timeRange.startTimeSecs);

  return React.useMemo(
    () => ({
      ...stationGroup,
      effectiveAt: startTimeSecs || stationGroup.effectiveAt
    }),
    [startTimeSecs, stationGroup]
  );
}
