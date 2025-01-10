import type { ChannelSegmentTypes, FilterTypes, WaveformTypes } from '@gms/common-model';
import type { FilterDefinition } from '@gms/common-model/lib/filter/types';
import { design, filter } from '@gms/ui-wasm';
import type { WeavessTypes } from '@gms/weavess-core';

import type { SampleRate } from '../../../types';
import { changeUniqueIdFilter, storePositionBuffer } from '../util/position-buffer-util';
import { WaveformStore } from '../worker-store';

// !NOTE: the data is in a format like [time,value,time,value,...] set the index offset appropriately
const indexOffset = 1; // start with the first y value of the data
const indexInc = 2; // have the algorithm skip each x value of the data (only filter y values)

/**
 * Defines the parameters for the {@link designFilter} operation.
 */
interface DesignFilterParams {
  filterDefinition: FilterTypes.FilterDefinition;
  taper: number;
  removeGroupDelay: boolean;
}

/**
 * Designs a Filter Definition by populating the coefficients
 *
 * @param filterDefinition the filter definition to design
 * @param taper number of samples for cosine taper
 * @param removeGroupDelay optional boolean to determine if group delay should be applied
 * @returns the designed filter definition
 */
export const designFilter = async ({
  filterDefinition
}: DesignFilterParams): Promise<FilterTypes.FilterDefinition> =>
  Promise.resolve(design(filterDefinition));

const filterDataSegments = async (
  timeseriesList: WaveformTypes.Waveform[],
  filterDefinitions: Record<SampleRate, FilterDefinition>,
  taper: number,
  removeGroupDelay: boolean
): Promise<WaveformTypes.Waveform[]> => {
  return Promise.all(
    timeseriesList.map(async (timeseries: WaveformTypes.Waveform) => {
      if (timeseries._uiClaimCheckId) {
        // Get wave from store
        const waveformData = await WaveformStore.retrieve(timeseries._uiClaimCheckId);
        // no waveform for claim check id
        if (!waveformData) {
          throw new Error(`No waveform found for claim check ${timeseries._uiClaimCheckId}.`);
        }

        // Apply filter to wave
        if (waveformData) {
          const filterPromise = filter(
            filterDefinitions[timeseries.sampleRateHz],
            waveformData,
            taper,
            removeGroupDelay,
            indexOffset,
            indexInc
          );

          // store the new filtered data in the waveform cache
          const filteredId = changeUniqueIdFilter(
            timeseries._uiClaimCheckId,
            filterDefinitions[timeseries.sampleRateHz].name
          );
          await storePositionBuffer(filteredId, filterPromise);

          return {
            ...timeseries,
            // update the claim check id for the new data segment
            _uiClaimCheckId: filteredId
          };
        }
      }
      throw new Error('Filter processor filter operation was passed invalid channelSegment data');
    })
  );
};

/**
 * Defines the parameters for the {@link filterChannelSegment} operation.
 */
interface FilterChannelSegmentParams {
  channelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>;
  filterDefinitions: Record<SampleRate, FilterDefinition>;
  taper: number;
  removeGroupDelay: boolean;
}

export const filterChannelSegment = async ({
  channelSegment,
  filterDefinitions,
  taper,
  removeGroupDelay
}: FilterChannelSegmentParams): Promise<
  ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>
> => {
  const filterDefinitionName = Object.values(filterDefinitions)?.[0]?.name;

  const timeseries = await filterDataSegments(
    channelSegment.timeseries,
    filterDefinitions,
    taper,
    removeGroupDelay
  );

  const sampleRates = new Set(timeseries.map(ts => ts.sampleRateHz));
  const filtersBySampleRate: Record<number, FilterTypes.FilterDefinition> = {};
  sampleRates.forEach(sampleRate => {
    filtersBySampleRate[sampleRate] = filterDefinitions[sampleRate];
  });

  return {
    ...channelSegment,
    _uiFilterId: filterDefinitionName,
    _uiFiltersBySampleRate: filtersBySampleRate,
    timeseries
  };
};

/**
 * Defines the parameters for the {@link filterChannelSegments} operation.
 */
interface FilterChannelSegmentsParams {
  channelSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[];
  filterDefinitions: Record<SampleRate, FilterDefinition>;
  taper: number;
  removeGroupDelay: boolean;
  domainTimeRange: WeavessTypes.TimeRange;
}

/**
 * Applies a Filter Definition to the provided channel segments (filters the data).
 *
 * @param channelSegments the waveform channel segments
 * @param filterDefinition a Linear Filter Definition
 * @param taper number of samples for cosine taper
 * @param removeGroupDelay optional boolean to determine if group delay should be applied
 * @returns the filtered waveform channel segments
 */
export const filterChannelSegments = async ({
  channelSegments,
  filterDefinitions,
  taper,
  removeGroupDelay
}: FilterChannelSegmentsParams): Promise<
  ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[]
> => {
  return Promise.all(
    channelSegments.map(async channelSegment => {
      return filterChannelSegment({
        channelSegment,
        filterDefinitions,
        taper,
        removeGroupDelay
      });
    })
  );
};
