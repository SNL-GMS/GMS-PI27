import type { RotationTypes } from '@gms/common-model';
import type { RotationTemplateByPhaseByStation } from '@gms/common-model/lib/rotation/types';
import { unwrapResult } from '@reduxjs/toolkit';
import React from 'react';

import type {
  GetRotationTemplatesHistory,
  GetRotationTemplatesQueryArgs
} from '../api/data/signal-enhancement';
import { getRotationTemplatesQuery } from '../api/data/signal-enhancement';
import { getRotationTemplates } from '../api/data/signal-enhancement/get-rotation-templates';
import { UIStateError } from '../error-handling/ui-state-error';
import type { AsyncFetchResult, FetchHistoryStatus } from '../query';
import { handleCanceledRequests } from '../query/async-fetch-util';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { usePhaseTypeFavorites } from './signal-detection-hooks';
import { useGetVisibleStationsVersionReferences } from './station-definition-hooks';

/**
 * Defines async fetch result for the rotation templates. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type GetRotationTemplatesFetchResult =
  AsyncFetchResult<RotationTypes.RotationTemplateByPhaseByStationRecord>;

/**
 * A hook that can be used to return the current history of the rotation templates query.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the `getRotationTemplates` queries
 *
 * @returns the current history of the getRotationTemplates query.
 */
export const useGetRotationTemplatesQueryHistory = (): FetchHistoryStatus => {
  const history: GetRotationTemplatesHistory = useAppSelector(
    state => state.data.queries.getRotationTemplates
  );
  return useFetchHistoryStatus<GetRotationTemplatesQueryArgs>(history);
};

/**
 * Check if all stations and phases in the request args are represented in the
 * provided data object (which is presumably coming from Redux)
 *
 * @param data The redux record of records representing all rotation templates that we have fetched
 * @param args the args for a possible query
 * @returns true if the rotation templates already exist in data that would be fetched for query represented by args
 */
function hasRotationTemplatesForQueryArgs(
  data: RotationTypes.RotationTemplateByPhaseByStationRecord,
  args: GetRotationTemplatesQueryArgs
): boolean {
  return args.stations.every(station => {
    const rotationTemplateByPhaseByStation = data[station.name];
    if (!rotationTemplateByPhaseByStation) {
      return false;
    }
    return args.phases.every(
      phase => rotationTemplateByPhaseByStation.rotationTemplatesByPhase[phase] != null
    );
  });
}

/**
 * A hook that issues the requests for the rotation templates query.
 *
 * @param args the {@link GetRotationTemplatesQueryArgs} query arguments
 */
export const useGetRotationTemplatesQuery = (
  args: GetRotationTemplatesQueryArgs
): GetRotationTemplatesFetchResult => {
  const dispatch = useAppDispatch();

  const shouldSkip = React.useMemo(() => getRotationTemplatesQuery.shouldSkip(args), [args]);

  //! useEffect updates Redux state
  React.useEffect(() => {
    if (!shouldSkip) {
      dispatch(getRotationTemplates(args)).catch(error => {
        throw new UIStateError(error);
      });
    }
  }, [args, dispatch, shouldSkip]);

  const history = useGetRotationTemplatesQueryHistory();
  const rotationTemplates = useAppSelector(state => state.data.rotationTemplates);
  return React.useMemo(() => {
    if (shouldSkip) {
      return {
        data: {},
        pending: 0,
        fulfilled: 0,
        rejected: 0,
        isLoading: false,
        isError: false
      };
    }
    return { ...history, data: rotationTemplates };
  }, [history, rotationTemplates, shouldSkip]);
};

/**
 * Hook to create a callback for getting/fetching rotation templates
 *
 * @returns a callback function that returns rotation templates.
 * Fetches if the rotation templates are not found in the redux store.
 */
export const useFetchRotationTemplatesQuery = () => {
  const dispatch = useAppDispatch();
  const data = useAppSelector(state => state.data.rotationTemplates);
  return React.useCallback(
    async (args: GetRotationTemplatesQueryArgs): Promise<RotationTemplateByPhaseByStation[]> => {
      if (hasRotationTemplatesForQueryArgs(data, args)) {
        const result: RotationTypes.RotationTemplateByPhaseByStation[] = args.stations.map(
          station => data[station.name]
        );
        return result;
      }
      return dispatch(getRotationTemplates(args))
        .then(handleCanceledRequests(unwrapResult))
        .catch(error => {
          throw new UIStateError(error.message);
        });
    },
    [data, dispatch]
  );
};

/**
 * A hook that can be used to retrieve all the rotation templates
 * as a record keyed on station name
 *
 * @returns the rotation templates.
 */
export const useRotationTemplates = (): RotationTypes.RotationTemplateByPhaseByStationRecord => {
  return useAppSelector(state => state.data.rotationTemplates);
};

/**
 * Hook to query for rotation templates for visible stations and favorite phases
 *
 * @param additionalPhases additional phases to query rotation templates for
 */
export const useGetRotationTemplatesForVisibleStationsAndFavoritePhases = (
  additionalPhases?: string[]
): GetRotationTemplatesFetchResult => {
  const stations = useGetVisibleStationsVersionReferences();
  const phases = usePhaseTypeFavorites(additionalPhases);
  const args = React.useMemo(
    () => ({
      phases,
      stations
    }),
    [phases, stations]
  );
  return useGetRotationTemplatesQuery(args);
};
