import { testPerformance } from '@gms/common-util/__tests__/jest-conditional-util';

import type { GmsInteropModule, Wasm } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import { precisionCompare } from '../filters/validation/test-utils';
import testData from '../test-data/rotation-test-waveform.json';

const MAX_TIME_ALLOWED = 30;
const MAX_LARGE_ARRAY_TIME_ALLOWED = 40;

describe('ui-wasm::array converter performance', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  testPerformance('array converter performance: to vector', () => {
    const largeArray: Float64Array = Float64Array.from(
      { length: 653400 },
      (v, i) =>
        testData.channelSegments[1].timeseries[0].samples[
          i % testData.channelSegments[1].timeseries[0].samples.length
        ]
    );

    let inputPtr: number = 0;
    let dataVector: Wasm.VectorDouble | undefined;
    try {
      // eslint-disable-next-line no-underscore-dangle
      inputPtr = gmsInteropModule._malloc(largeArray.length * largeArray.BYTES_PER_ELEMENT);
      gmsInteropModule.HEAPF64.set(largeArray, inputPtr / largeArray.BYTES_PER_ELEMENT);

      const startingMs = performance.now();
      dataVector = gmsInteropModule.vectorFromPointer(inputPtr, largeArray.length);
      const totalMs = performance.now() - startingMs;
      expect(totalMs).toBeLessThanOrEqual(MAX_TIME_ALLOWED); // adjust for huge waveform
      console.log(`Pointer to VectorDouble conversion, ${totalMs}`);
      expect(dataVector).toBeDefined();
      expect(dataVector.size()).toBe(largeArray.length);
    } catch (e) {
      console.error(e);

      expect(e).not.toBeDefined();
    } finally {
      // eslint-disable-next-line no-underscore-dangle
      if (inputPtr) gmsInteropModule._free(inputPtr);
      if (dataVector) dataVector.delete();
    }
  });

  testPerformance('array converter performance: to Float64Array', () => {
    const largeArray: Float64Array = Float64Array.from(
      { length: 653400 },
      (v, i) =>
        testData.channelSegments[1].timeseries[0].samples[
          i % testData.channelSegments[1].timeseries[0].samples.length
        ]
    );

    let inputPtr: number = 0;
    let dataVector: Wasm.VectorDouble | undefined;
    try {
      // eslint-disable-next-line no-underscore-dangle
      inputPtr = gmsInteropModule._malloc(largeArray.length * largeArray.BYTES_PER_ELEMENT);
      gmsInteropModule.HEAPF64.set(largeArray, inputPtr / largeArray.BYTES_PER_ELEMENT);
      const payload: Wasm.VectorDouble = gmsInteropModule.vectorFromPointer(
        inputPtr,
        largeArray.length
      );

      const startingMs = performance.now();
      const result: Float64Array = new Float64Array(
        gmsInteropModule.convertToFloat64Array(payload)
      );
      const totalMs = performance.now() - startingMs;
      expect(totalMs).toBeLessThanOrEqual(MAX_LARGE_ARRAY_TIME_ALLOWED); // adjust for huge waveform
      console.log(`VectorDouble to Float64Array conversion, ${totalMs}`);
      expect(result).toHaveLength(largeArray.length);
      precisionCompare(largeArray, result);
    } catch (e) {
      console.error(e);

      expect(e).not.toBeDefined();
    } finally {
      // eslint-disable-next-line no-underscore-dangle
      if (inputPtr) gmsInteropModule._free(inputPtr);
      if (dataVector) dataVector.delete();
    }
  });
});
