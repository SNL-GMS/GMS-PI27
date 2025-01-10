import { linearFilterDefinition } from '@gms/common-model/__tests__/__data__';
import type { AxiosResponse } from 'axios';
import Axios from 'axios';

import type {
  FetchFilterDefinitionsForSignalDetectionsResponse,
  GetFilterDefinitionsForSignalDetectionsQueryArgs
} from '../../../src/ts/app/api/data/signal-detection/get-filter-definitions-for-signal-detections';
import { fetchFilterDefinitionsForSignalDetections } from '../../../src/ts/workers/waveform-worker/operations/fetch-filter-definitions-for-signal-detections';

describe('Filter definitions for signal detections query', () => {
  it('has defined exports', () => {
    expect(fetchFilterDefinitionsForSignalDetections).toBeDefined();
  });
  it('fetchFilterDefinitionsForSignalDetections returns record', async () => {
    const response: AxiosResponse<FetchFilterDefinitionsForSignalDetectionsResponse> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: {
        filterDefinitionByUsageBySignalDetectionHypothesis: [
          {
            signalDetectionHypothesis: { id: { id: 'a', signalDetectionId: 'b' } },
            filterDefinitionByFilterDefinitionUsage: {
              ONSET: linearFilterDefinition,
              FK: linearFilterDefinition,
              DETECTION: linearFilterDefinition,
              AMPLITUDE: linearFilterDefinition
            }
          }
        ]
      }
    };
    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const queryArgs: GetFilterDefinitionsForSignalDetectionsQueryArgs = {
      stageId: {
        name: 'AL1'
      },
      signalDetections: [
        {
          id: 'b'
        }
      ]
    };
    const params = {
      baseURL: '/baseURL',
      data: queryArgs
    };
    const result = await fetchFilterDefinitionsForSignalDetections(params);
    expect(result).toMatchInlineSnapshot(`
      {
        "filterDefinitionByUsageBySignalDetectionHypothesis": [
          {
            "filterDefinitionByFilterDefinitionUsage": {
              "AMPLITUDE": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
              "DETECTION": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
              "FK": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
              "ONSET": {
                "comments": "Sample Filter Definition Comments",
                "filterDescription": {
                  "causal": true,
                  "comments": "Test description comments",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 0.8,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.3,
                  "order": 2,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 30,
                    "sampleRateToleranceHz": 20,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "Sample Filter Definition Name",
              },
            },
            "signalDetectionHypothesis": {
              "id": {
                "id": "a",
                "signalDetectionId": "b",
              },
            },
          },
        ],
      }
    `);
  });

  it('fetchFilterDefinitionsForSignalDetections patches missing filter definitions with defaults', async () => {
    const response1: AxiosResponse<FetchFilterDefinitionsForSignalDetectionsResponse> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: {
        filterDefinitionByUsageBySignalDetectionHypothesis: []
      }
    };
    const response2: AxiosResponse<FetchFilterDefinitionsForSignalDetectionsResponse> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: {
        filterDefinitionByUsageBySignalDetectionHypothesis: [
          {
            signalDetectionHypothesis: { id: { id: 'a', signalDetectionId: 'b' } },
            filterDefinitionByFilterDefinitionUsage: {
              ONSET: linearFilterDefinition,
              FK: linearFilterDefinition,
              DETECTION: linearFilterDefinition,
              AMPLITUDE: linearFilterDefinition
            }
          }
        ]
      }
    };
    Axios.request = jest
      .fn()
      .mockImplementationOnce(async () => Promise.resolve(response1))
      .mockImplementationOnce(async () => Promise.resolve(response2));
    const queryArgs: GetFilterDefinitionsForSignalDetectionsQueryArgs = {
      stageId: {
        name: 'AL1'
      },
      signalDetections: [
        {
          id: 'b'
        }
      ]
    };
    const params = {
      baseURL: '/baseURL',
      data: queryArgs
    };
    const result = await fetchFilterDefinitionsForSignalDetections(params);
    expect(result).toMatchInlineSnapshot(`
      {
        "filterDefinitionByUsageBySignalDetectionHypothesis": [],
      }
    `);
  });

  it('fetchFilterDefinitionsForSignalDetections returns error if there is a major config issue', async () => {
    const params = { baseURL: undefined };
    await expect(fetchFilterDefinitionsForSignalDetections(params)).rejects.toThrow(
      'Cannot make a request on the worker without a baseUrl in the config'
    );
  });
});
