import { FilterUtil } from '@gms/common-model';
import type {
  CascadeFilterDefinition,
  CascadeFilterDescription,
  IirFilterParameters,
  LinearFilterDefinition,
  LinearFilterDescription,
  LinearFilterParameters
} from '@gms/common-model/lib/filter/types';

/**
 * Checks if Signal detection ArrivalTimeMeasurementValue
 *
 * @param object FeatureMeasurementValue
 * @returns boolean
 */
export function isIirFilterParameters(object: any): object is IirFilterParameters {
  return object.sosDenominatorCoefficients != null && object.sosNumeratorCoefficients != null;
}

/**
 * Returns true if the coefficients are populated; false otherwise.
 *
 * @param sosDenominatorCoefficients the `a` coefficients
 * @param sosNumeratorCoefficients the `b` coefficients
 * @returns true if the coefficients are populated; false otherwise
 */
export const areCoefficientsPopulated = (
  sosDenominatorCoefficients: number[] | undefined,
  sosNumeratorCoefficients: number[] | undefined
): boolean =>
  sosDenominatorCoefficients != null &&
  sosNumeratorCoefficients != null &&
  sosDenominatorCoefficients.length > 0 &&
  sosNumeratorCoefficients.length > 0 &&
  sosDenominatorCoefficients.length === sosNumeratorCoefficients.length;

/**
 * Returns true if the linear filter description is designed; false otherwise.
 *
 * @param parameters  the filter definition parameters
 * @param sampleRateHz (optional) the sample rate to use if provided for checking if
 * the filter definition is designed for that sample rate
 * @returns true if designed; false otherwise
 */
export const isLinearFilterParametersDesigned = (
  parameters: LinearFilterParameters | undefined,
  sampleRateHz?: number
): boolean => {
  // TODO: this function is actually looking for IirFilterParameters
  return (
    parameters?.sampleRateHz != null &&
    (sampleRateHz == null || sampleRateHz === parameters.sampleRateHz) &&
    isIirFilterParameters(parameters)
  );
};

/**
 * Returns true if the linear filter description is designed; false otherwise.
 *
 * @param filterDefinition the filter definition
 * @param sampleRateHz (optional) the sample rate to use if provided for checking if
 * the filter definition is designed for that sample rate
 * @returns true if designed; false otherwise
 */
const isLinearFilterDescriptionDesigned = (
  filterDescription: LinearFilterDescription | undefined,
  sampleRateHz?: number
): boolean => {
  if (!FilterUtil.isLinearFilterParameters(filterDescription?.parameters)) {
    throw new Error(`Not valid LinearFilterParameters`);
  }
  return isLinearFilterParametersDesigned(filterDescription?.parameters, sampleRateHz);
};

/**
 * Returns true if the linear filter definition is designed; false otherwise.
 *
 * @param filterDefinition the linear filter definition
 * @param sampleRateHz (optional) the sample rate to use if provided for checking if
 * the filter definition is designed for that sample rate
 * @returns true if designed; false otherwise
 */
export const isLinearFilterDefinitionDesigned = (
  filterDefinition: LinearFilterDefinition | undefined,
  sampleRateHz?: number
): boolean => isLinearFilterDescriptionDesigned(filterDefinition?.filterDescription, sampleRateHz);

/**
 * Returns true if the cascaded filter definition is designed; false otherwise.
 *
 * @param filterDefinition the cascaded filter definition
 * @param sampleRateHz (optional) the sample rate to use if provided for checking if
 * the filter definition is designed for that sample rate
 * @returns true if designed; false otherwise
 */
export const isCascadeFilterDefinitionDesigned = (
  filterDefinition: CascadeFilterDefinition,
  sampleRateHz?: number
): boolean =>
  filterDefinition.filterDescription.filterDescriptions.every(desc => {
    if (FilterUtil.isLinearFilterDescription(desc)) {
      return isLinearFilterDescriptionDesigned(desc, sampleRateHz);
    }
    return false;
  });

/**
 * Returns true if the cascaded filter description is designed; false otherwise.
 *
 * @param filterDescription the cascaded filter description
 * @param sampleRateHz (optional) the sample rate to use if provided for checking if
 * the filter definition is designed for that sample rate
 * @returns true if designed; false otherwise
 */
export const isCascadeFilterDescriptionDesigned = (
  filterDescription: CascadeFilterDescription,
  sampleRateHz?: number
): boolean =>
  filterDescription.filterDescriptions.every(desc => {
    if (FilterUtil.isLinearFilterDescription(desc)) {
      return isLinearFilterDescriptionDesigned(desc, sampleRateHz);
    }
    return false;
  });
