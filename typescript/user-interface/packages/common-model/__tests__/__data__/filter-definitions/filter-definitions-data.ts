/* eslint-disable @typescript-eslint/no-magic-numbers */

import { FilterTypes } from '../../../src/ts/common-model';
import type {
  CascadeFilterDefinition,
  CascadeFilterDescription,
  Filter,
  LinearFilterDefinition,
  LinearFilterDescription
} from '../../../src/ts/filter/types';
import {
  BandType,
  FilterDefinitionUsage,
  FilterType,
  LinearFilterType
} from '../../../src/ts/filter/types';

export const smallSampleData = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

export const namedFilter: Filter = Object.freeze({
  withinHotKeyCycle: true,
  namedFilter: FilterDefinitionUsage.DETECTION
});

// Linear filters
export const linearFilterDescription: LinearFilterDescription = Object.freeze({
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  causal: true,
  comments: 'Test description comments',
  highFrequencyHz: 0.8,
  lowFrequencyHz: 0.3,
  order: 2,
  passBandType: BandType.BAND_PASS,
  zeroPhase: true,
  parameters: {
    groupDelaySec: 1,
    sampleRateHz: 30,
    sampleRateToleranceHz: 20
  }
});

export const sampleFilterName: string = 'Sample Filter Definition Name';
export const linearFilterDefinition: LinearFilterDefinition = Object.freeze({
  name: sampleFilterName,
  comments: 'Sample Filter Definition Comments',
  filterDescription: linearFilterDescription
});

export const linearFilter: Filter = Object.freeze({
  withinHotKeyCycle: false,
  filterDefinition: linearFilterDefinition
});

export const linearFilterDescriptionDesigned: LinearFilterDescription = Object.freeze({
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  causal: true,
  comments: 'Test description comments',
  highFrequencyHz: 0.8,
  lowFrequencyHz: 0.3,
  order: 2,
  passBandType: BandType.BAND_PASS,
  zeroPhase: true,
  parameters: {
    groupDelaySec: 0,
    sampleRateHz: 30,
    sampleRateToleranceHz: 20,
    sosNumeratorCoefficients: [
      0.051260671430394325, 0, -0.051260671430394325, 0.04975617929623897, 0, -0.04975617929623897
    ],
    sosDenominatorCoefficients: [
      1, -1.948644462809474, 0.9535055211550546, 1, -1.8832243879711594, 0.904398146520905
    ]
  }
});

export const linearFilterDefinitionDesigned: LinearFilterDefinition & {
  filterDescription: LinearFilterDescription;
} = Object.freeze({
  name: sampleFilterName,
  comments: 'Sample Filter Definition Comments',
  filterDescription: linearFilterDescriptionDesigned
});

// Cascade filters
export const cascadeFilterDescription: CascadeFilterDescription = Object.freeze({
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
      zeroPhase: false,
      parameters: {
        groupDelaySec: 1,
        sampleRateHz: 30,
        sampleRateToleranceHz: 25
      }
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
      zeroPhase: true,
      parameters: {
        groupDelaySec: 2,
        sampleRateHz: 30,
        sampleRateToleranceHz: 20
      }
    } as LinearFilterDescription
  ],
  parameters: {
    groupDelaySec: 1,
    sampleRateHz: 30,
    sampleRateToleranceHz: 20
  }
});

export const cascadeFilterDefinition: CascadeFilterDefinition = Object.freeze({
  name: 'Sample Cascaded Filter Definition Name',
  comments: 'Sample Cascaded Filter Definition Comments',
  filterDescription: cascadeFilterDescription
});

export const cascadeFilterDescriptionDesigned: CascadeFilterDescription = Object.freeze({
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
      zeroPhase: false,
      parameters: {
        groupDelaySec: 0,
        sampleRateHz: 30,
        sampleRateToleranceHz: 25,
        sosNumeratorCoefficients: [0.04979797785108003, 0, -0.04979797785108003],
        sosDenominatorCoefficients: [1, -1.8904003492208719, 0.9004040442978398]
      }
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
      zeroPhase: true,
      parameters: {
        groupDelaySec: 0,
        sampleRateHz: 30,
        sampleRateToleranceHz: 20,
        sosNumeratorCoefficients: [
          0.05116189466948237, 0, -0.05116189466948237, 0.049852242083944294, 0,
          -0.049852242083944294
        ],
        sosDenominatorCoefficients: [
          1, -1.9405495176511949, 0.9489491381754016, 1, -1.8811938604110618, 0.908740617740765
        ]
      }
    } as LinearFilterDescription
  ],
  parameters: {
    groupDelaySec: 0,
    sampleRateHz: 30,
    sampleRateToleranceHz: 20
  }
});

export const cascadeFilterDefinitionDesigned: CascadeFilterDefinition = Object.freeze({
  name: 'Sample Cascaded Filter Definition Name',
  comments: 'Sample Cascaded Filter Definition Comments',
  filterDescription: cascadeFilterDescriptionDesigned
});

export const cascadeFilter: Filter = Object.freeze({
  withinHotKeyCycle: false,
  filterDefinition: cascadeFilterDefinition
});

// Set of filter definitions
export const filterDefinitionsData: FilterTypes.FilterDefinition[] = [
  {
    name: 'filter def name-1',
    comments: 'the comments 1',
    filterDescription: {
      causal: false,
      comments: 'the description comments 1',
      filterType: FilterType.LINEAR,
      linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
      highFrequencyHz: 1,
      lowFrequencyHz: 0.5,
      order: 1,
      parameters: {
        sosDenominatorCoefficients: [0.1, 1.0],
        sosNumeratorCoefficients: [1.1, 1.2],
        groupDelaySec: 3,
        sampleRateHz: 40,
        sampleRateToleranceHz: 2
      },
      passBandType: FilterTypes.BandType.BAND_PASS,
      zeroPhase: false
    }
  },
  {
    name: 'filter def name-2 / with slash',
    comments: 'the comments 2',
    filterDescription: {
      causal: true,
      comments: 'the description comments 2',
      filterType: FilterType.LINEAR,
      linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
      highFrequencyHz: 2,
      lowFrequencyHz: 0.25,
      order: 1,
      parameters: {
        sosDenominatorCoefficients: [0.2, 2.0],
        sosNumeratorCoefficients: [2, 2.2],
        groupDelaySec: 2,
        sampleRateHz: 20,
        sampleRateToleranceHz: 22
      },
      passBandType: FilterTypes.BandType.BAND_PASS,
      zeroPhase: true
    }
  }
];

export const unfilteredFilter: Filter = Object.freeze({
  withinHotKeyCycle: true,
  unfiltered: true
});
