import { sleep } from '@gms/common-util';
import Immutable from 'immutable';

import { WorkerStore } from '../../../src/ts/workers/waveform-worker/worker-store';

let ws: WorkerStore<unknown>;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const TIMEOUT_DURATION = 200 as const;

function flushPromises(): any {
  return sleep(0);
}

const sleepAndReleaseExecution = async () => {
  await new Promise<void>(resolve => {
    setTimeout(resolve, TIMEOUT_DURATION);
  });
  await flushPromises();
};

// TODO: Write a test to verify that we get in-memory lookups!!!
describe('WorkerStore', () => {
  // Necessary to support retries for retrieve
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  jest.setTimeout(10000);

  beforeEach(() => {
    ws = new WorkerStore('test-store');
  });

  afterEach(async () => {
    await ws.cleanup();
  });

  it('exposes store, retrieve, and remove functions', () => {
    expect(ws.store).toBeDefined();
    expect(ws.delete).toBeDefined();
    expect(ws.retrieve).toBeDefined();
  });

  it('can store a promise and retrieve the data', async () => {
    const testString = 'Test storage and retrieval';
    const promise = Promise.resolve(testString);
    const id = 'storeId';
    await ws.store(id, promise);
    const result = await ws.retrieve(id);
    expect(result).toBe(testString);
  });

  it('will resolve a stored promise if given time', async () => {
    const testString = 'Test promise resolution and retrieval';
    const promise = Promise.resolve(testString);
    const id = 'resolvePromiseId';
    await ws.store(id, promise);
    await sleepAndReleaseExecution();
    const result = await ws.retrieve(id);
    expect(result).toBe(testString);
  });

  it('should return undefined after deletion', async () => {
    const testString = 'Test deletion';
    const promise = Promise.resolve(testString);
    const id = 'deletionId';
    await ws.store(id, promise);
    await ws.delete(id);
    const result = await ws.retrieve(id);
    expect(result).toBeUndefined();
  });

  it('can check to see if a promise was set with an id', async () => {
    const testString = 'Test has';
    const promise = Promise.resolve(testString);
    const id = 'hasId';
    await ws.store(id, promise);
    expect(await ws.has(id)).toBe(true);
  });

  it('can check to see if it has resolved data that was set with an id', async () => {
    const testString = 'Test has';
    const promise = Promise.resolve(testString);
    const id = 'hasId';
    await ws.store(id, promise);
    await sleepAndReleaseExecution();
    expect(await ws.has(id)).toBe(true);
  });

  it('stores data in the in-mem cache', async () => {
    const testString = 'Test has';
    const promise = Promise.resolve(testString);
    const id = 'hasId';
    // Taking advantage of the TS escape hatch for private members
    const memMapString = 'inMemResultMap';

    expect(ws[memMapString].size).toBe(0);

    await ws.store(id, promise);
    await sleepAndReleaseExecution();

    expect(ws[memMapString].size).toBe(1);
    expect(ws[memMapString].has(id)).toBe(true);
  });

  it('retrieves data from the in-memory cache', async () => {
    const testString = 'Test has';
    const promise = Promise.resolve(testString);
    const id = 'hasId';
    // Taking advantage of the TS escape hatch for private members
    const memMapString = 'inMemResultMap';
    const resultDBString = 'resultDB';

    const startingMemCacheSize = ws[memMapString].size;
    const dbCacheSpy = jest.spyOn(ws[resultDBString].results, 'get');

    await ws.store(id, promise);
    await sleepAndReleaseExecution();
    const result = await ws.retrieve(id);

    expect(ws[memMapString].size).toBe(startingMemCacheSize + 1);
    expect(result).toBe(testString);
    expect(dbCacheSpy).toHaveBeenCalledTimes(0);
  });

  // IndexDB was temporarily disabled in favor of SharedWorker for inter tab communication
  it.skip('retrieves data from the indexedDB cache if in-memory cache is cleared', async () => {
    const testString = 'Test has';
    const promise = Promise.resolve(testString);
    const id = 'hasId';
    // Taking advantage of the TS escape hatch for private members
    const memMapString = 'inMemResultMap';
    const resultDBString = 'resultDB';

    const startingMemCacheSize = ws[memMapString].size;
    const dbCacheSpy = jest.spyOn(ws[resultDBString].results, 'get');

    await ws.store(id, promise);
    await sleepAndReleaseExecution();
    ws[memMapString] = Immutable.Map();
    const result = await ws.retrieve(id);

    expect(ws[memMapString].size).toBe(startingMemCacheSize + 1);
    expect(result).toBe(testString);
    expect(dbCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('should know that an ID was removed after deletion', async () => {
    const testString = 'Test deletion lookup';
    const promise = Promise.resolve(testString);
    const id = 'deletionLookupId';
    await ws.store(id, promise);
    await ws.delete(id);
    expect(await ws.has(id)).toBe(false);
  });

  it('cleans up after itself', async () => {
    const testString = 'Test cleanup';
    const promise = Promise.resolve(testString);
    const id1 = 'cleanupId1';
    await ws.store(id1, promise);
    await sleepAndReleaseExecution();
    const id2 = 'cleanupId2';
    await ws.store(id2, promise);
    expect(await ws.has(id1)).toBe(true);
    expect(await ws.has(id2)).toBe(true);
    await ws.cleanup();
    expect(await ws.has(id1)).toBe(false);
    expect(await ws.has(id2)).toBe(false);
  });

  it('handles gracefully if a timeout fires after a retrieve has already been called', async () => {
    const testString = 'Test timeout after retrieval';
    const promise = Promise.resolve(testString);
    const id = 'timeoutId';
    await ws.store(id, promise);
    // retrieving will force the promise to resolve.
    const result = await ws.retrieve(id);
    expect(result).toBe(testString);
    await sleepAndReleaseExecution();
    const result2 = await ws.retrieve(id);
    expect(result2).toBe(testString);
  });
});
