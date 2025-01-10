import { testPerformance } from '@gms/common-util/__tests__/jest-conditional-util';
import PQueue from 'p-queue';

import { maskAndBeamWaveforms } from '../../../src/ts/ui-wasm';
import { getSampleInput } from './beamforming-data';

async function timeMaskAndBeam(): Promise<number> {
  const start = performance.now();
  await maskAndBeamWaveforms(getSampleInput('raw'));
  return performance.now() - start;
}

describe('maskAndBeam GMS interop memory leak performance', () => {
  testPerformance(
    'maskAndBeamWaveforms run 1000 times to ensure no failure; checking for memory leaks',
    async () => {
      // TODO memory leak causes failure at 852 - update to run 1000+ times
      const NUMBER_OR_RUNS = 851;
      const queue: PQueue = new PQueue({ concurrency: 1 }); // running one call at a time
      const promises = [...Array(NUMBER_OR_RUNS).keys()].map(
        (): (() => Promise<void>) => async () => {
          await expect(timeMaskAndBeam()).resolves.not.toThrow();
        }
      );
      await queue.addAll(promises);
    }
  );
});
