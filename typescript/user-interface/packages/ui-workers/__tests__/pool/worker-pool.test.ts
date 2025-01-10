/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WorkerPool } from '../../src/ts/ui-workers';

let pool: WorkerPool<string, string>;
let poolWithOptions: WorkerPool<string, string>;

describe('Worker pool', () => {
  beforeAll(() => {
    pool = new WorkerPool<string, string>(
      Array.from(Array(2), () => new Worker(new URL('./dummy-url', import.meta.url)))
    );

    poolWithOptions = new WorkerPool<string, string>(
      Array.from(Array(2), () => new Worker(new URL('./dummy-url', import.meta.url))),
      {
        id: 'pool',
        workerConcurrency: 4
      }
    );
  });

  beforeEach(() => {
    pool.clear();
    poolWithOptions.clear();
  });

  it('exists', () => {
    expect(WorkerPool).toBeDefined();
    expect(pool).toBeDefined();
    expect(poolWithOptions).toBeDefined();
  });
  it('will create a pool of workers', () => {
    expect(pool.workers).toHaveLength(2);
  });
  it('will create a pool of workers with options', () => {
    expect(poolWithOptions.workers[0].id).toBe('pool-0');
    expect(poolWithOptions.workers[0].concurrency).toBe(4);
    expect(poolWithOptions.workers[1].id).toBe('pool-1');
    expect(poolWithOptions.workers[1].concurrency).toBe(4);
  });
  it('will add an action on the pool of workers', async () => {
    const result = await pool.add('TEST');
    expect(result).toBe('TEST COMPLETE');
  });
  it('will clear the queue', () => {
    const start = performance.now();
    // eslint-disable-next-line jest/valid-expect-in-promise
    Promise.all([pool.add('1'), pool.add('2'), pool.add('3'), pool.add('4')])
      .then(results => {
        const now = performance.now();
        // eslint-disable-next-line jest/no-conditional-expect
        expect(now - start).toBeLessThan(200);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(results).toHaveLength(4);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(results).toContain(undefined);
      })
      .catch(() => {
        // Force failure
        // eslint-disable-next-line jest/no-conditional-expect
        expect(true).toBe(false);
      });
    pool.clear();
    setTimeout(() => {
      console.log('waiting');
    }, 200);
  });
});
