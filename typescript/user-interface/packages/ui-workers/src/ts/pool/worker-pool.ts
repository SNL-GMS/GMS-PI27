import { uuid } from '@gms/common-util';
import type { QueueAddOptions } from 'p-queue';
import PQueue from 'p-queue';

import { PoolWorker } from './pool-worker';

/**
 * Options available for workers in a worker pool.
 *
 * id: will assign a static id to the pool so its easier to identify in the logs, otherwise it will automatically generate one.
 *
 * workerConcurrency: setting this value will allow workers to take more then one task at a time
 */
interface WorkerPoolOptions {
  id?: string;
  workerConcurrency?: number;
}

/**
 * Creates a worker pool, where several copies of a worker can share the load of heavy async tasks.
 */
export class WorkerPool<WorkerParams, WorkerResult> {
  private readonly queue: PQueue;

  public readonly workers: PoolWorker<WorkerParams, WorkerResult>[] = [];

  // We cannot accept a URL for the worker, we must take worker instances
  public constructor(workers: Worker[], options?: WorkerPoolOptions) {
    const id = options?.id || uuid.asString();
    const workerConcurrency = options?.workerConcurrency || 1;

    this.queue = new PQueue({ concurrency: workers.length * workerConcurrency });
    this.workers = workers.map(
      (worker, i) =>
        new PoolWorker<WorkerParams, WorkerResult>(`${id}-${i}`, worker, workerConcurrency)
    );
  }

  /**
   * Get the most available worker in the pool
   *
   * @returns the pool worker with the fewest tasks (most availability)
   */
  private getMostAvailableWorker() {
    return this.workers.sort((a, b) => a.taskCount - b.taskCount)[0];
  }

  /**
   * Add a task to the worker pool
   *
   * @param workerParams params to be sent to the worker (must be transferable object)
   * @param options options like priority or signal
   *
   * @returns promise response from worker or error
   */
  public async add(workerParams: WorkerParams, options?: QueueAddOptions) {
    return this.queue.add(async () => {
      const worker = this.getMostAvailableWorker();
      return worker.exec(workerParams);
    }, options);
  }

  /**
   * Pause queued tasks remaining the queue
   */
  public pause() {
    this.queue.pause();
  }

  /**
   * Resume queued tasks remaining in the queue after pause
   */
  public resume() {
    this.queue.start();
  }

  /**
   * Clear remaining tasks in the queue
   */
  public clear() {
    this.queue.clear();
  }
}
