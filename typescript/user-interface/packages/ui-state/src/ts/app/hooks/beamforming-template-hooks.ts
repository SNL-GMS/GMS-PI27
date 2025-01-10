import { BeamformingTemplateTypes } from '@gms/common-model';
import { unwrapResult } from '@reduxjs/toolkit';
import React from 'react';

import type { GetBeamformingTemplatesQueryArgs } from '../api/data/signal-enhancement';
import { getBeamformingTemplates } from '../api/data/signal-enhancement';
import { UIStateError } from '../error-handling/ui-state-error';
import type { AsyncFetchResult, FetchHistoryStatus } from '../query';
import { handleCanceledRequests } from '../query/async-fetch-util';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { usePhaseTypeFavorites } from './signal-detection-hooks';
import { useGetVisibleStationsVersionReferences } from './station-definition-hooks';

/**
 * Defines async fetch result for the beamforming templates. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type BeamformingTemplateFetchResult =
  AsyncFetchResult<BeamformingTemplateTypes.BeamformingTemplatesByStationByPhase>;

/**
 * A hook that can be used to return the current history of the beamforming templates query.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the `getBeamformingTemplates` queries
 *
 * @returns the current history of the processing mask definitions query.
 */
export const useGetBeamformingTemplatesRangeHistory = (): FetchHistoryStatus => {
  const history = useAppSelector(state => state.data.queries.getBeamformingTemplates);
  return useFetchHistoryStatus<GetBeamformingTemplatesQueryArgs>(history);
};

/**
 * A hook that issues the requests for the beamforming templates query.
 *
 * @param args the beamforming templates query arguments
 */
const useFetchBeamformingTemplatesQuery = (args: GetBeamformingTemplatesQueryArgs): void => {
  const dispatch = useAppDispatch();
  //! useEffect updates redux state
  React.useEffect(() => {
    dispatch(getBeamformingTemplates(args)).catch(error => {
      throw new UIStateError(error);
    });
  }, [dispatch, args]);
};

/**
 * Check if all stations and phases in the request args are represented in the
 * provided data object (which is presumably coming from Redux)
 *
 * @param data The redux record of records representing all rotation templates that we have fetched
 * @param args the args for a possible query
 * @returns true if the rotation templates already exist in data that would be fetched for query represented by args
 */
export function hasBeamformingTemplatesForQueryArgs(
  data: BeamformingTemplateTypes.BeamformingTemplatesByBeamTypeByStationByPhase,
  args: GetBeamformingTemplatesQueryArgs
): boolean {
  const beamformingTemplatesByStationByPhase = data[args.beamType];
  if (!beamformingTemplatesByStationByPhase) {
    return false;
  }
  return args.stations.every(station => {
    const beamformingTemplatesByPhase = beamformingTemplatesByStationByPhase[station.name];
    if (!beamformingTemplatesByPhase) {
      return false;
    }
    return args.phases.every(phase => beamformingTemplatesByPhase[phase] != null);
  });
}

/**
 * Hook to create a callback for getting/fetching beamforming templates
 *
 * @returns a callback function that returns {@link BeamformingTemplatesByStationByPhase} for the {@link BeamformingTemplateTypes.BeamType} containing the requested PhasesAndStations.
 * If these already exist in redux it will return the full object from redux which may contain additional stations and phases.
 * Otherwise it will fetch the beam templates and return the result
 */
export const useFetchBeamformingTemplatesQueryFunction = () => {
  const dispatch = useAppDispatch();
  const data = useAppSelector(state => state.data.beamformingTemplates);

  return React.useCallback(
    async (
      args: GetBeamformingTemplatesQueryArgs
    ): Promise<BeamformingTemplateTypes.BeamformingTemplatesByStationByPhase> => {
      if (hasBeamformingTemplatesForQueryArgs(data, args)) {
        return data[args.beamType];
      }
      return dispatch(getBeamformingTemplates(args))
        .then(handleCanceledRequests(unwrapResult))
        .catch(error => {
          throw new UIStateError(error.message);
        });
    },
    [data, dispatch]
  );
};

/**
 * A hook that can be used to retrieve beamforming templates
 *
 * @returns the beamforming templates result.
 */
export const useBeamformingTemplates = (
  args: GetBeamformingTemplatesQueryArgs
): BeamformingTemplateFetchResult => {
  const history = useGetBeamformingTemplatesRangeHistory();
  // issue any new fetch requests
  useFetchBeamformingTemplatesQuery(args);

  // retrieve all beamforming templates from the state
  const beamformingTemplates = useAppSelector(state => state.data.beamformingTemplates);
  return React.useMemo(() => {
    return { ...history, data: beamformingTemplates[args.beamType] };
  }, [args, history, beamformingTemplates]);
};

/**
 * Hook to obtain beamforming templates for visible stations and favorite phases
 *
 * @param beamType
 * @returns beamFormingTemplate
 */
export const useBeamformingTemplatesForVisibleStationsAndFavoritePhases = (
  beamType: BeamformingTemplateTypes.BeamType,
  additionalPhases?: string[]
): BeamformingTemplateFetchResult => {
  const stationVersionReferences = useGetVisibleStationsVersionReferences();
  const phases = usePhaseTypeFavorites(additionalPhases);

  const args = React.useMemo(
    () => ({
      phases,
      stations: stationVersionReferences,
      beamType
    }),
    [beamType, phases, stationVersionReferences]
  );
  return useBeamformingTemplates(args);
};

/**
 * Hook to obtain beamforming templates for visible stations and favorite phases for EVENT
 */
export const useBeamformingTemplatesForEvent = (phases?: string[]) => {
  return useBeamformingTemplatesForVisibleStationsAndFavoritePhases(
    BeamformingTemplateTypes.BeamType.EVENT,
    phases
  );
};

/**
 * Hook to obtain beamforming templates for visible stations and favorite phases for FK
 */
export const useBeamformingTemplatesForFK = () => {
  return useBeamformingTemplatesForVisibleStationsAndFavoritePhases(
    BeamformingTemplateTypes.BeamType.FK
  );
};
