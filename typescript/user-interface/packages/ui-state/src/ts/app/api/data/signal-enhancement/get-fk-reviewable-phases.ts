import type { FacetedTypes, FkTypes, WorkflowTypes } from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';

import type { AsyncFetchHistory } from '../../../query';
import type { CreateAsyncThunkQueryProps } from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';

const logger = UILogger.create(
  'GMS_GET_FK_REVIEWABLE_PHASES',
  process.env.GMS_GET_FK_REVIEWABLE_PHASES
);

export type GetFkReviewablePhasesQueryResult = FkTypes.FkReviewablePhasesByStation;

export interface GetFkReviewablePhasesQueryArgs {
  stations: FacetedTypes.EntityReference<'name'>[];
  activity: Pick<WorkflowTypes.Activity, 'name'>;
}

export type GetFkReviewablePhasesHistory = AsyncFetchHistory<GetFkReviewablePhasesQueryArgs>;

export const fkReviewablePhasesQuery: CreateAsyncThunkQueryProps<
  GetFkReviewablePhasesQueryArgs,
  GetFkReviewablePhasesQueryResult,
  DataState
> = {
  typePrefix: 'signal-enhancement/getFkReviewablePhases',
  config: config.signalEnhancementConfiguration.services.getFkReviewablePhases.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getFkReviewablePhases,

  idGenerator: args => {
    const stations = `stations:${uniqSortEntityOrVersionReference(args.stations)
      .map(s => s.name)
      .join(';')}`;
    return `activity:${args.activity.name}/${stations}`;
  },

  shouldSkip: args =>
    args == null || (args.stations?.length ?? 0) === 0 || args.activity?.name == null,

  transformArgs: (args, history, id, entries) => {
    const { activity } = args;
    // only include entries for the same activity type
    const filteredEntries = entries.filter(e => e.arg.activity.name === activity.name);
    const existingStations = flatMap(filteredEntries.map(r => r.arg.stations)).map(s => s.name);
    const missingStations = args.stations.filter(s => !includes(existingStations, s.name));
    return { activity, stations: uniqSortEntityOrVersionReference(missingStations) };
  },

  updateState: (action, state) => {
    const { activity } = action.meta.arg;
    if (!state.fkReviewablePhases[activity.name]) {
      state.fkReviewablePhases[activity.name] = {};
    }

    if (action.payload) {
      Object.entries(action.payload).forEach(([stationName, phases]) => {
        state.fkReviewablePhases[activity.name][stationName] = phases;
      });
    }
  }
};

export const {
  asyncQuery: getFkReviewablePhases,
  addMatchReducers: addFkReviewablePhasesMatchReducers
} = createAsyncThunkQuery<
  GetFkReviewablePhasesQueryArgs,
  FkTypes.FkReviewablePhasesByStation,
  DataState
>(fkReviewablePhasesQuery);
