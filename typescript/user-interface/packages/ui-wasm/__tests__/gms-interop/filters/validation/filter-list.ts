import type {
  CascadeFilterDefinition,
  CascadeFilterDescription,
  CascadeFilterParameters,
  FilterList,
  IirFilterParameters,
  LinearFilterDefinition,
  LinearFilterDescription,
  LinearFilterParameters
} from '@gms/common-model/lib/filter/types';
import { BandType, FilterType, LinearFilterType } from '@gms/common-model/lib/filter/types';

// BW_BR_NONCAUSAL_FILTER
const BW_BR_NONCAUSAL_FILTER_PARAMETERS: IirFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0,
  sosDenominatorCoefficients: [],
  sosNumeratorCoefficients: []
};

const BW_BR_NONCAUSAL_FILTER_DESCRIPTION: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 3.0,
  order: 20,
  zeroPhase: true,
  passBandType: BandType.BAND_REJECT,
  parameters: BW_BR_NONCAUSAL_FILTER_PARAMETERS,
  comments: 'BW 0.5 3.0 20 BR non-causal',
  causal: false
};

const BW_BR_NONCAUSAL_FILTER_DEFINITION: LinearFilterDefinition = {
  filterDescription: BW_BR_NONCAUSAL_FILTER_DESCRIPTION,
  name: 'Test Filter 4',
  comments: 'Simple BR Filter'
};

// BW_BP_CAUSAL
const BW_BP_CAUSAL_FILTER_PARAMETERS: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const BW_BP_CAUSAL_FILTER_DESCRIPTION: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 3.0,
  order: 10,
  zeroPhase: false,
  passBandType: BandType.BAND_PASS,
  parameters: BW_BP_CAUSAL_FILTER_PARAMETERS,
  comments: 'BW 0.5 3.0 10 BP causal',
  causal: true
};

const BW_BP_CAUSAL_FILTER_DEFINITION: LinearFilterDefinition = {
  filterDescription: BW_BP_CAUSAL_FILTER_DESCRIPTION,
  name: 'Test Filter 3',
  comments: 'Simple BP Filter'
};

// BW_HP_NONCAUSAL_FILTER
const BW_HP_NONCAUSAL_FILTER_PARAMETERS: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const BW_HP_NONCAUSAL_FILTER_DESCRIPTION: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 3.0,
  order: 3,
  zeroPhase: true,
  passBandType: BandType.HIGH_PASS,
  parameters: BW_HP_NONCAUSAL_FILTER_PARAMETERS,
  comments: 'BW 0.5 3.0 3 HP non-causal',
  causal: false
};

const BW_HP_NONCAUSAL_DEFINITION: LinearFilterDefinition = {
  filterDescription: BW_HP_NONCAUSAL_FILTER_DESCRIPTION,
  name: 'Test Filter 2',
  comments: 'Simple HP Filter'
};

// BW_LP_CAUSAL_FILTER
const BW_LP_CAUSAL_FILTER_PARAMETERS: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const BW_LP_CAUSAL_FILTER_DESCRIPTION: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 3.0,
  order: 1,
  zeroPhase: false,
  passBandType: BandType.LOW_PASS,
  parameters: BW_LP_CAUSAL_FILTER_PARAMETERS,
  comments: 'BW 0.0 3.0 1 LP causal',
  causal: true
};

const BW_LP_CAUSAL_FILTER_DEFINITION: LinearFilterDefinition = {
  filterDescription: BW_LP_CAUSAL_FILTER_DESCRIPTION,
  name: 'Test Filter 1',
  comments: 'Simple LP Filter'
};

// CASCADED FILTER
const CASCADED_PARAMETERS_LPHP: CascadeFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_LP_FILTER_PARAMETERS_LPHP: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_LP_FILTER_LPHP: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 3.0,
  order: 7,
  zeroPhase: false,
  passBandType: BandType.LOW_PASS,
  parameters: CASCADED_LP_FILTER_PARAMETERS_LPHP,
  comments: 'BW 0.0 3.0 7 LP causal',
  causal: true
};

const CASCADED_HP_FILTER_PARAMETERS_LPHP: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_HP_FILTER_LPHP: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  comments: 'BW 0.5 0.0 1 HP non-causal',
  causal: false,
  passBandType: BandType.HIGH_PASS,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 3.0,
  order: 1,
  zeroPhase: true,
  parameters: CASCADED_HP_FILTER_PARAMETERS_LPHP
};

const CASCADED_FILTER_LPHP: CascadeFilterDescription = {
  filterType: FilterType.CASCADE,
  parameters: CASCADED_PARAMETERS_LPHP,
  filterDescriptions: [CASCADED_LP_FILTER_LPHP, CASCADED_HP_FILTER_LPHP],
  comments: 'Cascade BW 0.0 3.0 7 LP causal / BW 0.5 0.0 1 HP non-causal',
  causal: true
};

const CASCADED_FILTER_DEFINITION_LPHP: CascadeFilterDefinition = {
  name: 'Test Filter 5',
  comments: 'Cascade LP-HP Filter',
  filterDescription: CASCADED_FILTER_LPHP
};

// CASCADED_FILTER_LPHPBPBRBR

const CASCADED_PARAMETERS_LPHPBPBRBR: CascadeFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_LP_PARAMETERS_LPHPBPBRBR: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_LP_FILTER_LPHPBPBRBR: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  comments: 'BW 0.0 8.0 13 LP causal',
  causal: true,
  passBandType: BandType.LOW_PASS,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 8.0,
  order: 13,
  zeroPhase: false,
  parameters: CASCADED_LP_PARAMETERS_LPHPBPBRBR
};

const CASCADED_HP_FILTER_PARAMETERS_LPHPBPBRBR: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_HP_FILTER_LPHPBPBRBR: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  comments: 'BW 0.5 0.0 13 HP causal',
  causal: true,
  passBandType: BandType.HIGH_PASS,
  lowFrequencyHz: 0.5,
  highFrequencyHz: 8.0,
  order: 13,
  zeroPhase: false,
  parameters: CASCADED_HP_FILTER_PARAMETERS_LPHPBPBRBR
};

const CASCADED_BP_FILTER_PARAMETERS_LPHPBPBRBR: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_BP_FILTER_LPHPBPBRBR: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  comments: 'BW 1.0 6.0 5 BP causal',
  causal: true,
  passBandType: BandType.BAND_PASS,
  lowFrequencyHz: 0.8,
  highFrequencyHz: 6.0,
  order: 5,
  zeroPhase: false,
  parameters: CASCADED_BP_FILTER_PARAMETERS_LPHPBPBRBR
};

const CASCADED_BR1_FILTER_PARAMETERS_LPHPBPBRBR: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_BR1_FILTER_LPHPBPBRBR: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  comments: 'BW 2.0 3.0 3 BR causal',
  causal: true,
  passBandType: BandType.BAND_REJECT,
  lowFrequencyHz: 2.0,
  highFrequencyHz: 3.0,
  order: 3,
  zeroPhase: false,
  parameters: CASCADED_BR1_FILTER_PARAMETERS_LPHPBPBRBR
};

const CASCADED_BR2_FILTER_PARAMETERS_LPHPBPBRBR: LinearFilterParameters = {
  sampleRateHz: 40,
  sampleRateToleranceHz: 0,
  groupDelaySec: 0
};

const CASCADED_BR2_FILTER_LPHPBPBRBR: LinearFilterDescription = {
  filterType: FilterType.LINEAR,
  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
  comments: 'BW 4.0 4.1 7 BR causal',
  causal: true,
  passBandType: BandType.BAND_REJECT,
  lowFrequencyHz: 4.0,
  highFrequencyHz: 4.1,
  order: 7,
  zeroPhase: false,
  parameters: CASCADED_BR2_FILTER_PARAMETERS_LPHPBPBRBR
};

const CASCADED_FILTER_LPHPBPBRBR: CascadeFilterDescription = {
  filterType: FilterType.CASCADE,
  comments: 'Cascade BW LP-HP-BP-BR-BR causal',
  causal: true,
  filterDescriptions: [
    CASCADED_LP_FILTER_LPHPBPBRBR,
    CASCADED_HP_FILTER_LPHPBPBRBR,
    CASCADED_BP_FILTER_LPHPBPBRBR,
    CASCADED_BR1_FILTER_LPHPBPBRBR,
    CASCADED_BR2_FILTER_LPHPBPBRBR
  ],
  parameters: CASCADED_PARAMETERS_LPHPBPBRBR
};

const CASCADED_FILTER_DEFINITION_LPHPBPBRBR: CascadeFilterDefinition = {
  name: 'Test Filter 6',
  comments: 'Cascade LP-HP-BP-BR-BR Filter',
  filterDescription: CASCADED_FILTER_LPHPBPBRBR
};

export const undesignedFilterList: FilterList = {
  name: 'Undesigned Test Filters',
  defaultFilterIndex: 0,
  filters: [
    {
      withinHotKeyCycle: true,
      filterDefinition: BW_LP_CAUSAL_FILTER_DEFINITION
    },
    {
      withinHotKeyCycle: true,
      filterDefinition: BW_HP_NONCAUSAL_DEFINITION
    },
    {
      withinHotKeyCycle: true,
      filterDefinition: BW_BP_CAUSAL_FILTER_DEFINITION
    },
    {
      withinHotKeyCycle: true,
      filterDefinition: BW_BR_NONCAUSAL_FILTER_DEFINITION
    },
    {
      withinHotKeyCycle: false,
      filterDefinition: CASCADED_FILTER_DEFINITION_LPHP
    },
    {
      withinHotKeyCycle: false,
      filterDefinition: CASCADED_FILTER_DEFINITION_LPHPBPBRBR
    }
  ]
};
