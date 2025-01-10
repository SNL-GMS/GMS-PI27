/* eslint-disable @typescript-eslint/no-magic-numbers */
import { isSerializedError, isSuccessfulStatusCode } from '../../../src/ts/ui-workers';

describe('axios query', () => {
  describe('check status codes', () => {
    it('check for a successful status code', () => {
      expect(isSuccessfulStatusCode(200)).toBeTruthy();
      expect(isSuccessfulStatusCode(250)).toBeTruthy();
      expect(isSuccessfulStatusCode(299)).toBeTruthy();
    });
    it('check for a unsuccessful status code', () => {
      expect(isSuccessfulStatusCode(null)).toBeFalsy();
      expect(isSuccessfulStatusCode(undefined)).toBeFalsy();

      expect(isSuccessfulStatusCode(100)).toBeFalsy();
      expect(isSuccessfulStatusCode(199)).toBeFalsy();
      expect(isSuccessfulStatusCode(300)).toBeFalsy();
      expect(isSuccessfulStatusCode(400)).toBeFalsy();
      expect(isSuccessfulStatusCode(500)).toBeFalsy();
    });
  });

  describe('checks if a serialized error', () => {
    it('serialized error', () => {
      expect(isSerializedError({ message: '' })).toBeTruthy();
      expect(isSerializedError({ code: '' })).toBeTruthy();
      expect(isSerializedError({ stack: '' })).toBeTruthy();
      expect(isSerializedError({ name: '' })).toBeTruthy();
      expect(isSerializedError({ test: '' })).toBeFalsy();
    });
  });
});
