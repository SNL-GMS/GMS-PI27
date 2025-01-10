import type { FilterTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, FilterUtil } from '@gms/common-model';
import type { Filter, FilterDefinition } from '@gms/common-model/lib/filter';
import { FilterError, getCombinedFilterId } from '@gms/common-model/lib/filter';
import produce from 'immer';

import type { FilterDefinitionsRecord, SampleRate, UiChannelSegment } from '../../types';
import { designFilterDefinitions } from '../../workers/api/ui-filter-processor';

/**
 * Will find all the unique sampleRates within uiChannelSegments by dataSegments.
 *
 * @param uiChannelSegments the uiChannelSegments will be used to find all unique sample rates
 * @param cachedFilterDefinitionsBySampleRate current record of cached filter definitions
 * @returns unique sample rates found in the given uiChannelSegments
 */
function getSampleRatesToDesign(
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  cachedFilterDefinitionsBySampleRate: Record<SampleRate, FilterDefinition> = {}
): number[] {
  const sampleRateMap = new Set<number>([]);
  const filterDefinitionSampleRates = Object.keys(cachedFilterDefinitionsBySampleRate).map(key =>
    Number(key)
  );
  uiChannelSegments.forEach(({ channelSegment }) => {
    channelSegment.timeseries.forEach(timeseries => {
      const waveform = timeseries;
      // If the sample rate does not exist in the cached filter definition sample rates
      if (
        waveform._uiClaimCheckId &&
        filterDefinitionSampleRates?.indexOf(waveform.sampleRateHz) < 0
      ) {
        sampleRateMap?.add(waveform.sampleRateHz);
      }
    });
  });

  return Array.from(sampleRateMap);
}

/**
 * Helper function to reduce complexity in designFiltersAndGetUpdatedFilterDefinitions
 *
 * @param currentFilter
 * @param uiChannelSegments
 * @param sampleRateHz
 * @param handleFilterError
 * @param channelName
 * @returns
 */
function handleDesignFilterPromiseErrors(
  currentFilter: Filter,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  sampleRateHz: number,
  handleFilterError: (error: FilterError) => void,
  channelName: string
): void {
  // type safety
  // if unfiltered or a named filter is passed in do nothing
  if (!currentFilter.filterDefinition) {
    return;
  }

  const failedChannelSegments = uiChannelSegments.filter(({ channelSegment }) => {
    return channelSegment.timeseries.find(timeseries => {
      const waveform = timeseries;
      // If the sample rate does not exist in the cached filter definition sample rates
      return waveform._uiClaimCheckId && waveform.sampleRateHz === sampleRateHz;
    });
  });

  failedChannelSegments.forEach(failedChannelSegment => {
    handleFilterError(
      new FilterError(
        `Error designing filter ${currentFilter.filterDefinition.name} for sample rate ${sampleRateHz}`,
        getCombinedFilterId(currentFilter, currentFilter.filterDefinition),
        channelName,
        ChannelSegmentTypes.Util.createChannelSegmentString(
          failedChannelSegment.channelSegmentDescriptor
        )
      )
    );
  });
}

/**
 * For any sample rate in the given ui channel segments, this will design
 * new versions of the filterDefinition given if they do not already exist in the cache.
 *
 * @param filterDefinition the current filter definition
 * @param uiChannelSegments the ui channel segments the filter will eventually apply to
 * @param cachedFilterDefinitions existing list of cached filter definitions
 * @param groupDelaySec the group delay seconds config setting
 * @param sampleRateToleranceHz the sample rate tolerance in hertz config setting
 * @param taper the taper config setting
 * @param removeGroupDelay the remove group delay config setting
 * @returns an object containing the newly created filter definitions as an array, and
 * an updated record of all cached and created filter definitions
 */
export async function designFiltersAndGetUpdatedFilterDefinitions(
  stationOrChannelName: string,
  currentFilter: Filter,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  cachedFilterDefinitions: FilterDefinitionsRecord,
  configSettings: {
    groupDelaySecs: number;
    sampleRateToleranceHz: number;
    taper: number;
    removeGroupDelay: boolean;
  },
  handleFilterError: (error: FilterError) => void
): Promise<FilterDefinitionsRecord> {
  // type safety
  // if unfiltered or a named filter is passed in do nothing
  if (!currentFilter.filterDefinition) {
    return cachedFilterDefinitions;
  }

  const { groupDelaySecs, sampleRateToleranceHz, taper, removeGroupDelay } = configSettings;

  const sampleRatesToDesign = getSampleRatesToDesign(
    uiChannelSegments,
    cachedFilterDefinitions[currentFilter.filterDefinition.name]
  );

  const newFilterDefinitions: FilterDefinition[] = [];
  let filterDefinitionRecord = { ...cachedFilterDefinitions };

  // Avoid running designFilterDefinitions if possible
  if (sampleRatesToDesign.length) {
    await designFilterDefinitions(
      [currentFilter.filterDefinition],
      sampleRatesToDesign,
      groupDelaySecs,
      sampleRateToleranceHz,
      taper,
      removeGroupDelay
    ).then((promises: PromiseSettledResult<FilterTypes.FilterDefinition>[]) => {
      promises.forEach(p => {
        if (p.status === 'fulfilled') {
          newFilterDefinitions.push(p.value);
        } else {
          handleDesignFilterPromiseErrors(
            currentFilter,
            uiChannelSegments,
            p.reason.sampleRateHz,
            handleFilterError,
            stationOrChannelName
          );
        }
      });
    });

    // Overwrite with newly updated definitions if we have newly designed filter defs
    filterDefinitionRecord = produce(cachedFilterDefinitions, draft => {
      // Update the record with new filter definitions
      newFilterDefinitions.forEach(fd => {
        if (!draft[fd.name]) draft[fd.name] = {};
        if (
          fd.filterDescription.parameters &&
          // TODO remove this when we add more filters like phaseMatch
          (FilterUtil.isLinearFilterParameters(fd.filterDescription.parameters) ||
            FilterUtil.isCascadeFilterParameters(fd.filterDescription.parameters))
        )
          // TODO phaseMatch filter will break this record
          draft[fd.name][fd.filterDescription.parameters.sampleRateHz] = fd;
      });
    });
  }

  return Promise.resolve(filterDefinitionRecord);
}
