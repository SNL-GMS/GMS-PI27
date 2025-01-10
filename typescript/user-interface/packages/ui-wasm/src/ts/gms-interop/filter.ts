import { FilterUtil } from '@gms/common-model';
import type { FilterDefinition } from '@gms/common-model/lib/filter/types';

import { defaultIndexInc, defaultIndexOffset } from './filters/constants';
import { cascadeFilterApply, iirFilterApply } from './filters/filter-apply';

/**
 * Applies a Filter Definition to the provided data (filters the data).
 *
 * !NOTE: the data is in a format like [time,value,time,value,...] then set the index offset appropriately
 *
 * @param filterDefinition a Linear Filter Definition
 * @param data  waveform data
 * @param taper number of samples for cosine taper
 * @param removeGroupDelay optional boolean to determine if group delay should be applied, defaults to false
 * @param indexOffset the index offset (starting position) when accessing the data
 * @param indexInc the index incrementor (starting from indexOffset) used when accessing the data
 * @returns the filtered waveform data
 */
export const filter = async (
  filterDefinition: FilterDefinition,
  data: Float64Array,
  taper: number,
  removeGroupDelay: boolean,
  indexOffset: number = defaultIndexOffset,
  indexInc: number = defaultIndexInc
): Promise<Float64Array> => {
  // TODO add check for autoRegressive and phaseMatch
  if (FilterUtil.isLinearFilterDefinition(filterDefinition)) {
    // TODO check for fir filter apply
    return iirFilterApply(
      filterDefinition.filterDescription,
      data,
      taper,
      removeGroupDelay,
      indexOffset,
      indexInc
    );
  }

  if (FilterUtil.isCascadeFilterDefinition(filterDefinition)) {
    return cascadeFilterApply(
      filterDefinition.filterDescription,
      data,
      taper,
      removeGroupDelay,
      indexOffset,
      indexInc
    );
  }

  throw new Error(`Invalid filter definition provided, unable to filter data`);
};
