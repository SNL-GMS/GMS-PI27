import { isDesigned } from '../../src/ts/gms-interop';
import type { GmsInteropModule } from '../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../src/ts/gms-interop/gms-interop-module';
import { undesignedFilterList } from './filters/validation/filter-list';
import { designedFilterList } from './filters/validation/filter-list-designed';

describe('ui-wasm::filter', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('is-designed::LinearFilterDescription', () => {
    const designed = designedFilterList.filters[0].filterDefinition;
    expect(designed).toBeDefined();
    expect(isDesigned(designed)).toBeTruthy();
  });

  test('is-designed::CascadeFilterDescription', () => {
    const designed = designedFilterList.filters[4].filterDefinition;
    expect(designed).toBeDefined();
    expect(isDesigned(designed)).toBeTruthy();
  });

  test('is-not-designed::LinearFilterDescription', () => {
    const notDesigned = undesignedFilterList.filters[0].filterDefinition;
    expect(notDesigned).toBeDefined();
    expect(isDesigned(notDesigned)).toBeFalsy();
  });

  test('is-not-designed::CascadeFilterDescription', () => {
    const notDesigned = undesignedFilterList.filters[4].filterDefinition;
    expect(notDesigned).toBeDefined();
    expect(isDesigned(notDesigned)).toBeFalsy();
  });
});
