import { FilterUtil } from '@gms/common-model';
import type { FilterDefinition } from '@gms/common-model/lib/filter/types';

import {
  isCascadeFilterDefinitionDesigned,
  isLinearFilterDefinitionDesigned
} from './filters/util';

/**
 * Returns true if the filter definition is already designed, false otherwise
 *
 * @param filterDefinition the filter definition to check if it is designed
 * @param sampleRateHz the sample rate to use if provided for checking if the
 * filter definition is designed for that sample rate
 */
export const isDesigned = (
  filterDefinition: FilterDefinition | undefined,
  sampleRateHz?: number
): boolean => {
  if (FilterUtil.isLinearFilterDefinition(filterDefinition)) {
    return isLinearFilterDefinitionDesigned(filterDefinition, sampleRateHz);
  }

  if (FilterUtil.isCascadeFilterDefinition(filterDefinition)) {
    return isCascadeFilterDefinitionDesigned(filterDefinition, sampleRateHz);
  }
  return false;
};
