import { BandType, FilterType, LinearFilterType } from '@gms/common-model/lib/filter';

import type { FilterDefinitionByUsage } from '../../../src/ts/app';

export const defaultFilterDefinitionsByUsage: FilterDefinitionByUsage = {
  filterDefinitionIdsByUsage: {
    'NRIK.NRIK.BHZ': {
      UNSET: {
        ONSET: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        DETECTION: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: '0d93bbdc-ea82-304d-b449-bb47f419dcf6',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        MEASURE: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a'
          }
        ],
        FK: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ]
      },
      P: {
        ONSET: [
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        DETECTION: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: '0d93bbdc-ea82-304d-b449-bb47f419dcf6',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        MEASURE: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a'
          }
        ],
        FK: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ]
      }
    },
    'ASAR.AS01.SHZ': {
      UNSET: {
        ONSET: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        DETECTION: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: '0d93bbdc-ea82-304d-b449-bb47f419dcf6',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        MEASURE: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a'
          }
        ],
        FK: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ]
      },
      P: {
        ONSET: [
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        DETECTION: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: '0d93bbdc-ea82-304d-b449-bb47f419dcf6',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ],
        MEASURE: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a'
          }
        ],
        FK: [
          {
            filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
            distanceRange: {
              minDistanceDeg: 0.0,
              maxDistanceDeg: 3.0
            }
          },
          {
            filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
            distanceRange: {
              minDistanceDeg: 3.0,
              maxDistanceDeg: 180.0
            }
          }
        ]
      }
    }
  },
  globalDefaults: {
    ONSET: [
      {
        filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
        distanceRange: {
          minDistanceDeg: 0.0,
          maxDistanceDeg: 3.0
        }
      },
      {
        filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
        distanceRange: {
          minDistanceDeg: 3.0,
          maxDistanceDeg: 180.0
        }
      }
    ],
    DETECTION: [
      {
        filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
        distanceRange: {
          minDistanceDeg: 0.0,
          maxDistanceDeg: 3.0
        }
      },
      {
        filterDefinitionId: '0d93bbdc-ea82-304d-b449-bb47f419dcf6',
        distanceRange: {
          minDistanceDeg: 3.0,
          maxDistanceDeg: 180.0
        }
      }
    ],
    MEASURE: [
      {
        filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a'
      }
    ],
    FK: [
      {
        filterDefinitionId: '7d62eb0a-91bb-3bce-9070-6beeb9dd459a',
        distanceRange: {
          minDistanceDeg: 0.0,
          maxDistanceDeg: 3.0
        }
      },
      {
        filterDefinitionId: 'c12cf464-325c-322a-9e39-4fce21453640',
        distanceRange: {
          minDistanceDeg: 3.0,
          maxDistanceDeg: 180.0
        }
      }
    ]
  },
  filterDefinitionsById: {
    '0d93bbdc-ea82-304d-b449-bb47f419dcf6': {
      name: '0.5 4.0 3 BP causal',
      comments: 'Butterworth IIR band-pass 0.5-4.0 Hz, order 3, causal',
      filterDescription: {
        comments: '0.5 4.0 3 BP causal',
        causal: true,
        filterType: FilterType.LINEAR,
        linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
        lowFrequencyHz: 0.5,
        highFrequencyHz: 4.0,
        order: 3,
        zeroPhase: false,
        passBandType: BandType.BAND_PASS
      }
    },
    '7d62eb0a-91bb-3bce-9070-6beeb9dd459a': {
      name: '2.0 5.0 3 BP causal',
      comments: 'Butterworth IIR band-pass, 2.0-5.0 Hz, order 3, causal',
      filterDescription: {
        comments: '2.0 5.0 3 BP causal',
        causal: true,
        filterType: FilterType.LINEAR,
        linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
        lowFrequencyHz: 2.0,
        highFrequencyHz: 5.0,
        order: 3,
        zeroPhase: false,
        passBandType: BandType.BAND_PASS
      }
    },
    'c12cf464-325c-322a-9e39-4fce21453640': {
      name: '0.4 3.5 3 BP causal',
      comments: 'Butterworth IIR band-pass, 0.4-3.5 Hz, order 3, causal',
      filterDescription: {
        comments: '0.4 3.5 3 BP causal',
        causal: true,
        filterType: FilterType.LINEAR,
        linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
        lowFrequencyHz: 0.4,
        highFrequencyHz: 3.5,
        order: 3,
        zeroPhase: false,
        passBandType: BandType.BAND_PASS
      }
    }
  }
};
