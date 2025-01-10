/* eslint-disable @typescript-eslint/no-magic-numbers */
import { batchAndDefer } from '../../src/ts/common-util';

describe('batchAndDefer', () => {
  jest.useFakeTimers();
  it('should be defined', () => {
    expect(batchAndDefer).toBeDefined();
  });

  it('returns a batched function', () => {
    const batchedFunction = batchAndDefer(() => true);
    expect(typeof batchedFunction).toBe('function');
  });

  it('will batch the params and make fewer calls', () => {
    const testFunction = jest.fn();
    const batched = batchAndDefer(() => testFunction, 10);
    batched(1);
    batched(2);
    batched(3);
    batched(4);
    batched(5);

    setTimeout(() => {
      expect(testFunction).toHaveBeenCalledTimes(1);
      expect(testFunction).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
      jest.runOnlyPendingTimers();
    }, 20);
  });

  it('will batch array params and make fewer calls', () => {
    const testFunction = jest.fn();
    const batched = batchAndDefer(() => testFunction, 10);
    batched([1, 2]);
    batched([3, 4]);
    batched([5, 6]);
    batched([7, 8]);
    batched([9, 10]);

    setTimeout(() => {
      expect(testFunction).toHaveBeenCalledTimes(1);
      expect(testFunction).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      jest.runOnlyPendingTimers();
    }, 20);
  });
});
