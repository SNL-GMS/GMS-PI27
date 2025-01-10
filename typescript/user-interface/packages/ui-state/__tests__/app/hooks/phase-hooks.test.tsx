import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { renderHook } from '@testing-library/react';

import { getStore } from '../../../src/ts/app';
import { useValidatePhase } from '../../../src/ts/app/hooks/phase-hooks';
import { getTestReduxWrapper } from '../../test-util';

jest.mock(
  '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );

    return {
      ...actual,
      processingConfigurationApiSlice: {
        middleware: actual.processingConfigurationApiSlice.middleware,
        endpoints: {
          getProcessingAnalystConfiguration: {
            select: jest.fn(() =>
              jest.fn(() => ({
                data: processingAnalystConfigurationData
              }))
            )
          }
        }
      }
    };
  }
);

const store = getStore();

describe('Phase hooks', () => {
  describe('useValidatePhase', () => {
    const renderedHook = renderHook(useValidatePhase, {
      wrapper: getTestReduxWrapper(store)
    });
    const validatePhase = renderedHook.result.current;
    it('creates a callback', () => {
      expect(typeof validatePhase).toBe('function');
    });
    it('returns true if the phase is in a phase list', () => {
      const renderedHookWithPhaseList = renderHook(useValidatePhase, {
        wrapper: getTestReduxWrapper(store)
      });
      const validatePhaseWithList = renderedHookWithPhaseList.result.current;
      expect(validatePhaseWithList('P')).toBe(true);
    });
    it('returns false if the phase is not in a phase list', () => {
      const renderedHookWithPhaseList = renderHook(useValidatePhase, {
        wrapper: getTestReduxWrapper(store)
      });
      const validatePhaseWithList = renderedHookWithPhaseList.result.current;
      expect(validatePhaseWithList('FAKE_PHASE')).toBe(false);
    });
  });
});
