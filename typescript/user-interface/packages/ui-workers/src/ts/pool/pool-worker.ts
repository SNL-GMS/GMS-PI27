import { Logger } from '@gms/common-util';

export const logger = Logger.create('GMS_WORKER_POOL', process.env.GMS_WORKER_POOL);

export enum PoolWorkerStatus {
  UNAVAILABLE = 'UNAVAILABLE',
  AVAILABLE = 'AVAILABLE'
}

export class PoolWorker<WorkerParams, WorkerResult> {
  // Webpack has issues if the url for a worker is passed through functions, or saved
  // to a variable, so we must pass in the entire worker
  // see: https://github.com/vercel/next.js/issues/31009#issuecomment-1146344161
  private readonly worker: Worker;

  public readonly concurrency: number = 1;

  public readonly id: string;

  public taskCount = 0;

  public constructor(id: string, worker: Worker, concurrency = 1) {
    this.id = id;
    this.concurrency = concurrency;
    this.worker = worker;
  }

  /**
   * Change the status of the worker to unavailable, and update task count
   */
  private addTask() {
    this.taskCount += 1;
    logger.info(`${this.id} - ADD TASK (${this.taskCount})`);
  }

  /**
   * Change the status of the worker to available, and update task count
   */
  private removeTask() {
    this.taskCount -= 1;
    logger.info(`${this.id} - REMOVE TASK (${this.taskCount})`);
  }

  /**
   * Checks if the worker is available for new tasks
   *
   * @returns true if the current task count is less then the max concurrency
   */
  public available(): boolean {
    return this.taskCount < this.concurrency;
  }

  /**
   * Execute a task on this worker
   *
   * @param params worker params to be sent to the worker (must be transferable object)
   * @returns promise response from worker or error
   */
  public async exec(params: WorkerParams): Promise<WorkerResult> {
    this.addTask();
    return new Promise((resolve, reject) => {
      this.worker.onmessage = e => {
        this.removeTask();
        resolve(e.data);
      };

      this.worker.onerror = e => {
        this.removeTask();
        logger.info(`${this.id} - ERROR`);
        reject(e.error);
      };

      this.worker.postMessage(params);
    });
  }
}
