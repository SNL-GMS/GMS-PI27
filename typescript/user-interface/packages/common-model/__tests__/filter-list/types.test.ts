import {
  isCascadeFilterDefinition,
  isLinearFilterDefinition
} from '../../src/ts/filter/filter-util';
import type {
  CascadeFilterDefinition,
  CascadeFilterDescription,
  LinearFilterDefinition,
  LinearFilterDescription
} from '../../src/ts/filter/types';
import { BandType, FilterType, LinearFilterType } from '../../src/ts/filter/types';

const linearFilterDescription: LinearFilterDescription = Object.freeze({
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  causal: true,
  comments: 'Test description comments',
  highFrequencyHz: 0.8,
  lowFrequencyHz: 0.3,
  order: 2,
  passBandType: BandType.BAND_PASS,
  zeroPhase: true
});

const sampleFilterDefinition: LinearFilterDefinition = Object.freeze({
  id: 'Sample Filter Definition Name',
  name: 'Sample Filter Definition Name',
  comments: 'Sample Filter Definition Comments',
  filterDescription: linearFilterDescription
});

const cascadeFilterDescription: CascadeFilterDescription = Object.freeze({
  comments: 'description comments',
  causal: true,
  filterType: FilterType.CASCADE,
  filterDescriptions: [
    {
      causal: true,
      comments: 'Test description 1 comments',
      filterType: FilterType.LINEAR,
      linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
      highFrequencyHz: 0.8,
      lowFrequencyHz: 0.3,
      order: 1,
      passBandType: BandType.BAND_PASS,
      zeroPhase: false
    } as LinearFilterDescription,
    {
      causal: false,
      comments: 'Test description 2 comments',
      filterType: FilterType.LINEAR,
      linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
      highFrequencyHz: 0.9,
      lowFrequencyHz: 0.4,
      order: 2,
      passBandType: BandType.BAND_PASS,
      zeroPhase: true
    } as LinearFilterDescription
  ],
  parameters: {
    groupDelaySec: 1,
    sampleRateHz: 40,
    sampleRateToleranceHz: 20
  }
});

const sampleCascadeFilterDefinition: CascadeFilterDefinition = Object.freeze({
  id: 'Sample Cascaded Filter Definition Name',
  name: 'Sample Cascaded Filter Definition Name',
  comments: 'Sample Cascaded Filter Definition Comments',
  filterDescription: cascadeFilterDescription
});

describe('Common Model Filter List Types Test', () => {
  it('is defined is defined', () => {
    expect(isLinearFilterDefinition).toBeDefined();
    expect(isCascadeFilterDefinition).toBeDefined();
  });

  it('can check if linear filter definition', () => {
    expect(isLinearFilterDefinition(sampleFilterDefinition)).toBeTruthy();
    expect(isLinearFilterDefinition(sampleCascadeFilterDefinition)).toBeFalsy();
  });

  it('can check if cascaded filter definition', () => {
    expect(isCascadeFilterDefinition(sampleCascadeFilterDefinition)).toBeTruthy();
    expect(isCascadeFilterDefinition(sampleFilterDefinition)).toBeFalsy();
  });
});
