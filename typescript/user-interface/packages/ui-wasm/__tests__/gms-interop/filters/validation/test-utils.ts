/* eslint-disable @typescript-eslint/no-magic-numbers */
import { FilterUtil } from '@gms/common-model';
import type {
  CascadeFilterDefinition,
  CascadeFilterDescription,
  CascadeFilterParameters,
  FilterDefinition,
  IirFilterParameters,
  LinearFilterDefinition,
  LinearFilterDescription,
  LinearFilterParameters
} from '@gms/common-model/lib/filter/types';

import { isIirFilterParameters } from '../../../../src/ts/gms-interop/filters/util';

export const DEFAULT_PRECISION = 11; // number of decimal places

export function numberPrecisionCompare(
  a: number,
  b: number,
  precision: number = DEFAULT_PRECISION
): void {
  const actual = parseFloat((Math.abs(b - a) * 1e-8).toFixed(precision));
  const expected = parseFloat((Math.abs(b) * 1e-8).toFixed(precision));
  expect(actual).toBeLessThanOrEqual(expected);
}

export function precisionCompare(
  a: number[] | Float64Array | undefined | null,
  b: number[] | Float64Array | undefined | null,
  precision: number = DEFAULT_PRECISION
): void {
  expect((a == null && b != null) || (a != null && b == null)).toBeFalsy();
  expect(a?.length === b?.length).toBeTruthy();
  if (a && b) {
    a.every((val: number, i: number) => numberPrecisionCompare(val, b[i], precision));
  }
}

export function areLinearFilterParamsEquivalent(
  expected: LinearFilterParameters | IirFilterParameters | undefined,
  actual: LinearFilterParameters | IirFilterParameters | undefined
) {
  expect(actual?.groupDelaySec).toEqual(expected?.groupDelaySec);
  expect(actual?.sampleRateHz).toEqual(expected?.sampleRateHz);
  expect(actual?.sampleRateToleranceHz).toEqual(expected?.sampleRateToleranceHz);
  expect(isIirFilterParameters(expected)).toEqual(isIirFilterParameters(actual));

  if (isIirFilterParameters(expected) && isIirFilterParameters(actual)) {
    precisionCompare(actual?.sosDenominatorCoefficients, expected?.sosDenominatorCoefficients);
    precisionCompare(actual?.sosNumeratorCoefficients, expected?.sosNumeratorCoefficients);
  }
}

export function areLinearFilterDescEquivalent(
  expected: LinearFilterDescription,
  actual: LinearFilterDescription
) {
  expect(actual.causal).toEqual(expected.causal);
  expect(actual.comments).toEqual(expected.comments);
  expect(actual.filterType).toEqual(expected.filterType);
  expect(actual.highFrequencyHz).toEqual(expected.highFrequencyHz);
  expect(actual.lowFrequencyHz).toEqual(expected.lowFrequencyHz);
  expect(actual.order).toEqual(expected.order);
  expect(actual.passBandType).toEqual(expected.passBandType);
  expect(actual.zeroPhase).toEqual(expected.zeroPhase);
  areLinearFilterParamsEquivalent(expected.parameters, actual.parameters);
}
export function areCascadeFilterParametersEquivalent(
  actual: CascadeFilterParameters | undefined,
  expected: CascadeFilterParameters | undefined
) {
  expect(actual?.groupDelaySec).toEqual(expected?.groupDelaySec);
  expect(actual?.sampleRateHz).toEqual(expected?.sampleRateHz);
  expect(actual?.sampleRateToleranceHz).toEqual(expected?.sampleRateToleranceHz);
}

export function areCascadedFilterEquivalent(
  expected: CascadeFilterDescription,
  actual: CascadeFilterDescription
) {
  expect(actual.causal).toEqual(expected.causal);
  expect(actual.comments).toEqual(expected.comments);
  expect(actual.filterType).toEqual(expected.filterType);
  areCascadeFilterParametersEquivalent(actual.parameters, expected.parameters);
  for (let count = 0; count < actual.filterDescriptions.length; count += 1) {
    const actualFilterDescription = actual.filterDescriptions[count];
    const expectedFilterDescription = expected.filterDescriptions[count];

    if (
      FilterUtil.isLinearFilterDescription(actualFilterDescription) &&
      FilterUtil.isLinearFilterDescription(expectedFilterDescription)
    ) {
      areLinearFilterDescEquivalent(actualFilterDescription, expectedFilterDescription);
    }
  }
}

function areLinearFilterDefinitionsEquivalent(
  expected: LinearFilterDefinition,
  actual: LinearFilterDefinition
) {
  expect(actual.name).toEqual(expected.name);
  expect(actual.comments).toEqual(expected.comments);
  areLinearFilterDescEquivalent(expected.filterDescription, actual.filterDescription);
}

function areCascadeFilterDefinitionsEquivalent(
  expected: CascadeFilterDefinition,
  actual: CascadeFilterDefinition
) {
  expect(actual.name).toEqual(expected.name);
  expect(actual.comments).toEqual(expected.comments);
  areCascadedFilterEquivalent(expected.filterDescription, actual.filterDescription);
}

export function areFilterDefinitionsEquivalent(
  expected: FilterDefinition | undefined,
  actual: FilterDefinition | undefined
) {
  if (
    FilterUtil.isLinearFilterDefinition(actual) &&
    FilterUtil.isLinearFilterDefinition(expected)
  ) {
    areLinearFilterDefinitionsEquivalent(expected, actual);
  } else if (
    FilterUtil.isCascadeFilterDefinition(actual) &&
    FilterUtil.isCascadeFilterDefinition(expected)
  ) {
    areCascadeFilterDefinitionsEquivalent(expected, actual);
  } else {
    throw new Error('Filter Definitions are mismatched');
  }
}
