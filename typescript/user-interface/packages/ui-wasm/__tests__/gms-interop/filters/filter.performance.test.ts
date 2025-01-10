import { testPerformance } from '@gms/common-util/__tests__/jest-conditional-util';

import { filter } from '../../../src/ts/gms-interop';
import {
  defaultIndexInc,
  defaultIndexOffset,
  defaultTaper
} from '../../../src/ts/gms-interop/filters/constants';
import type { GmsInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import testData from './90-minute-waveform-payload.json';
import { designedFilterList } from './validation/filter-list-designed';

function loadPayload() {
  let cnt = 0;
  const temp: number[] = [];
  Object.values(testData).forEach(val => {
    temp[cnt] = val;
    cnt += 1;
  });
  return Float64Array.from([...temp, ...temp, ...temp, ...temp]);
}

const MAX_TIME_ALLOWED = 100;

describe('ui-wasm::filter performance', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  testPerformance('Low Pass Performance', async () => {
    // Filter is destructive. Preserve inputs for comparison!
    const data = loadPayload();
    const designedFilter = designedFilterList.filters[0].filterDefinition;

    expect(designedFilter).not.toBeNull();

    if (designedFilter) {
      const startingMs = performance.now();
      try {
        const results: Float64Array = await filter(
          designedFilter,
          data,
          defaultTaper,
          false,
          defaultIndexOffset,
          defaultIndexInc
        ).then(output => {
          return output;
        });
        const totalMs = performance.now() - startingMs;

        expect(results).toHaveLength(data.length);

        expect(totalMs).toBeLessThanOrEqual(MAX_TIME_ALLOWED * 2);
        console.log(`Low Pass Performance, ${totalMs}`);
      } catch (e) {
        console.error(e);

        expect(e).not.toBeDefined();
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  testPerformance('Cascaded Filter Performance', async () => {
    // Filter is destructive. Preserve inputs for comparison!
    const data = loadPayload();
    const designedFilter = designedFilterList.filters[4].filterDefinition;

    expect(designedFilter).not.toBeNull();

    if (designedFilter) {
      // TODO: The actual allowable time for cascaded filters to run is unknown
      const maxCascadeTime = MAX_TIME_ALLOWED * 5;
      const startingMs = performance.now();
      try {
        const results: Float64Array = await filter(
          designedFilter,
          data,
          defaultTaper,
          false,
          defaultIndexOffset,
          defaultIndexInc
        ).then(output => {
          return output;
        });
        const totalMs = performance.now() - startingMs;

        expect(results).toHaveLength(data.length);

        expect(totalMs).toBeLessThanOrEqual(maxCascadeTime);
        console.log(`Cascaded Filter Performance, ${totalMs}`);
      } catch (e) {
        console.error(e);

        expect(e).not.toBeDefined();
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });
});
