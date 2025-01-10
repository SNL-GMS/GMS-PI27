import type { FacetedTypes } from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import type { FilterDefinition } from '@gms/common-model/lib/filter/types';
import type { WithRequired } from '@gms/common-model/lib/type-util/type-util';
import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type { PriorityRequestConfig } from '@gms/ui-workers/lib/query';
import difference from 'lodash/difference';
import isArray from 'lodash/isArray';
import isEqual from 'lodash/isEqual';
import mergeWith from 'lodash/mergeWith';
import uniq from 'lodash/uniq';
import uniqWith from 'lodash/uniqWith';

import type { AsyncFetchHistory } from '../../../query';
import type { CreateAsyncThunkQueryProps } from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';

const logger = UILogger.create(
  'GMS_GET_FILTER_DEFINITIONS_BY_USAGE',
  process.env.GMS_GET_FILTER_DEFINITIONS_BY_USAGE
);

export interface GetFilterDefinitionByUsageQueryArgs {
  phases: string[];
  channels: FacetedTypes.VersionReference<'name'>[];
}

export interface DistanceRange {
  minDistanceDeg: number;
  maxDistanceDeg: number;
}

export interface FilterIdWithinRange {
  filterDefinitionId: string;
  distanceRange?: DistanceRange;
}

export interface FilterDefinitionByUsage {
  filterDefinitionIdsByUsage: {
    [channel: string]: {
      [phaseType: string]: {
        [namedFilter: string]: FilterIdWithinRange[];
      };
    };
  };
  globalDefaults: {
    [namedFilter: string]: FilterIdWithinRange[];
  };
  filterDefinitionsById: {
    [filterId: string]: FilterDefinition;
  };
}

export type FilterDefinitionByUsageRecord = Record<string, FilterDefinitionByUsage>;

export type GetFilterDefinitionByUsageHistory =
  AsyncFetchHistory<GetFilterDefinitionByUsageQueryArgs>;

const versionChannelId = (channel: FacetedTypes.VersionReference<'name'>) => {
  return `${channel.name}${channel.effectiveAt}`;
};

const mergeFilterMap = (
  a: FilterDefinitionByUsage,
  b: FilterDefinitionByUsage | undefined
): FilterDefinitionByUsage => {
  if (b) {
    return mergeWith(a, b, (objValue, srcValue) => {
      if (isArray(objValue)) {
        return uniqWith(objValue.concat(srcValue), isEqual);
      }

      return undefined;
    });
  }
  return a;
};

/**
 * Creates AsyncThunkQuery that gets the default Filter definition objects used to filter each
 * provided Channel for each provided PhaseType, each FilterDefinitionUsage
 * literal, and a variety of Event to Channel distance ranges
 */
export const filterDefinitionByUsageQuery: CreateAsyncThunkQueryProps<
  GetFilterDefinitionByUsageQueryArgs,
  FilterDefinitionByUsage,
  DataState
> = {
  typePrefix: 'signal-enhancement/getFilterDefinitionByUsageMap',
  config:
    config.signalEnhancementConfiguration.services.getDefaultFilterDefinitionByUsageMap
      .requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getFilterDefinitionsByUsageMap,

  idGenerator: args => {
    const channels = `channels:${uniqSortEntityOrVersionReference(args.channels)
      .map(s => s.name)
      .join(';')}`;
    const phases = `phases:${uniqSortStrings(args.phases).join(';')}`;
    return `${channels}/${phases}`;
  },

  shouldSkip: args =>
    args == null ||
    args.phases == null ||
    args.phases.length < 1 ||
    args.channels == null ||
    args.channels.length < 1,

  prepareRequestConfig: (args, requestConfig, history, id, entries) => {
    const hist: Record<string, string[]> = {};
    const chunks: Record<string, GetFilterDefinitionByUsageQueryArgs> = {};
    const requests: WithRequired<
      PriorityRequestConfig<GetFilterDefinitionByUsageQueryArgs>,
      'data'
    >[] = [];

    // Build a unique record of everything that has ever been requested
    entries.forEach(entry => {
      entry.arg.channels.forEach(channel => {
        const channelId = versionChannelId(channel);
        if (!hist[channelId]) hist[channelId] = [];
        hist[channelId] = uniq([...hist[channelId], ...entry.arg.phases]);
      });
    });

    // Compare against the history record for only the phases we have not seen
    args.channels.forEach(channel => {
      const channelId = versionChannelId(channel);
      const phasesToGet = difference(args.phases, hist[channelId]);
      const phasesId = `phases:${phasesToGet.join(';')}`;

      if (!chunks[phasesId]) chunks[phasesId] = { phases: phasesToGet, channels: [] };

      chunks[phasesId].channels.push(channel);
    });

    // Build the chunks into requests
    Object.values(chunks).forEach(chunk => {
      requests.push({
        ...requestConfig,
        data: {
          phases: chunk.phases,
          channels: chunk.channels
        }
      });
    });

    return requests;
  },

  transformResult: (args, results) => {
    let finalResult: FilterDefinitionByUsage = {
      filterDefinitionIdsByUsage: {},
      globalDefaults: {},
      filterDefinitionsById: {}
    };
    results.forEach(result => {
      finalResult = mergeFilterMap(finalResult, result);
    });

    return finalResult;
  },

  updateState: (action, state) => {
    if (action.payload) {
      state.defaultFilterDefinitionsMap = mergeFilterMap(
        state.defaultFilterDefinitionsMap,
        action.payload
      );
    }
  }
};

export const {
  asyncQuery: getFilterDefinitionsByUsageMap,
  addMatchReducers: addFilterDefinitionsByUsageMapMatchReducers
} = createAsyncThunkQuery<GetFilterDefinitionByUsageQueryArgs, FilterDefinitionByUsage, DataState>(
  filterDefinitionByUsageQuery
);
