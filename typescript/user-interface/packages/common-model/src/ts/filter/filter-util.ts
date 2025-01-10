import type {
  AutoRegressiveFilterDefinition,
  CascadeFilterDefinition,
  CascadeFilterDescription,
  CascadeFilterParameters,
  Filter,
  FilterDefinition,
  FilterDefinitionType,
  FilterDescriptionType,
  FilterError,
  LinearFilterDefinition,
  LinearFilterDescription,
  LinearFilterParameters,
  Parameters,
  PhaseMatchFilterDefinition
} from './types';
import { FilterType, UNFILTERED } from './types';

const getFilterNameIfExists = (filter: Filter | undefined): string | null | undefined =>
  filter?.filterDefinition?.name ?? filter?.namedFilter;

/**
 * Gets the unique id for a filter, which is its name, or `unfiltered`.
 *
 * @param filter the filter from which to get the id. If undefined, will return `unfiltered`
 * @param fallbackFilterName the filter name to fallback on if one is not found, falls back
 * to 'unfiltered' which is not necessarily the default filter
 */
export const getFilterName = (
  filter: Filter | undefined,
  fallbackFilterName: string = UNFILTERED
): string => getFilterNameIfExists(filter) ?? fallbackFilterName;

/**
 * Type guard to check and see if an error is a FilterError type
 */
export const isFilterError = (e: Error): e is FilterError => {
  return !!(e as FilterError).isFilterError;
};

/**
 * Gets a combined FilterNameId, used in a ProcessedItemsCacheRecord
 *
 * @param filter the filter to be applied
 * @param filterDefinition the filter definition to be applied (may not be the filter definition of the filter)
 * @returns a combination of the namedFilter name (if it exists) + filter definition name
 */
export const getCombinedFilterId = (filter: Filter, filterDefinition: FilterDefinition): string => {
  return `${filter.namedFilter || ''}${filterDefinition.name}`;
};

/**
 * Test if the object is a LinearFilterParameter
 * @param object
 * @returns
 */
export function isLinearFilterParameters(
  object: Parameters | undefined | null
): object is LinearFilterParameters {
  return (
    object != null &&
    (object as LinearFilterParameters).sampleRateHz != null &&
    (object as LinearFilterParameters).sampleRateToleranceHz != null
  );
}

/**
 * Test if the object is a CascadeFilterParameter
 * @param object
 * @returns
 */
export function isCascadeFilterParameters(
  object: Parameters | undefined | null
): object is CascadeFilterParameters {
  return (
    object != null &&
    (object as CascadeFilterParameters).sampleRateHz != null &&
    (object as CascadeFilterParameters).sampleRateToleranceHz != null
  );
}

/**
 * Test if the object is a CascadeFilterParameter
 * @param object
 * @returns
 */
export function isPhaseMatchFilterDefinition(
  object: FilterDefinitionType
): object is PhaseMatchFilterDefinition {
  return object != null && object.filterDescription.filterType === FilterType.PHASE_MATCH;
}

/**
 * Test if the object is a AutoRegressiveFilterDefinition
 * @param object
 * @returns
 */
export function isAutoRegressiveFilterDefinition(
  object: FilterDefinitionType
): object is AutoRegressiveFilterDefinition {
  return object != null && object.filterDescription.filterType === FilterType.AUTOREGRESSIVE;
}

/**
 * Test if the object is a LinearFilterDefinition
 * @param object
 * @returns
 */
export function isLinearFilterDefinition(
  object: FilterDefinitionType
): object is LinearFilterDefinition {
  return object != null && object.filterDescription.filterType === FilterType.LINEAR;
}

/**
 * Test if the object is a CascadeFilterDefinition
 * @param object
 * @returns
 */
export function isCascadeFilterDefinition(
  object: FilterDefinitionType
): object is CascadeFilterDefinition {
  return object != null && object.filterDescription.filterType === FilterType.CASCADE;
}

/**
 * Test if the object is a FilterDefinition
 * @param object
 * @returns
 */
export function isFilterDefinition(
  object: FilterDefinition | Record<string, any> | undefined | null
): object is FilterDefinition {
  if (
    object?.filterDescription?.filterType &&
    Object.values(FilterType).includes(object?.filterDescription?.filterType) &&
    object?.name &&
    object?.comments
  ) {
    return true;
  }
  return false;
}

/**
 * Test if the object is a LinearFilterDescription
 * @param object
 * @returns
 */
export function isLinearFilterDescription(
  object: FilterDescriptionType
): object is LinearFilterDescription {
  return object != null && object.filterType === FilterType.LINEAR;
}

/**
 * Test if the object is a CascadeFilterDescription
 * @param object
 * @returns
 */
export function isCascadeFilterDescription(
  object: FilterDescriptionType
): object is CascadeFilterDescription {
  return object != null && object.filterType === FilterType.CASCADE;
}

/**
 * Test if the object is a PhaseMatchFilterDescription
 * @param object
 * @returns
 */
export function isPhaseMatchFilterDescription(
  object: FilterDescriptionType
): object is CascadeFilterDescription {
  return object != null && object.filterType === FilterType.PHASE_MATCH;
}

/**
 * Test if the object is a AutoRegressiveFilterDescription
 * @param object
 * @returns
 */
export function isAutoRegressiveFilterDescription(
  object: FilterDescriptionType
): object is CascadeFilterDescription {
  return object != null && object.filterType === FilterType.AUTOREGRESSIVE;
}
