import type { CommonTypes } from '@gms/common-model';
import { getValidator } from '@gms/ui-core-components';
import { getStore, waveformActions } from '@gms/ui-state';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import {
  depthValidationDefs,
  latitudeValidationDefs,
  longitudeValidationDefs,
  useDateRangeValidationDefs
} from '~analyst-ui/common/dialogs/create-event/create-event-validation-defs';

const store = getStore();

function TestReduxWrapper({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

describe('Create Event Validation Definitions', () => {
  describe('useDateRangeValidationDefs', () => {
    const viewableInterval: CommonTypes.TimeRange = {
      startTimeSecs: 100,
      endTimeSecs: 500
    };
    store.dispatch(waveformActions.setViewableInterval(viewableInterval));

    const { result } = renderHook(useDateRangeValidationDefs, { wrapper: TestReduxWrapper });
    it('Date outside given range is invalid', () => {
      const mockInvalidHandler = jest.fn();

      const testValidate = getValidator<Date>(mockInvalidHandler, result.current);
      expect(testValidate(new Date(0))).toBe(false);
      const range = 5000;
      expect(testValidate(new Date(range))).toBe(false);
    });
  });

  describe('latitudeValidationDefs', () => {
    const testValidate = getValidator<string>(jest.fn, latitudeValidationDefs);

    it('string format is invalid', () => {
      expect(testValidate('wrong')).toBe(false);
    });

    it('latitude valid range', () => {
      expect(testValidate('-200')).toBe(false);
      expect(testValidate('200')).toBe(false);
      expect(testValidate('45')).toBe(true);
    });
  });

  describe('longitudeValidationDefs', () => {
    const testValidate = getValidator<string>(jest.fn, longitudeValidationDefs);

    it('string format is invalid', () => {
      expect(testValidate('wrong')).toBe(false);
    });

    it('longitude valid range', () => {
      expect(testValidate('-200')).toBe(false);
      expect(testValidate('200')).toBe(false);
      expect(testValidate('45')).toBe(true);
    });
  });

  describe('depthValidationDefs', () => {
    const testValidate = getValidator<string>(jest.fn, depthValidationDefs);

    it('string format is invalid', () => {
      expect(testValidate('wrong')).toBe(false);
    });

    it('depth valid range', () => {
      expect(testValidate('-200')).toBe(false);
      expect(testValidate('2000')).toBe(false);
      expect(testValidate('-45')).toBe(true);
    });
  });
});
