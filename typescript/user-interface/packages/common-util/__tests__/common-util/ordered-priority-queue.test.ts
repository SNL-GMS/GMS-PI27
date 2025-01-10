/* eslint-disable @typescript-eslint/no-magic-numbers */
import { OrderedPriorityQueue } from '../../src/ts/common-util/ordered-priority-queue';

const wait = async milliseconds => {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

let order: string[] = [];

const task1 = jest.fn(async () => {
  order.push('task1');
  await wait(50);
});

const task2 = jest.fn(async () => {
  order.push('task2');
  await wait(50);
});

const task3 = jest.fn(async () => {
  order.push('task3');
  await wait(50);
});

describe('ordered-priorty-queue', () => {
  beforeEach(() => {
    order = [];
    task1.mockClear();
    task2.mockClear();
    task3.mockClear();
  });
  it('is defined', () => {
    expect(OrderedPriorityQueue).toBeDefined();
  });
  it('processes the queue over time', async () => {
    const queue = new OrderedPriorityQueue({ concurrency: 1 });
    queue.add(task1).catch(console.error);
    await wait(55);
    expect(task1).toHaveBeenCalled();
    expect(queue.size).toBe(0);
  });

  it('processes the higher priority tasks first', async () => {
    const queue = new OrderedPriorityQueue({ concurrency: 1 });
    queue.prioritize('high');
    queue.add(task1, { priority: 0 }).catch(console.error);
    queue.add(task2, { priority: 1 }).catch(console.error);
    queue.add(task3, { priority: 2 }).catch(console.error);
    await wait(155);
    expect(task1).toHaveBeenCalled();
    expect(task2).toHaveBeenCalled();
    expect(task3).toHaveBeenCalled();
    expect(order).toMatchObject(['task1', 'task3', 'task2']);
  });

  it('can find an item in the queue by id', () => {
    const queue = new OrderedPriorityQueue({ concurrency: 1 });
    queue.prioritize('high');
    queue.add(task1, { id: 'a', priority: 0 }).catch(console.error);
    queue.add(task2, { id: 'b', priority: 1 }).catch(console.error);
    queue.add(task3, { id: 'c', priority: 2 }).catch(console.error);

    // The first task in the queue will process so quickly the has function will not find it
    expect(queue.has('a')).toBeFalsy();
    expect(queue.has('b')).toBeTruthy();
    expect(queue.has('c')).toBeTruthy();
  });

  it('can empty the queue', () => {
    const queue = new OrderedPriorityQueue({ concurrency: 1 });
    queue.prioritize('high');
    queue.add(task1, { id: 'a', priority: 0 }).catch(console.error);
    queue.add(task2, { id: 'b', priority: 1 }).catch(console.error);
    queue.add(task3, { id: 'c', priority: 2 }).catch(console.error);
    queue.clear();
    expect(queue.size).toBe(0);
  });
});
