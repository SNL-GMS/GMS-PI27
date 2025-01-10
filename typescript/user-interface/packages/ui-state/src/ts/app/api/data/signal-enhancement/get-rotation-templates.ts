import type { FacetedTypes, RotationTypes, StationTypes } from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';

import type { AsyncFetchHistory } from '../../../query';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  ShouldSkip,
  TransformArgs,
  UpdateState
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import { determineMissingPairs } from '../deduplication-utils';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';

const logger = UILogger.create(
  'GMS_LOG_GET_ROTATION_TEMPLATES',
  process.env.GMS_LOG_GET_ROTATION_TEMPLATES
);

export interface GetRotationTemplatesQueryArgs {
  phases: string[];
  stations: FacetedTypes.VersionReference<'name', StationTypes.Station>[];
}

export type GetRotationTemplatesHistory = AsyncFetchHistory<GetRotationTemplatesQueryArgs>;

const idGenerator: IdGenerator<GetRotationTemplatesQueryArgs> = args => {
  const stations = `stations:${uniqSortEntityOrVersionReference(args.stations)
    .map(s => s.name)
    .join(';')}`;
  const phases = `phases:${uniqSortStrings(args.phases).join(';')}`;
  return `${stations}/${phases}`;
};

const shouldSkip: ShouldSkip<GetRotationTemplatesQueryArgs> = (args): boolean =>
  args == null ||
  args.stations == null ||
  args.stations.length < 1 ||
  args.phases == null ||
  args.phases.length < 1;

const transformArgs: TransformArgs<GetRotationTemplatesQueryArgs> = (
  args,
  history,
  id,
  entries
) => {
  const [stations, phases] = determineMissingPairs<
    GetRotationTemplatesQueryArgs,
    FacetedTypes.VersionReference<'name'>
  >(args, entries, 'stations', 'phases');
  return {
    stations: uniqSortEntityOrVersionReference(stations),
    phases: uniqSortStrings(phases)
  };
};

const updateState: UpdateState<
  GetRotationTemplatesQueryArgs,
  RotationTypes.RotationTemplateByPhaseByStation[],
  DataState
> = (action, state): void => {
  if (action.payload) {
    action.payload.forEach(result => {
      // lets see if we have the station name key as a record
      if (!state.rotationTemplates[result.station.name]) {
        // if not create it
        state.rotationTemplates[result.station.name] = { ...result };
      } else {
        // we found a match lets update the by phase templates now
        Object.keys(result.rotationTemplatesByPhase).forEach(phase => {
          if (!state.rotationTemplates[result.station.name].rotationTemplatesByPhase[phase]) {
            // no match for this phase lets add it
            state.rotationTemplates[result.station.name].rotationTemplatesByPhase[phase] = {
              ...result.rotationTemplatesByPhase[phase]
            };
          }
        });
      }
    });
  }
};

/**
 * Defines an async thunk query for the query to find {@link RotationTypes.RotationTemplateByPhaseByStation}s by station and phase.
 */
export const getRotationTemplatesQuery: CreateAsyncThunkQueryProps<
  GetRotationTemplatesQueryArgs,
  RotationTypes.RotationTemplateByPhaseByStation[],
  DataState
> = {
  typePrefix: 'signal-enhancement/getRotationTemplates',
  config: config.signalEnhancementConfiguration.services.getRotationTemplates.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getRotationTemplates,
  idGenerator,
  shouldSkip,
  transformArgs,
  updateState
};

/**
 * Provides an async thunk query and the and add reducers functions
 * for {@link getRotationTemplatesQuery}
 */
export const {
  asyncQuery: getRotationTemplates,
  addMatchReducers: addGetRotationTemplatesMatchReducers
} = createAsyncThunkQuery<
  GetRotationTemplatesQueryArgs,
  RotationTypes.RotationTemplateByPhaseByStation[],
  DataState
>(getRotationTemplatesQuery);
