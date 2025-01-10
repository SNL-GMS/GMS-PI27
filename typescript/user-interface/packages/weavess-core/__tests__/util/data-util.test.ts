/* eslint-disable @typescript-eslint/no-magic-numbers */
import { scaleLinear as d3ScaleLinear } from 'd3';

import { createStepPoints, scaleLinear } from '../../src/ts/util';

describe('WEAVESS Core: Data Util', () => {
  it('has the expected createStepPoints function', () => {
    expect(createStepPoints).toBeDefined();
  });
  const values = [
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 0]
  ];
  it('creates a step result that matches a snapshot', () => {
    const result = createStepPoints(values);
    expect(result).toMatchSnapshot();
  });

  it('can tell if there is a step', () => {
    const result = createStepPoints(values);
    expect(result.values[0]).toHaveProperty('value', 0);
    expect(result.values[1]).toHaveProperty('value', 1);
  });

  it('can tell if there is not a step', () => {
    const result = createStepPoints(values);
    expect(result.values[1]).toHaveProperty('value', 1);
    expect(result.values[2]).toHaveProperty('value', 1);
  });

  describe('scaleLinear', () => {
    it('scales things linearly from the domain to the range', () => {
      const scaleAsserterFactory = (domain: [number, number], range: [number, number]) => {
        const testScale = scaleLinear(domain, range);
        const knownScale = d3ScaleLinear().domain(domain).range(range);
        return (num: number) => {
          expect(testScale(num)).toBeCloseTo(knownScale(num), 12);
        };
      };
      const expectScaleIsCorrect = scaleAsserterFactory([0, 9], [-100, 100]);
      for (let i = 0; i < 100; i += 0.333333) {
        expectScaleIsCorrect(i);
      }
    });
    // ! Only skipped because we should not run performance tests
    // ! in the pipeline. This should be valid, and should generally be true
    it.skip('is faster than d3', () => {
      const testScale = (
        domain: [number, number],
        range: [number, number],
        value: number
      ): number => {
        const scaleFn = scaleLinear(domain, range);
        return scaleFn(value);
      };
      const d3Scale = (
        domain: [number, number],
        range: [number, number],
        value: number
      ): number => {
        const scaleFn = d3ScaleLinear().domain(domain).range(range);
        return scaleFn(value);
      };
      const theDomain: [number, number] = [0, 100];
      const theRange: [number, number] = [-100, 100];
      const startTime1 = performance.now();
      for (let i = 0; i < 1000000; i += 0.333333) {
        testScale(theDomain, theRange, i);
      }
      const endTime1 = performance.now();
      const duration1 = endTime1 - startTime1;
      console.log('fast scale', duration1);
      const startTime2 = performance.now();
      for (let i = 0; i < 1000000; i += 0.333333) {
        d3Scale(theDomain, theRange, i);
      }
      const endTime2 = performance.now();
      const duration2 = endTime2 - startTime2;
      console.log('d3 scale', duration2);
      expect(duration1).toBeLessThan(duration2);
      console.log('difference', duration2 - duration1);
    });
  });
});
