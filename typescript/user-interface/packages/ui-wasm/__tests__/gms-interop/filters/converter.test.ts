import type {
  CascadeFilterDefinition,
  CascadeFilterDescription,
  LinearFilterDefinition,
  LinearFilterDescription
} from '@gms/common-model/lib/filter/types';
import { Timer, uuid } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';

import {
  convertCascadeFilterDescription,
  convertIIRLinearFilterDescription,
  convertWasmCascadeFilterDescription,
  convertWasmLinearIIRFilterDescription
} from '../../../src/ts/gms-interop/filters/converter';
import type { GmsInteropModule, Wasm } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import { designedFilterList } from './validation/filter-list-designed';
import {
  areCascadedFilterEquivalent,
  areLinearFilterDescEquivalent
} from './validation/test-utils';

const logger = UILogger.create('GMS_FILTERS_CONVERTER_TESTS', process.env.GMS_FILTERS);

describe('GMSFilters: Converter tests', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('Convert UI to WASM: LinearFilterDescription', () => {
    const id = uuid.asString();
    const inputFilter: LinearFilterDefinition = designedFilterList.filters[0]
      .filterDefinition as LinearFilterDefinition;
    let wasmFilter: Wasm.LinearIIRFilterDescription | null = null;
    try {
      Timer.start(`${id} ui-wasm::ui to wasm converter`);
      wasmFilter = convertIIRLinearFilterDescription(
        gmsInteropModule,
        inputFilter.filterDescription
      );
      expect((wasmFilter as unknown as { $$: { ptr: number } }).$$.ptr).not.toEqual(0);
      expect((wasmFilter.parameters as unknown as { $$: { ptr: number } }).$$.ptr).not.toEqual(0);
    } catch (e) {
      logger.error(e);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).not.toBeDefined();
    } finally {
      if (wasmFilter) wasmFilter.delete();
      Timer.end(`${id} ui-wasm::design`);
    }
  });

  test('Convert UI to WASM: CascadeFilterDescription', () => {
    const id = uuid.asString();
    const inputFilter: CascadeFilterDefinition = designedFilterList.filters[4]
      .filterDefinition as CascadeFilterDefinition;
    let wasmFilter: Wasm.CascadeFilterDescription | null = null;
    try {
      Timer.start(`${id} ui-wasm::ui to wasm converter`);
      wasmFilter = convertCascadeFilterDescription(gmsInteropModule, inputFilter.filterDescription);
      expect((wasmFilter as unknown as { $$: { ptr: number } }).$$.ptr).not.toEqual(0);
      expect((wasmFilter.parameters as unknown as { $$: { ptr: number } }).$$.ptr).not.toEqual(0);
      expect(
        (wasmFilter.filterDescriptions as unknown as { $$: { ptr: number } }).$$.ptr
      ).not.toEqual(0);
      expect(wasmFilter.filterDescriptions.size()).toEqual(
        inputFilter.filterDescription.filterDescriptions.length
      );
    } catch (e) {
      logger.error(e);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).not.toBeDefined();
    } finally {
      if (wasmFilter) wasmFilter.delete();
      Timer.end(`${id} ui-wasm::design`);
    }
  });

  test('Convert WASM to UI: LinearFilterDescription', () => {
    const id = uuid.asString();
    const inputFilter: LinearFilterDefinition = designedFilterList.filters[0]
      .filterDefinition as LinearFilterDefinition;
    let wasmFilter: Wasm.LinearIIRFilterDescription | null = null;
    try {
      Timer.start(`${id} ui-wasm::ui to wasm converter`);
      wasmFilter = convertIIRLinearFilterDescription(
        gmsInteropModule,
        inputFilter.filterDescription
      );
      const actual: LinearFilterDescription = convertWasmLinearIIRFilterDescription(wasmFilter);
      areLinearFilterDescEquivalent(inputFilter.filterDescription, actual);
    } catch (e) {
      logger.error(e);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).not.toBeDefined();
    } finally {
      if (wasmFilter) wasmFilter.delete();
      Timer.end(`${id} ui-wasm::design`);
    }
  });

  test('Convert WASM to UI: CascadeFilterDescription', () => {
    const id = uuid.asString();
    const inputFilter: CascadeFilterDefinition = designedFilterList.filters[4]
      .filterDefinition as CascadeFilterDefinition;
    let wasmFilter: Wasm.CascadeFilterDescription | null = null;
    try {
      Timer.start(`${id} ui-wasm::ui to wasm converter`);
      wasmFilter = convertCascadeFilterDescription(gmsInteropModule, inputFilter.filterDescription);
      const actual: CascadeFilterDescription = convertWasmCascadeFilterDescription(
        gmsInteropModule,
        wasmFilter
      );
      areCascadedFilterEquivalent(inputFilter.filterDescription, actual);
    } catch (e) {
      logger.error(e);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).not.toBeDefined();
    } finally {
      if (wasmFilter) wasmFilter.delete();
      Timer.end(`${id} ui-wasm::design`);
    }
  });
});
