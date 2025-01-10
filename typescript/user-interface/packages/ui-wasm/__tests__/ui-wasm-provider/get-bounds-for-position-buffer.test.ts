import { getBoundsForPositionBuffer as getBoundsForPositionBufferTS } from '@gms/weavess-core/lib/util/position-buffer-util';

import { getBoundsForPositionBuffer as getBoundsForPositionBufferWASM } from '../../src/ts/ui-wasm-provider/get-bounds-for-position-buffer';
import { uiWasmProviderModule } from '../../src/ts/ui-wasm-provider/ui-wasm-module';
import { generateXYData } from './generate-data-util';

const twoHourTimeData = generateXYData(Float64Array);

describe('Get Bounds For Position Buffer', () => {
  beforeAll(async () => {
    await uiWasmProviderModule;
  });

  test('validate get bounds for position buffer, size 2 array', async () => {
    const uiProviderModule = await uiWasmProviderModule;
    expect(uiProviderModule).toBeDefined();

    const data = new Float64Array([0, 2]);

    const tsResult = getBoundsForPositionBufferTS(data);
    const result = await getBoundsForPositionBufferWASM(data);

    expect(tsResult.max).toEqual(2);
    expect(tsResult.maxSecs).toEqual(0);
    expect(tsResult.min).toEqual(2);
    expect(tsResult.minSecs).toEqual(0);

    expect(result).toBeDefined();
    expect(tsResult.max).toEqual(result.max);
    expect(tsResult.maxSecs).toEqual(result.maxSecs);
    expect(tsResult.min).toEqual(result.min);
    expect(tsResult.minSecs).toEqual(result.minSecs);
  });

  test('validate get bounds for position buffer, size 4 array', async () => {
    const uiProviderModule = await uiWasmProviderModule;
    expect(uiProviderModule).toBeDefined();

    const data = new Float64Array([0, 2, 1, 1]);

    const tsResult = getBoundsForPositionBufferTS(data);
    const result = await getBoundsForPositionBufferWASM(data);

    expect(result).toBeDefined();

    expect(tsResult.max).toEqual(2);
    expect(tsResult.maxSecs).toEqual(0);
    expect(tsResult.min).toEqual(1);
    expect(tsResult.minSecs).toEqual(1);

    expect(tsResult.max).toEqual(result.max);
    expect(tsResult.maxSecs).toEqual(result.maxSecs);
    expect(tsResult.min).toEqual(result.min);
    expect(tsResult.minSecs).toEqual(result.minSecs);
  });

  test('validate get bounds for position buffer, small array', async () => {
    const uiProviderModule = await uiWasmProviderModule;
    expect(uiProviderModule).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const data = new Float64Array([0, 2, 1, 5, 3, 9, 4, 10, 5, 0]);

    const tsResult = getBoundsForPositionBufferTS(data, 1, data.length - 1);
    const result = await getBoundsForPositionBufferWASM(data, 1, data.length - 1);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(tsResult.max).toEqual(10);
    expect(tsResult.maxSecs).toEqual(4);
    expect(tsResult.min).toEqual(0);
    expect(tsResult.minSecs).toEqual(5);

    expect(result).toBeDefined();
    expect(tsResult.max).toEqual(result.max);
    expect(tsResult.maxSecs).toEqual(result.maxSecs);
    expect(tsResult.min).toEqual(result.min);
    expect(tsResult.minSecs).toEqual(result.minSecs);
  });

  test('validate get bounds for position buffer implementation match and compare timings', async () => {
    const uiProviderModule = await uiWasmProviderModule;
    expect(uiProviderModule).toBeDefined();

    function* getIndex() {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      for (let i = 0; i < 500; i += 1) {
        yield i;
      }
    }

    let averageTotalTs = 0;
    let averageTotal = 0;
    let size = 0;

    const run = async () => {
      // eslint-disable-next-line no-restricted-syntax
      for await (const index of getIndex()) {
        size += 1;

        const startingTs = performance.now();
        const tsResult = getBoundsForPositionBufferTS(
          twoHourTimeData,
          1,
          twoHourTimeData.length - 1
        );
        const totalTs = performance.now() - startingTs;
        averageTotalTs += totalTs;

        const starting = performance.now();
        const result = await getBoundsForPositionBufferWASM(
          twoHourTimeData,
          1,
          twoHourTimeData.length - 1
        );
        const total = performance.now() - starting;
        averageTotal += total;

        // console.log(`${index} WASM executed in ${total}ms and TS executed in ${totalTs}ms`);

        expect(index).toBeDefined();
        expect(result).toBeDefined();
        expect(tsResult.max).toEqual(result.max);
        expect(tsResult.maxSecs).toEqual(result.maxSecs);
        expect(tsResult.min).toEqual(result.min);
        expect(tsResult.minSecs).toEqual(result.minSecs);
      }
      averageTotalTs /= size;
      averageTotal /= size;

      console.log(
        `WASM executed in average ${averageTotal}ms and TS executed in average ${averageTotalTs}ms`
      );
    };

    await run();
  });
});
