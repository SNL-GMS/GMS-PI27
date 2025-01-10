import { FilterUtil } from '@gms/common-model';
import type { FilterDefinition } from '@gms/common-model/lib/filter/types';

import { cascadeFilterDesign, iirFilterDesign } from './filters/filter-design';

/**
 * Designs a Filter Definition by populating the coefficients
 *
 * @param filterDefinition the filter definition to design
 * @returns the designed filter definition
 */
export const design = async (filterDefinition: FilterDefinition): Promise<FilterDefinition> => {
  if (FilterUtil.isLinearFilterDefinition(filterDefinition)) {
    const filterDesc = await iirFilterDesign(filterDefinition.filterDescription);
    return {
      name: filterDefinition.name,
      comments: filterDefinition.comments,
      filterDescription: filterDesc
    };
  }

  if (FilterUtil.isCascadeFilterDefinition(filterDefinition)) {
    const filterDesc = await cascadeFilterDesign(filterDefinition.filterDescription);
    return {
      name: filterDefinition.name,
      comments: filterDefinition.comments,
      filterDescription: filterDesc
    };
  }

  throw new Error(`Invalid filter definition provided, unable to design filter definition`);
};
