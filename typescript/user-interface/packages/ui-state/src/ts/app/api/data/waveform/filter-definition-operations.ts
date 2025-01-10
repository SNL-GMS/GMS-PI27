import type { FilterTypes } from '@gms/common-model';

import { designFilterDefinitions } from '../../../../workers/api/ui-filter-processor';
import type { AppDispatch } from '../../../store';
import { processingConfigurationApiSlice } from '../../processing-configuration';
import { addDesignedFilterDefinitions } from '.';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const DEFAULT_DESIGNED_SAMPLE_RATES_FALLBACK = [1, 4, 20, 50, 40, 80, 100];
const DEFAULT_GROUP_DELAY_SECS_FALLBACK = 0;
const DEFAULT_SAMPLE_RATE_TOLERANCE_HZ_FALLBACK = 0.01;
const DEFAULT_TAPER_FALLBACK = 0;
const DEFAULT_REMOVE_GROUP_DELAY_FALLBACK = false;

/**
 * An operation to design filter definitions and add them to
 * the Redux store (cache)
 *
 * @param filterDefinitions the filter definitions
 * @param sampleRates the different sample rates which we should design each filter definition for
 * @param groupDelaySec the group delay seconds config setting
 * @param sampleRateToleranceHz the sample rate tolerance in hertz config setting
 * @param taper the taper config setting
 * @param removeGroupDelay the remove group delay config setting
 */
export const designFilterDefinitionsAndAddToCache =
  (
    filterDefinitions: FilterTypes.FilterDefinition[],
    sampleRates: number[],
    groupDelaySec: number,
    sampleRateToleranceHz: number,
    taper: number,
    removeGroupDelay: boolean
  ) =>
  async (dispatch): Promise<void> => {
    const designedFilterDefinitions = await designFilterDefinitions(
      filterDefinitions,
      sampleRates,
      groupDelaySec,
      sampleRateToleranceHz,
      taper,
      removeGroupDelay
    );
    dispatch(
      addDesignedFilterDefinitions(
        designedFilterDefinitions.reduce<FilterTypes.FilterDefinition[]>((filterDefs, fd) => {
          if (fd.status === 'fulfilled') {
            return [...filterDefs, fd.value];
          }
          return filterDefs;
        }, [])
      )
    );
  };

/**
 * Processes the retrieved undesigned filter definitions from a service endpoint.
 * This helper function gets the necessary processing configuration settings and for designing
 * all of the provided filter definitions for given configured sample rates. It then dispatches
 * and updates the Redux store to cache the designed filter definitions.
 *
 * @param filterDefinitions the undesigned filter definitions retrieved from a service endpoint
 * @param dispatch the redux dispatch function for dispatching any updates to the state
 */
export const processFilterDefinitions = async (
  filterDefinitions: FilterTypes.FilterDefinition[],
  dispatch: AppDispatch
): Promise<void> => {
  if (filterDefinitions && filterDefinitions.length > 0) {
    // fetch the processing configuration
    const getProcessingAnalystConfigurationQuery = dispatch(
      processingConfigurationApiSlice.endpoints.getProcessingAnalystConfiguration.initiate()
    );

    const processingAnalystConfigurationQuery = await getProcessingAnalystConfigurationQuery;
    const {
      gmsFilters: {
        defaultDesignedSampleRates,
        defaultGroupDelaySecs,
        defaultSampleRateToleranceHz,
        defaultTaper,
        defaultRemoveGroupDelay
      }
    } = processingAnalystConfigurationQuery.data ?? {
      gmsFilters: {
        defaultDesignedSampleRates: undefined,
        defaultGroupDelaySecs: undefined,
        defaultSampleRateToleranceHz: undefined,
        defaultTaper: undefined,
        defaultRemoveGroupDelay: undefined
      }
    };

    // design filter definitions and add to the cache
    await dispatch(
      designFilterDefinitionsAndAddToCache(
        filterDefinitions,
        defaultDesignedSampleRates || DEFAULT_DESIGNED_SAMPLE_RATES_FALLBACK,
        defaultGroupDelaySecs || DEFAULT_GROUP_DELAY_SECS_FALLBACK,
        defaultSampleRateToleranceHz || DEFAULT_SAMPLE_RATE_TOLERANCE_HZ_FALLBACK,
        defaultTaper || DEFAULT_TAPER_FALLBACK,
        defaultRemoveGroupDelay || DEFAULT_REMOVE_GROUP_DELAY_FALLBACK
      )
    );

    // remove subscription to the processing configuration query
    getProcessingAnalystConfigurationQuery.unsubscribe();
  }
};
