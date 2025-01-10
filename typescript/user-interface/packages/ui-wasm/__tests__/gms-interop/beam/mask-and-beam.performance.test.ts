/* eslint-disable @typescript-eslint/no-magic-numbers */
import { testPerformance } from '@gms/common-util/__tests__/jest-conditional-util';
import PQueue from 'p-queue';

import { maskAndBeamWaveforms } from '../../../src/ts/ui-wasm';
import { getSampleInput } from './beamforming-data';

async function timeMaskAndBeam(): Promise<number> {
  const start = performance.now();
  await maskAndBeamWaveforms(getSampleInput('raw'));
  return performance.now() - start;
}

describe('maskAndBeam GMS interop performance', () => {
  testPerformance('maskAndBeamWaveforms performance single run', async () => {
    const MAX_TIME_ALLOWED_MS = 50;

    const queue: PQueue = new PQueue({ concurrency: 1 }); // running one call at a time
    const promises = [...Array(25).keys()].map((): (() => Promise<number>) => async () => {
      return timeMaskAndBeam();
    });
    const results = await queue.addAll(promises);
    const result = results.reduce((a, b) => a + b) / results.length;
    expect(result).toBeLessThanOrEqual(MAX_TIME_ALLOWED_MS);
  });

  testPerformance('maskAndBeamWaveforms performance multiple 100 run', async () => {
    const MAX_TIME_ALLOWED_MS = 1500;

    const queue: PQueue = new PQueue({ concurrency: 100 }); // running one call at a time
    const promises = [...Array(250).keys()].map((): (() => Promise<number>) => async () => {
      return timeMaskAndBeam();
    });
    const results = await queue.addAll(promises);
    const result = results.reduce((a, b) => a + b) / results.length;
    expect(result).toBeLessThanOrEqual(MAX_TIME_ALLOWED_MS);
  });

  testPerformance(
    'maskAndBeamWaveforms performance multiple 500 with 100 in parallel',
    async () => {
      const MAX_TIME_ALLOWED_MS = 1500;

      const queue: PQueue = new PQueue({ concurrency: 100 }); // running one call at a time
      const promises = [...Array(500).keys()].map((): (() => Promise<number>) => async () => {
        return timeMaskAndBeam();
      });
      const results = await queue.addAll(promises);
      const result = results.reduce((a, b) => a + b) / results.length;
      expect(result).toBeLessThanOrEqual(MAX_TIME_ALLOWED_MS);
    }
  );
});
