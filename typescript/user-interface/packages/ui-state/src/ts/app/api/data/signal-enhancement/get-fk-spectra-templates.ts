import type { FacetedTypes, FkTypes, StationTypes } from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';

import type { AsyncFetchHistory } from '../../../query';
import type { CreateAsyncThunkQueryProps } from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import { determineMissingPairs } from '../deduplication-utils';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';

const logger = UILogger.create(
  'GMS_GET_FK_SPECTRA_TEMPLATES',
  process.env.GMS_GET_FK_SPECTRA_TEMPLATES
);

export interface GetFkSpectraTemplatesQueryArgs {
  stations: FacetedTypes.VersionReference<'name', StationTypes.Station>[];
  phases: string[];
}

export type GetFkSpectraTemplatesHistory = AsyncFetchHistory<GetFkSpectraTemplatesQueryArgs>;

export const fkSpectraTemplatesQuery: CreateAsyncThunkQueryProps<
  GetFkSpectraTemplatesQueryArgs,
  FkTypes.FkSpectraTemplatesByStationByPhase,
  DataState
> = {
  typePrefix: 'signal-enhancement/getFkSpectraTemplates',
  config: config.signalEnhancementConfiguration.services.getFkSpectraTemplates.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getFkSpectraTemplates,

  idGenerator: args => {
    const stations = `stations:${uniqSortEntityOrVersionReference(args.stations)
      .map(s => s.name)
      .join(';')}`;
    const phases = `phases:${uniqSortStrings(args.phases).join(';')}`;
    return `${stations}/${phases}`;
  },

  shouldSkip: args =>
    args == null ||
    args.phases == null ||
    args.phases.length < 1 ||
    args.stations == null ||
    args.stations.length < 1,

  transformArgs: (args, history, id, entries) => {
    const [stations, phases] = determineMissingPairs<
      GetFkSpectraTemplatesQueryArgs,
      FacetedTypes.VersionReference<'name'>
    >(args, entries, 'stations', 'phases');
    return {
      stations: uniqSortEntityOrVersionReference(stations),
      phases: uniqSortStrings(phases)
    };
  },

  validateResult: (args, result) => {
    // inspect and validate the query results; check for missing station/phase pair results
    const missing: Record<string, string[]> = {};
    args.phases.forEach(phase => {
      args.stations.forEach(station => {
        if (!result && !result?.[station.name] && !result?.[station.name][phase]) {
          missing[station.name] = !missing[station.name]
            ? [phase]
            : missing[station.name].concat(phase);
        }
      });
    });

    if (Object.values(missing).length > 0) {
      logger.warn(`Missing FkSpectraTemplate:`, missing);
    }
    // warning here only; will accept the result as valid and will not re-query for these args
    return undefined;
  },

  updateState: (action, state) => {
    if (action.payload) {
      const { payload } = action;
      Object.keys(payload).forEach(station => {
        if (!state.fkSpectraTemplates[station]) {
          state.fkSpectraTemplates[station] = {};
        }
        Object.keys(payload[station]).forEach(phase => {
          state.fkSpectraTemplates[station][phase] = payload[station][phase];
        });
      });
    }
  }
};

export const {
  asyncQuery: getFkSpectraTemplates,
  addMatchReducers: addFkSpectraTemplatesMatchReducers
} = createAsyncThunkQuery<
  GetFkSpectraTemplatesQueryArgs,
  FkTypes.FkSpectraTemplatesByStationByPhase,
  DataState
>(fkSpectraTemplatesQuery);
