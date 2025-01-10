import type { ChannelSegmentTypes, CommonTypes, EventTypes } from '@gms/common-model';
import { SignalDetectionTypes, uniqSortEntityOrVersionReference } from '@gms/common-model';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { findArrivalTimeFeatureMeasurementUsingSignalDetection } from '@gms/common-model/lib/signal-detection/util';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import includes from 'lodash/includes';
import sortBy from 'lodash/sortBy';
import sortedUniq from 'lodash/sortedUniq';
import React, { useMemo } from 'react';

import type { SignalDetectionsRecord } from '../../types';
import { selectEvents, selectOpenEventId, selectSignalDetections } from '../api';
import type { GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs } from '../api/data/signal-detection/get-signal-detections-segments-by-station-time';
import { getSignalDetectionsWithSegmentsByStationAndTimeQuery } from '../api/data/signal-detection/get-signal-detections-segments-by-station-time';
import type { AsyncFetchResult, FetchHistoryStatus } from '../query';
import {
  analystActions,
  fksActions,
  selectActionTargetSignalDetectionIds,
  selectCurrentPhase,
  selectDefaultPhase,
  selectOpenIntervalName,
  selectPhaseSelectorFavorites,
  selectPreferredEventHypothesisByStageForOpenEvent,
  selectSdIdsToShowFk,
  selectSelectedSdIds
} from '../state';
import type { SignalDetectionActionTypes } from '../state/analyst/types';
import {
  determineAllAssociableSignalDetections,
  determineAllDeletableSignalDetections,
  determineAllNonAssociableSignalDetections,
  determineAllValidPhaseChangesForSignalDetections,
  determineAllValidShowFkSignalDetections
} from '../util/util';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { usePhaseLists } from './processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useVisibleStations } from './station-definition-hooks';
import { useViewableInterval } from './waveform-hooks';

/**
 * Defines async fetch result for the signal detections. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type SignalDetectionFetchResult = AsyncFetchResult<SignalDetectionTypes.SignalDetection[]>;

/**
 * Get the current record of signal detections
 *
 * @returns the signal detection record
 */
export const useSignalDetections = (): SignalDetectionsRecord => {
  return useAppSelector(selectSignalDetections);
};

/**
 * Get all signal detection hypotheses
 *
 * @returns an array of signal detection hypotheses
 */
export const useSignalDetectionHypotheses =
  (): SignalDetectionTypes.SignalDetectionHypothesis[] => {
    const signalDetections = useSignalDetections();
    return useMemo(
      () =>
        Object.values(signalDetections)?.flatMap(
          signalDetection => signalDetection.signalDetectionHypotheses
        ),
      [signalDetections]
    );
  };

/**
 * @returns the collection of selected signal detection IDs
 */
export const useGetSelectedSdIds = (): string[] => {
  return useAppSelector(selectSelectedSdIds);
};

/**
 * @returns the collection of selected signal detection IDs to show their FK
 */
export const useGetSdIdsToShowFk = (): string[] => {
  return useAppSelector(selectSdIdsToShowFk);
};

/**
 * Hook that returns a function to show selected FKs in Azimuth/Slowness display.
 *
 * Updates the redux state with the selected SD id(s) to show FK(s).
 *
 * @returns a callback function to show FKs which accepts a list of
 * sdIds
 */
export const useSetSdIdsToShowFk = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (sdIds: string[]) => {
      dispatch(fksActions.setSdIdsToShowFk(sdIds));
    },
    [dispatch]
  );
};

/**
 * Hook that returns a function to set the measurement mode entries
 *
 * Updates the redux state with the measurement mode entries
 *
 * @returns a callback function which accepts a list of
 * measurement entries
 */
export const useSetMeasurementModeEntries = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (entries: Record<string, boolean>) => {
      dispatch(analystActions.setMeasurementModeEntries(entries));
    },
    [dispatch]
  );
};

/**
 * A hook that can be used to return the current history of the signal detections by station query.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the `getSignalDetectionWithSegmentsByStationAndTime` queries
 *
 * @returns returns the current history of the signal detections by station query.
 */
export const useGetSignalDetectionsWithSegmentsByStationAndTimeHistory = (): FetchHistoryStatus => {
  const history = useAppSelector(
    state => state.data.queries.getSignalDetectionWithSegmentsByStationAndTime
  );
  return useFetchHistoryStatus<GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs>(history);
};

/**
 * @returns the skipped result for the get signal detections by stations query
 */
const useGetSignalDetectionsWithSegmentsByStationsAndTimeSkippedResult =
  (): SignalDetectionFetchResult => {
    const result = React.useRef({
      data: [],
      pending: 0,
      fulfilled: 0,
      rejected: 0,
      isLoading: false,
      isError: false
    });
    return result.current;
  };

/**
 * A hook that can be used to retrieve signal detections by stations.
 * Makes an individual async request for each station.
 *
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the signal detections from all requests
 *
 * ! the returned results are filtered so that the results only match what the query args requested
 *
 * @param args the signal detection by stations query arguments
 *
 * @returns the signal detections fetch result.
 */
const useGetSignalDetectionsByStationsAndTime = (
  args: GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs | undefined
): SignalDetectionFetchResult => {
  const history = useGetSignalDetectionsWithSegmentsByStationAndTimeHistory();

  // retrieve all signal detections from the state
  const signalDetections = useAppSelector(selectSignalDetections);
  const skippedReturnValue = useGetSignalDetectionsWithSegmentsByStationsAndTimeSkippedResult();

  // filter out the signal detections based on the query parameters
  const data = React.useMemo<SignalDetectionTypes.SignalDetection[]>(
    () =>
      args
        ? Object.values(signalDetections).filter(sd => {
            const sdh = SignalDetectionTypes.Util.getCurrentHypothesis(
              sd.signalDetectionHypotheses
            );
            const arrivalTime = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
              sdh.featureMeasurements
            )?.arrivalTime.value;
            if (!arrivalTime) return false;
            return (
              args.startTime <= arrivalTime &&
              arrivalTime <= args.endTime &&
              args.stations.find(visStation => visStation.name === sd.station.name)
            );
          })
        : [],
    [args, signalDetections]
  );

  return React.useMemo(() => {
    if (args && getSignalDetectionsWithSegmentsByStationAndTimeQuery.shouldSkip(args)) {
      return skippedReturnValue;
    }

    return { ...history, data };
  }, [args, data, history, skippedReturnValue]);
};

/**
 * A hook that can be used to retrieve query arguments based on the current state.
 * Accounts for the current interval and visible stations.
 *
 * @param interval interval of time to use as the start and end time
 * {@link GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs.startTime startTime}
 * {@link GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs.endTime endTime}
 * @returns the signal detection by stations and time query args.
 */
export const useQueryArgsForGetSignalDetectionsWithSegmentsByStationsAndTime = (
  interval: Nullable<CommonTypes.TimeRange>
): GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs | undefined => {
  const visibleStations = useVisibleStations();
  const stageName = useAppSelector(selectOpenIntervalName);
  const stations = React.useMemo(
    () =>
      visibleStations?.length > 0
        ? uniqSortEntityOrVersionReference(visibleStations.map(station => ({ name: station.name })))
        : [],

    [visibleStations]
  );
  return React.useMemo(
    () =>
      interval.startTimeSecs != null && interval.endTimeSecs != null
        ? {
            stations,
            startTime: interval.startTimeSecs,
            endTime: interval.endTimeSecs,
            excludedSignalDetections: [],
            stageId: {
              name: stageName
            }
          }
        : undefined,
    [stations, interval, stageName]
  );
};

/**
 * A hook that can be used to retrieve Preferred Event Hypothesis for the current opened event.
 *
 * @param stageId
 * @returns the preferred event hypothesis result
 */
export const usePreferredEventHypothesis = (): EventTypes.EventHypothesis | undefined => {
  const openEventId = useAppSelector(selectOpenEventId);
  const events = useAppSelector(selectEvents);
  const openIntervalName = useAppSelector(selectOpenIntervalName);

  return React.useMemo(() => {
    const openEvent = events[openEventId];
    return findPreferredEventHypothesisByOpenStageOrDefaultStage(openEvent, openIntervalName);
  }, [events, openEventId, openIntervalName]);
};

/**
 * A hook that can be used to retrieve signal detections for the current interval and visible stations.
 *
 * @returns the signal detections result based on the interval parameter
 * otherwise the result is based on the viewable interval.
 */
export const useGetSignalDetections = (): SignalDetectionFetchResult => {
  const [viewableInterval] = useViewableInterval();
  const args = useQueryArgsForGetSignalDetectionsWithSegmentsByStationsAndTime(viewableInterval);
  return useGetSignalDetectionsByStationsAndTime(args);
};

/**
 * builds a record given SignalDetectionHypothesisFacetedList
 *
 * @param signalDetectionHypotheses
 * @returns Record<signalDetectionsHypothesis.id.signalDetectionId, signalDetectionsHypothesis.id.id>
 */
export const buildRecordFromSignalDetectionHypothesisFacetedList = (
  signalDetectionHypotheses: SignalDetectionTypes.SignalDetectionHypothesisFaceted[]
): Record<string, string[]> => {
  const record: Record<string, string[]> = {};
  signalDetectionHypotheses.forEach(signalDetectionsHypothesis => {
    if (!record?.[signalDetectionsHypothesis.id.signalDetectionId])
      record[signalDetectionsHypothesis.id.signalDetectionId] = [];
    record[signalDetectionsHypothesis.id.signalDetectionId].push(signalDetectionsHypothesis.id.id);
  });
  return record;
};

/**
 * ! Updates to the switch statement MUST be mirrored in selectValidActionTargetSignalDetectionIds selector
 * Hook to determine action targets by type
 *
 * @returns a function that determines signal detections action targets by type
 */
export const useDetermineActionTargetsByType = () => {
  const actionTargetSignalDetectionIds = useAppSelector(selectActionTargetSignalDetectionIds);
  const defaultPhase = useAppSelector(selectDefaultPhase);
  const currentPhase = useAppSelector(selectCurrentPhase);
  const preferredEventHypothesisByStageForOpenEvent = useAppSelector(
    selectPreferredEventHypothesisByStageForOpenEvent
  );
  const signalDetections = useAppSelector(selectSignalDetections);

  const selectedSignalDetectionsCurrentHypotheses = React.useMemo(
    () =>
      Object.values(signalDetections)
        .filter(sd => includes(actionTargetSignalDetectionIds, sd.id))
        .map(sd => SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)),
    [actionTargetSignalDetectionIds, signalDetections]
  );

  const sdIdsToShowFk = useAppSelector(selectSdIdsToShowFk);

  const determineActionTargetsByType = React.useCallback(
    (type: SignalDetectionActionTypes): string[] => {
      switch (type) {
        case 'associate':
          return determineAllAssociableSignalDetections(
            preferredEventHypothesisByStageForOpenEvent,
            selectedSignalDetectionsCurrentHypotheses
          );
        case 'unassociate':
        case 'reject associate':
          return determineAllNonAssociableSignalDetections(
            preferredEventHypothesisByStageForOpenEvent,
            selectedSignalDetectionsCurrentHypotheses
          );
        case 'delete':
        case 'phase':
        case 'rotate':
          return determineAllDeletableSignalDetections(selectedSignalDetectionsCurrentHypotheses);
        case 'default phase':
          return determineAllValidPhaseChangesForSignalDetections(
            selectedSignalDetectionsCurrentHypotheses,
            defaultPhase
          );
        case 'current phase':
          return determineAllValidPhaseChangesForSignalDetections(
            selectedSignalDetectionsCurrentHypotheses,
            currentPhase
          );
        case 'fk':
          return determineAllValidShowFkSignalDetections(
            selectedSignalDetectionsCurrentHypotheses,
            sdIdsToShowFk,
            determineAllAssociableSignalDetections(
              preferredEventHypothesisByStageForOpenEvent,
              selectedSignalDetectionsCurrentHypotheses
            )
          );
        default:
          return actionTargetSignalDetectionIds;
      }
    },
    [
      actionTargetSignalDetectionIds,
      currentPhase,
      defaultPhase,
      preferredEventHypothesisByStageForOpenEvent,
      sdIdsToShowFk,
      selectedSignalDetectionsCurrentHypotheses
    ]
  );

  return React.useCallback(
    (type: SignalDetectionActionTypes): string[] => {
      return determineActionTargetsByType(type);
    },
    [determineActionTargetsByType]
  );
};

/**
 * Hook that returns a function to set selected SD id's.
 *
 * Updates the redux state with the selected SD id(s).
 *
 * @returns a callback function to set signal detection(s) which accepts a list of
 * signal detection ids
 */
export const useSetSelectedSdIds = () => {
  const dispatch = useAppDispatch();
  const signalDetections = useAppSelector(selectSignalDetections);
  return React.useCallback(
    (signalDetectionIds: string[]) => {
      const selectedWaveforms = signalDetectionIds.reduce<
        ChannelSegmentTypes.ChannelSegmentDescriptor[]
      >((results, signalDetectionId) => {
        const signalDetection = signalDetections[signalDetectionId];

        if (!signalDetection) return results;

        const arrivalTimeFm =
          findArrivalTimeFeatureMeasurementUsingSignalDetection(signalDetection);

        if (arrivalTimeFm?.analysisWaveform) {
          return [...results, arrivalTimeFm.analysisWaveform.waveform.id];
        }

        return results;
      }, []);

      dispatch(analystActions.setSelectedWaveforms(selectedWaveforms));
      dispatch(analystActions.setSelectedSdIds(signalDetectionIds));
    },
    [dispatch, signalDetections]
  );
};

/**
 * Returns a collection of PhaseTypes containing the
 * favorite PhaseTypes of each {@link PhaseList} or the
 * analysts' selected PhaseType favorites for that {@link PhaseList}.
 *
 * @param additionalPhasesTypes (optional) any additional PhaseTypes to add to the list
 *
 * @returns an array of favorite phase types
 */
export const usePhaseTypeFavorites = (additionalPhasesTypes: string[] = []): string[] => {
  const favorites = useAppSelector(selectPhaseSelectorFavorites);
  const phaseLists = usePhaseLists();
  return React.useMemo(() => {
    const phases: string[] = [...additionalPhasesTypes];
    phaseLists.forEach(phaseList => {
      if (!favorites[phaseList.listTitle]) {
        phases.push(...phaseList.favorites);
      } else {
        phases.push(...favorites[phaseList.listTitle]);
      }
    });
    // always ensure sort order and uniqueness
    return sortedUniq(sortBy(phases));
  }, [additionalPhasesTypes, favorites, phaseLists]);
};
