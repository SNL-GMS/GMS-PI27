import type { BeamformingTemplateTypes, FacetedTypes, StationTypes } from '@gms/common-model';
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
  'GMS_GET_BEAMFORMING_TEMPLATES',
  process.env.GMS_GET_BEAMFORMING_TEMPLATES
);

export interface GetBeamformingTemplatesQueryArgs {
  phases: string[];
  stations: FacetedTypes.VersionReference<'name', StationTypes.Station>[];
  beamType: BeamformingTemplateTypes.BeamType;
}

export type GetBeamformingTemplatesHistory = AsyncFetchHistory<GetBeamformingTemplatesQueryArgs>;

export const beamformingTemplatesQuery: CreateAsyncThunkQueryProps<
  GetBeamformingTemplatesQueryArgs,
  BeamformingTemplateTypes.BeamformingTemplatesByStationByPhase,
  DataState
> = {
  typePrefix: 'signal-enhancement/getBeamformingTemplates',
  config: config.signalEnhancementConfiguration.services.getBeamformingTemplates.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getBeamformingTemplates,

  idGenerator: args => {
    const stations = `stations:${uniqSortEntityOrVersionReference(args.stations)
      .map(s => s.name)
      .join(';')}`;
    const phases = `phases:${uniqSortStrings(args.phases).join(';')}`;
    return `beamType:${args.beamType}/${stations}/${phases}`;
  },

  shouldSkip: args =>
    args == null ||
    args.phases == null ||
    args.phases.length < 1 ||
    args.stations == null ||
    args.stations.length < 1 ||
    args.beamType == null,

  transformArgs: (args, history, id, entries) => {
    const { beamType } = args;
    // only include entries for the same beam type
    const filteredEntries = entries.filter(e => e.arg.beamType === beamType);
    const [stations, phases] = determineMissingPairs<
      GetBeamformingTemplatesQueryArgs,
      FacetedTypes.VersionReference<'name'>
    >(args, filteredEntries, 'stations', 'phases');
    return {
      beamType,
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
      logger.warn(`Missing BeamTemplate ${args.beamType}:`, missing);
    }
    // warning here only; will accept the result as valid and will not re-query for these args
    return undefined;
  },

  updateState: (action, state) => {
    const { beamType } = action.meta.arg;

    if (action.payload) {
      const { payload } = action;

      if (!state.beamformingTemplates[beamType]) {
        state.beamformingTemplates[beamType] = {};
      }

      Object.keys(payload).forEach(station => {
        if (!state.beamformingTemplates[beamType][station]) {
          state.beamformingTemplates[beamType][station] = {};
        }
        Object.keys(payload[station]).forEach(phase => {
          state.beamformingTemplates[beamType][station][phase] = payload[station][phase];
        });
      });
    }
  }
};

export const {
  asyncQuery: getBeamformingTemplates,
  addMatchReducers: addBeamformingTemplatesMatchReducers
} = createAsyncThunkQuery<
  GetBeamformingTemplatesQueryArgs,
  BeamformingTemplateTypes.BeamformingTemplatesByStationByPhase,
  DataState
>(beamformingTemplatesQuery);
