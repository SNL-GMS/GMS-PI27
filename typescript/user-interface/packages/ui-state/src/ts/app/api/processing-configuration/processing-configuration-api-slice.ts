import { ConfigurationTypes } from '@gms/common-model';
import { axiosBaseQuery } from '@gms/ui-workers';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { UseQueryStateResult } from '../../query/types';
import { analystActions } from '../../state/analyst/analyst-slice';
import { config } from './endpoint-configuration';

/**
 * The processing configuration api reducer slice.
 */
export const processingConfigurationApiSlice = createApi({
  reducerPath: 'processingConfigurationApi',
  baseQuery: axiosBaseQuery({
    baseUrl: config.processingConfiguration.baseUrl
  }),
  endpoints(build) {
    return {
      /**
       * defines the processing configuration query for the operational time period configuration
       */
      getOperationalTimePeriodConfiguration: build.query<
        ConfigurationTypes.OperationalTimePeriodConfiguration,
        void
      >({
        query: () => ({
          requestConfig: {
            ...config.processingConfiguration.services.getProcessingConfiguration.requestConfig,
            data: {
              configName: ConfigurationTypes.OperationalTimePeriodConfigs.DEFAULT,
              selectors: []
            }
          }
        })
      }),

      /**
       * defines the processing configuration query for the analyst configuration
       */
      getProcessingAnalystConfiguration: build.query<
        ConfigurationTypes.ProcessingAnalystConfiguration,
        void
      >({
        query: () => ({
          requestConfig: {
            ...config.processingConfiguration.services.getProcessingConfiguration.requestConfig,
            data: {
              configName: ConfigurationTypes.AnalystConfigs.DEFAULT,
              selectors: []
            }
          }
        }),
        onCacheEntryAdded: async (id, { dispatch, cacheDataLoaded }) => {
          const { data } = await cacheDataLoaded;
          const phaseList = data?.phaseLists?.[0];

          if (phaseList) {
            // Set phase selector favorite default
            dispatch(
              analystActions.setPhaseSelectorFavorites({
                listName: phaseList.listTitle,
                favorites: phaseList.favorites
              })
            );
          }
        }
      }),

      /**
       * defines the processing configuration query for the station group names
       */
      getProcessingStationGroupNamesConfiguration: build.query<
        ConfigurationTypes.StationGroupNamesConfiguration,
        void
      >({
        query: () => ({
          requestConfig: {
            ...config.processingConfiguration.services.getProcessingConfiguration.requestConfig,
            data: {
              configName: ConfigurationTypes.StationGroupNamesConfig.DEFAULT,
              selectors: []
            }
          }
        })
      }),
      /**
       * defines the processing configuration query for monitoring organization
       */
      getProcessingMonitoringOrganizationConfiguration: build.query<
        ConfigurationTypes.MonitoringOrganizationConfiguration,
        void
      >({
        query: () => ({
          requestConfig: {
            ...config.processingConfiguration.services.getProcessingConfiguration.requestConfig,
            data: {
              configName: ConfigurationTypes.MonitoringOrganizationConfig.DEFAULT,
              selectors: []
            }
          }
        })
      })
    };
  }
});

export const {
  useGetOperationalTimePeriodConfigurationQuery,
  useGetProcessingAnalystConfigurationQuery,
  useGetProcessingStationGroupNamesConfigurationQuery,
  useGetProcessingMonitoringOrganizationConfigurationQuery
} = processingConfigurationApiSlice;

export type OperationalTimePeriodConfigurationQuery =
  UseQueryStateResult<ConfigurationTypes.OperationalTimePeriodConfiguration>;

export interface OperationalTimePeriodConfigurationQueryProps {
  operationalTimePeriodConfigurationQuery: OperationalTimePeriodConfigurationQuery;
}

export type ProcessingAnalystConfigurationQuery =
  UseQueryStateResult<ConfigurationTypes.ProcessingAnalystConfiguration>;

// Use for golden layout level non-ideal state
export interface ProcessingAnalystConfigurationQueryProps {
  processingAnalystConfigurationQuery: ProcessingAnalystConfigurationQuery;
}

export type ProcessingStationGroupNamesConfigurationQuery =
  UseQueryStateResult<ConfigurationTypes.StationGroupNamesConfiguration>;

export interface ProcessingStationGroupNamesConfigurationQueryProps {
  processingStationGroupNamesConfigurationQuery: ProcessingStationGroupNamesConfigurationQuery;
}
