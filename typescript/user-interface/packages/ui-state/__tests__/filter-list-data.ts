/* eslint-disable @typescript-eslint/no-magic-numbers */

import type { FilterList } from '@gms/common-model/lib/filter/types';
import {
  BandType,
  FilterDefinitionUsage,
  FilterType,
  LinearFilterType
} from '@gms/common-model/lib/filter/types';

export const testFilterList: FilterList = {
  defaultFilterIndex: 0,
  name: 'test',
  filters: [
    {
      withinHotKeyCycle: true,
      unfiltered: true
    },
    {
      withinHotKeyCycle: false,
      namedFilter: 'HYDRO - for testing' as FilterDefinitionUsage
    },
    {
      withinHotKeyCycle: true,
      namedFilter: FilterDefinitionUsage.DETECTION
    },
    {
      withinHotKeyCycle: true,
      namedFilter: FilterDefinitionUsage.ONSET
    },
    {
      withinHotKeyCycle: false,
      namedFilter: FilterDefinitionUsage.FK
    },
    {
      withinHotKeyCycle: true,
      filterDefinition: {
        name: 'HAM FIR BP 0.70-2.00 Hz',
        comments: 'Filter 1 comments',
        filterDescription: {
          comments: 'Filter 1 comments',
          causal: true,
          filterType: FilterType.LINEAR,
          linearFilterType: LinearFilterType.FIR_HAMMING,
          lowFrequencyHz: 0.7,
          highFrequencyHz: 2.0,
          order: 48,
          zeroPhase: false,
          passBandType: BandType.BAND_PASS,
          parameters: {
            sampleRateHz: 20.0,
            sampleRateToleranceHz: 0.05,
            sosDenominatorCoefficients: [1.0],
            sosNumeratorCoefficients: [
              0.00154277211073, 0.00223135962309, 0.00273104312013, 0.00280258383269,
              0.00217656734384, 8.12768009294e-4, -8.56234196934e-4, -0.00192237976758,
              -0.0013754340351, 0.00122672506506, 0.00510147945921, 0.0080189420631,
              0.00682513728192, -0.00129622159881, -0.0172316219193, -0.0387105481955,
              -0.0601389046705, -0.0738477944677, -0.0725367436799, -0.0521167800143,
              -0.0138536966861, 0.0351522813688, 0.0835493685776, 0.118991116265, 0.131989358502,
              0.118991116265, 0.0835493685776, 0.0351522813688, -0.0138536966861, -0.0521167800143,
              -0.0725367436799, -0.0738477944677, -0.0601389046705, -0.0387105481955,
              -0.0172316219193, -0.00129622159881, 0.00682513728192, 0.0080189420631,
              0.00510147945921, 0.00122672506506, -0.0013754340351, -0.00192237976758,
              -8.56234196934e-4, 8.12768009294e-4, 0.00217656734384, 0.00280258383269,
              0.00273104312013, 0.00223135962309, 0.00154277211073
            ],
            groupDelaySec: 1
          }
        }
      }
    }
  ]
};
