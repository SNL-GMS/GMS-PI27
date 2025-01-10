import type { ChannelTypes, StationTypes } from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { uniqSortStrings } from '@gms/common-util';
import { unwrapResult } from '@reduxjs/toolkit';
import defer from 'lodash/defer';
import sortBy from 'lodash/sortBy';
import React from 'react';

import { selectOpenEventId } from '../api';
import type {
  PredictFeatures,
  PredictFeaturesForEventLocation,
  PredictFeaturesForEventLocationArgs,
  PredictFeaturesForEventLocationHistory,
  PredictFeaturesForEventLocationQueryResult,
  ReceiverCollection
} from '../api/data/event/predict-features-for-event-location';
import {
  eventLocationToString,
  predictFeaturesForEventLocation,
  usePreCachePredictFeaturesForEventLocation
} from '../api/data/event/predict-features-for-event-location';
import { UIStateError } from '../error-handling/ui-state-error';
import type { AsyncFetchHistoryEntry, FetchHistoryStatus } from '../query';
import { handleCanceledRequests } from '../query/async-fetch-util';
import { selectOpenIntervalName } from '../state';
import { useRawChannels } from './channel-hooks';
import { useGetEvents } from './event-manager-hooks';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useProcessingAnalystConfiguration } from './processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useAllStations } from './station-definition-hooks';

/**
 * Takes the provided {@link ChannelTypes.Channel}s and {@link StationTypes.Station}s
 * and creates a collection of {@link ReceiverCollection}s.
 *
 * @param channels channels to build receivers for
 * @param stations stations to build receivers for *
 * @returns a collection of {@link ReceiverCollection}
 */
export function prepareReceiverCollection(
  channels: ChannelTypes.Channel[] | undefined,
  stations: StationTypes.Station[] | undefined
): ReceiverCollection[] {
  const receivers: ReceiverCollection[] = [];

  if (channels) {
    const channelBandTypeToChannels: Record<string, ChannelTypes.Channel[]> = {};
    uniqSortEntityOrVersionReference(channels).forEach(channel => {
      if (!channelBandTypeToChannels[channel.channelBandType]) {
        channelBandTypeToChannels[channel.channelBandType] = [];
      }
      channelBandTypeToChannels[channel.channelBandType].push(channel);
    });

    Object.entries(channelBandTypeToChannels).forEach(([receiverBandType, entries]) => {
      receivers.push({
        receiverBandType,
        receiverLocationsByName: Object.fromEntries(
          entries.map(channel => [channel.name, channel.location])
        )
      });
    });
  }

  if (stations) {
    receivers.push({
      receiverLocationsByName: Object.fromEntries(
        uniqSortEntityOrVersionReference(stations).map(station => [station.name, station.location])
      )
    });
  }
  return receivers;
}

/**
 * Hook that returns the {@link AsyncFetchResult} {@link PredictFeaturesForEventLocationHistory} history
 * of the {@link usePredictFeaturesForEventLocationQuery} query.
 *
 * @param args the query arguments of type {@link PredictFeaturesForEventLocationArgs}
 * @returns the query history for the provided arguments
 */
export const usePredictFeaturesForEventLocationQueryHistory = (
  args: PredictFeaturesForEventLocationArgs
): FetchHistoryStatus => {
  // retrieve all beamforming templates from the state
  const id = React.useMemo(() => eventLocationToString(args.sourceLocation), [args.sourceLocation]);

  const history = useAppSelector(state => state.data.queries.predictFeaturesForEventLocation);

  // filter history based on the event source location
  const filtered: PredictFeaturesForEventLocationHistory = React.useMemo(() => {
    const toReturn: PredictFeaturesForEventLocationHistory = {};
    Object.entries(history).forEach(([k, entries]) => {
      const filteredEntries: Record<
        string /* request id */,
        AsyncFetchHistoryEntry<PredictFeaturesForEventLocationArgs>
      > = {};
      Object.entries(entries).forEach(([i, e]) => {
        if (eventLocationToString(e.arg.sourceLocation) === id) {
          filteredEntries[i] = e;
        }
      });
      toReturn[k] = filteredEntries;
    });
    return toReturn;
  }, [history, id]);

  return useFetchHistoryStatus<PredictFeaturesForEventLocationArgs>(filtered);
};

/**
 * Hook that calls the {@link predictFeaturesForEventLocation} query.
 *
 * @param args the query arguments of type {@link PredictFeaturesForEventLocationArgs}
 * @returns the query result, {@link PredictFeaturesForEventLocationQueryResult}
 */
export const usePredictFeaturesForEventLocationQuery = (
  args: PredictFeaturesForEventLocationArgs
): PredictFeaturesForEventLocationQueryResult => {
  const dispatch = useAppDispatch();
  const history = usePredictFeaturesForEventLocationQueryHistory(args);

  // retrieve all beamforming templates from the state
  const id = React.useMemo(() => eventLocationToString(args.sourceLocation), [args.sourceLocation]);
  const data = useAppSelector(state =>
    id != null ? state.data.predictFeaturesForEventLocation[id] : undefined
  );

  //! useEffect updates redux state
  React.useEffect(() => {
    dispatch(predictFeaturesForEventLocation(args)).catch(error => {
      throw new UIStateError(error);
    });
  }, [dispatch, args]);

  return React.useMemo(() => {
    return { ...history, data };
  }, [history, data]);
};

/**
 * Check if all predictions in the args are already in the data provided
 *
 * @param data the data from all feature predictions query
 * @param args the args for a possible query to check
 * @returns true if every location, phase, and receiver is found. If any are not found, then it returns false
 */
function hasPredictionForQueryArgs(
  data: PredictFeaturesForEventLocation,
  args: PredictFeaturesForEventLocationArgs
) {
  const id = eventLocationToString(args.sourceLocation);
  if (data == null || id == null || data[id] == null) {
    return false;
  }
  return args.receivers
    .flatMap(r => Object.keys(r.receiverLocationsByName))
    .every(stationOrChannelName => {
      const receiverLocation = data[id].receiverLocationsByName[stationOrChannelName];
      return receiverLocation.featurePredictions.find(prediction =>
        args.phases.includes(prediction.phase)
      );
    });
}

/**
 * Hook that calls the {@link predictFeaturesForEventLocation} query.
 *
 * @param args the query arguments of type {@link PredictFeaturesForEventLocationArgs}
 * @returns the query result, {@link PredictFeaturesForEventLocationQueryResult}
 */
export const usePredictFeaturesForEventLocationFunction: () => (
  args: PredictFeaturesForEventLocationArgs
) => Promise<PredictFeatures | undefined> = () => {
  const dispatch = useAppDispatch();

  // retrieve all beamforming templates from the state
  const data = useAppSelector(state => state.data.predictFeaturesForEventLocation);
  return React.useCallback(
    async (args: PredictFeaturesForEventLocationArgs) => {
      if (args.sourceLocation === undefined) {
        throw new Error('Cannot predict features without a given location');
      }
      const id = eventLocationToString(args.sourceLocation);
      if (hasPredictionForQueryArgs(data, args) && id != null) {
        return data[id];
      }
      return dispatch(predictFeaturesForEventLocation(args))
        .then(handleCanceledRequests(unwrapResult))
        .catch(error => {
          throw new UIStateError(error);
        });
    },
    [dispatch, data]
  );
};

// helper hook to build the source locations and receivers for both the hook and function variants
const usePredictFeaturesLocationAndReceivers = () => {
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const openEventId = useAppSelector(selectOpenEventId);

  const events = useGetEvents();
  const stations = useAllStations();
  const rawChannels = useRawChannels();

  const sourceLocation = React.useMemo(() => {
    if (events.data) {
      const openEvent = events.data.find(event => event.id === openEventId);
      if (openEvent) {
        const eventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
          openEvent,
          openIntervalName
        );
        const locationSolution = eventHypothesis?.locationSolutions.find(
          ls => ls.id === eventHypothesis.preferredLocationSolution.id
        );
        return locationSolution?.location;
      }
    }
    return undefined;
  }, [openEventId, events.data, openIntervalName]);

  const receivers = React.useMemo(
    () => prepareReceiverCollection(rawChannels, stations),
    [rawChannels, stations]
  );

  return React.useMemo(
    () => ({
      receivers,
      sourceLocation
    }),
    [sourceLocation, receivers]
  );
};

/**
 * Returns the feature predictions for {@link EventTypes.Event} Location.
 *
 * @param additionalPhases additional phases
 * @returns the query result, {@link PredictFeaturesForEventLocationQueryResult}
 */
export const usePredictFeaturesForEventLocation = (
  additionalPhases: string[] = []
): PredictFeaturesForEventLocationQueryResult => {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const { receivers, sourceLocation } = usePredictFeaturesLocationAndReceivers();

  const phases = React.useMemo(() => {
    const favoritesPhases = uniqSortStrings(
      processingAnalystConfiguration.phaseLists.flatMap(phaseList => phaseList.favorites)
    );
    return uniqSortStrings([...favoritesPhases, ...additionalPhases]);
  }, [additionalPhases, processingAnalystConfiguration.phaseLists]);

  return usePredictFeaturesForEventLocationQuery({ sourceLocation, receivers, phases });
};

/**
 * Hook for getting the feature prediction and setting up the pre cache schema around them
 */
export const useCachePredictFeaturesForEventLocation = (): void => {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const openIntervalName = useAppSelector(state => state.app.workflow.openIntervalName);

  const events = useGetEvents();
  const stations = useAllStations();
  const rawChannels = useRawChannels();

  const preCachePredictFeaturesForEventLocation = usePreCachePredictFeaturesForEventLocation();

  const locationSolutions = React.useMemo(() => {
    if (events.data) {
      return sortBy(
        events.data.map(event => {
          const eventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
            event,
            openIntervalName
          );
          return eventHypothesis?.locationSolutions.find(
            ls => ls.id === eventHypothesis.preferredLocationSolution.id
          );
        }),
        ls => ls?.location.time
      );
    }
    return [];
  }, [events.data, openIntervalName]);

  const receivers = React.useMemo(
    () => prepareReceiverCollection(rawChannels, stations),
    [rawChannels, stations]
  );

  const favoritesPhases = React.useMemo(
    () =>
      uniqSortStrings(
        processingAnalystConfiguration.phaseLists.flatMap(phaseList => phaseList.favorites)
      ),
    [processingAnalystConfiguration]
  );

  React.useEffect(() => {
    if (
      favoritesPhases &&
      favoritesPhases.length > 0 &&
      receivers?.length > 0 &&
      locationSolutions?.length > 0
    ) {
      defer(() => {
        locationSolutions.forEach(ls => {
          preCachePredictFeaturesForEventLocation(
            {
              sourceLocation: ls?.location,
              receivers,
              phases: favoritesPhases
            },
            () => {
              // time made negative to process recent first (highest numbers process sooner)
              return -(ls?.location.time || 0);
            }
          ).catch(error => {
            throw new UIStateError(error);
          });
        });
      });
    }
    // ! only re-query if the args change: locationSolutions, favorite phases, receivers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSolutions, favoritesPhases, receivers]);
};
