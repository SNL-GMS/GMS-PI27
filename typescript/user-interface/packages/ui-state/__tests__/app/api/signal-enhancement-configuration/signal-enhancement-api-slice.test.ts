/* eslint-disable jest/expect-expect */
import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';

import {
  signalEnhancementConfigurationApiSlice,
  useGetFilterListsDefinitionQuery
} from '../../../../src/ts/app/api/signal-enhancement-configuration';
import { expectQueryHookToMakeAxiosRequest } from '../query-test-util';

jest.mock('../../../../src/ts/app/api/processing-configuration', () => {
  const actual = jest.requireActual('../../../../src/ts/app/api/processing-configuration');
  return {
    ...actual,
    processingConfigurationApiSlice: {
      ...actual.processingConfigurationApiSlice,
      endpoints: {
        ...actual.processingConfigurationApiSlice.endpoints,
        getProcessingAnalystConfiguration: {
          ...actual.processingConfigurationApiSlice.endpoints.getProcessingAnalystConfiguration,
          initiate: jest.fn(() => ({
            data: processingAnalystConfigurationData
          }))
        }
      }
    }
  };
});

describe('Signal Enhancement API Slice', () => {
  it('provides', () => {
    expect(signalEnhancementConfigurationApiSlice).toBeDefined();
    expect(useGetFilterListsDefinitionQuery).toBeDefined();
  });

  it('hook makes a request', async () => {
    await expectQueryHookToMakeAxiosRequest(useGetFilterListsDefinitionQuery);
  });
});
