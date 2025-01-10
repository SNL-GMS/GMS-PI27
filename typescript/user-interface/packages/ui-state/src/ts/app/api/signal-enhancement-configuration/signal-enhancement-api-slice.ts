import type { FilterTypes } from '@gms/common-model';
import { axiosBaseQuery } from '@gms/ui-workers';
import { createApi } from '@reduxjs/toolkit/query/react';

import { processFilterDefinitions } from '../data/waveform/filter-definition-operations';
import { config } from './endpoint-configuration';

/**
 * The signal Enhancement configuration api reducer slice.
 */
export const signalEnhancementConfigurationApiSlice = createApi({
  reducerPath: 'signalEnhancementConfigurationApi',
  baseQuery: axiosBaseQuery({
    baseUrl: config.signalEnhancementConfiguration.baseUrl
  }),
  endpoints(build) {
    return {
      /**
       * defines the signal enhancement configuration query for the filter lists definition
       */
      getFilterListsDefinition: build.query<FilterTypes.FilterListsDefinition, void>({
        query: () => ({
          requestConfig: {
            ...config.signalEnhancementConfiguration.services.getSignalEnhancementConfiguration
              .requestConfig
          }
        }),
        async onCacheEntryAdded(_, { dispatch, cacheDataLoaded, getCacheEntry }) {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded;

          const { data } = getCacheEntry();
          const filterDefinitions: FilterTypes.FilterDefinition[] = data
            ? data.filterLists
                ?.flatMap(l => l.filters)
                .reduce((accum: FilterTypes.FilterDefinition[], filter) => {
                  if (filter && filter.filterDefinition) {
                    accum.push(filter.filterDefinition);
                  }
                  return accum;
                }, [])
            : [];

          await processFilterDefinitions(filterDefinitions, dispatch);
        }
      })
    };
  }
});

export const { useGetFilterListsDefinitionQuery } = signalEnhancementConfigurationApiSlice;
