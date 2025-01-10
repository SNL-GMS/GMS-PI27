import { FilterUtil } from '@gms/common-model';
import type {
  AutoRegressiveFilterDescription,
  CascadeFilterDescription,
  FilterDescription,
  LinearFilterDescription,
  PhaseMatchFilterDescription
} from '@gms/common-model/lib/filter/types';
import { FilterType, LinearFilterType } from '@gms/common-model/lib/filter/types';

/**
 * Validates linear description before use
 *
 * @param filterDescription LinearFilterDescription
 */

export function validateLinearFilterDescription(
  filterDescription:
    | FilterDescription
    | LinearFilterDescription
    | CascadeFilterDescription
    | AutoRegressiveFilterDescription
    | PhaseMatchFilterDescription
) {
  if (!FilterUtil.isLinearFilterDescription(filterDescription)) {
    throw new Error(`Not a valid LinearFilterDescription`);
  }
  if (filterDescription.linearFilterType !== LinearFilterType.IIR_BUTTERWORTH) {
    throw new Error(`FilterType of ${LinearFilterType.IIR_BUTTERWORTH} is only supported`);
  }

  if ((filterDescription as unknown as CascadeFilterDescription).filterDescriptions) {
    throw new Error(
      `Filter Descriptions should not be defined, not expecting Cascade Filter Definition`
    );
  }
  if (!filterDescription?.parameters) {
    throw new Error(
      `LinearFilterParameters must be defined for all Iir linear filter descriptions`
    );
  }
}

/**
 * Validates cascaded description before use
 *
 * @param filterDescription CascadeFilterDescription
 */
export function validateCascadeFilterDescription(filterDescription: CascadeFilterDescription) {
  if (filterDescription.filterType !== FilterType.CASCADE) {
    throw new Error(`FilterType must be of type ${FilterType.CASCADE}`);
  }

  if (!filterDescription.parameters || filterDescription.filterDescriptions.length === 0) {
    throw new Error(`Filter Descriptions should be defined for Cascade Filter Definition`);
  }

  if (
    filterDescription.parameters === undefined ||
    filterDescription.filterDescriptions.length === 0
  ) {
    throw new Error(`Filter Descriptions should be defined for Cascade Filter Definition`);
  }

  filterDescription.filterDescriptions.forEach(desc => {
    if (FilterUtil.isLinearFilterDescription(desc)) {
      validateLinearFilterDescription(desc);
    } else {
      throw new Error(
        `Filter Descriptions should not be defined, not expecting Cascade Filter Definition`
      );
    }
  });
}
