import type { FilterDefinition } from '@gms/common-model/lib/filter/types';
import { Timer, uuid } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';

import { design } from '../../../src/ts/gms-interop';
import type { GmsInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import { undesignedFilterList } from './validation/filter-list';
import { designedFilterList } from './validation/filter-list-designed';
import { areFilterDefinitionsEquivalent } from './validation/test-utils';
import { uiFilterList } from './validation/ui-filter-list';
import { designedUiFilterList } from './validation/ui-filter-list-designed';

const logger = UILogger.create('GMS_FILTERS_CONVERTER_TESTS', process.env.GMS_FILTERS);

describe('ui-wasm::design', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('Simple Low Pass', async () => {
    // Filter is destructive. Preserve inputs for comparison!
    const id = uuid.asString();
    const expected: FilterDefinition | undefined = designedFilterList.filters[0].filterDefinition;
    const undesigned: FilterDefinition | undefined =
      undesignedFilterList.filters[0].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  test('Simple High Pass', async () => {
    const id = uuid.asString();
    const expected: FilterDefinition | undefined = designedFilterList.filters[1].filterDefinition;
    const undesigned: FilterDefinition | undefined =
      undesignedFilterList.filters[1].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  test('Simple Band Pass', async () => {
    const id = uuid.asString();
    const expected: FilterDefinition | undefined = designedFilterList.filters[2].filterDefinition;
    const undesigned: FilterDefinition | undefined =
      undesignedFilterList.filters[2].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  test('Simple Band Reject', async () => {
    const id = uuid.asString();
    const expected: FilterDefinition | undefined = designedFilterList.filters[3].filterDefinition;
    const undesigned: FilterDefinition | undefined =
      undesignedFilterList.filters[3].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  test('UI FilterDefinition design validation', async () => {
    const id = uuid.asString();
    const undesigned: FilterDefinition | undefined = uiFilterList.filters[0].filterDefinition;
    const expected: FilterDefinition | undefined = designedUiFilterList.filters[0].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  test('UI CascadeFilterDefinition design validation', async () => {
    const id = uuid.asString();
    const undesigned: FilterDefinition | undefined = uiFilterList.filters[5].filterDefinition;
    const expected: FilterDefinition | undefined = designedUiFilterList.filters[5].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  test('Cascaded Filter LP-HP', async () => {
    const id = uuid.asString();
    const expected: FilterDefinition | undefined = designedFilterList.filters[4].filterDefinition;
    const undesigned: FilterDefinition | undefined =
      undesignedFilterList.filters[4].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });

  test('Cascaded Filter LP-HP-BP-BR-BR', async () => {
    const id = uuid.asString();
    const expected: FilterDefinition | undefined = designedFilterList.filters[5].filterDefinition;
    const undesigned: FilterDefinition | undefined =
      undesignedFilterList.filters[5].filterDefinition;

    expect(expected).not.toBeNull();
    expect(undesigned).not.toBeNull();

    if (expected && undesigned) {
      Timer.start(`${id} ui-wasm::design`);
      try {
        const results = await design(undesigned).then(designed => {
          return designed;
        });
        areFilterDefinitionsEquivalent(expected, results);
      } catch (e) {
        logger.error(e);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).not.toBeDefined();
      } finally {
        Timer.end(`${id} ui-wasm::design`);
      }
    } else {
      throw Error('Filter definitions are not defined');
    }
  });
});
