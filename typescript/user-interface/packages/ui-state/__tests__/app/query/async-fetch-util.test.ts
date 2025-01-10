import {
  flattenHistory,
  hasAlreadyBeenRequested,
  hasBeenRejected,
  requestIsPending
} from '../../../src/ts/app/query/async-fetch-util';
import type { AsyncFetchHistoryEntry } from '../../../src/ts/app/query/types';
import { AsyncActionStatus } from '../../../src/ts/app/query/types';

interface TestArg {
  name: string;
}

const requests: Record<string, AsyncFetchHistoryEntry<TestArg>> = {};
requests['0'] = {
  arg: { name: 'name0' },
  status: AsyncActionStatus.pending,
  time: 0,
  attempts: 1
};
requests['1'] = {
  arg: { name: 'name1' },
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['2'] = {
  arg: { name: 'name2' },
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['3'] = {
  arg: { name: 'name3' },
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['4'] = {
  arg: { name: 'name4' },
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['5'] = {
  arg: { name: 'name5' },
  status: AsyncActionStatus.pending,
  time: 0,
  attempts: 1
};
requests['6'] = {
  arg: { name: 'name6' },
  status: AsyncActionStatus.rejected,
  time: 0,
  attempts: 1
};

describe('async fetch utils', () => {
  it('is exported', () => {
    expect(flattenHistory).toBeDefined();
    expect(hasAlreadyBeenRequested).toBeDefined();
    expect(hasBeenRejected).toBeDefined();
    expect(requestIsPending).toBeDefined();
  });

  it('has been requested', () => {
    expect(hasAlreadyBeenRequested(requests, { name: 'name5' })).toBeTruthy();
  });

  it('has been not requested', () => {
    expect(hasAlreadyBeenRequested(requests, { name: 'unknown' })).toBeFalsy();
  });

  it('has been not requested, is idle', () => {
    expect(hasAlreadyBeenRequested(requests, { name: 'name7' })).toBeFalsy();
  });

  it('has been rejected', () => {
    expect(hasBeenRejected(requests, { name: 'name6' })).toBeTruthy();
  });

  it('has been not rejected', () => {
    expect(hasBeenRejected(requests, { name: 'unknown' })).toBeFalsy();
  });

  it('has been not rejected, is idle', () => {
    expect(hasBeenRejected(requests, { name: 'name7' })).toBeFalsy();
  });

  it('request is pending', () => {
    expect(requestIsPending(requests, { name: 'name0' })).toBeTruthy();
  });

  it('request is not pending', () => {
    expect(requestIsPending(requests, { name: 'unknown' })).toBeFalsy();
  });

  it('flatten history', () => {
    expect(flattenHistory({ entries: requests })).toMatchInlineSnapshot(`
      [
        {
          "arg": {
            "name": "name0",
          },
          "attempts": 1,
          "status": "pending",
          "time": 0,
        },
        {
          "arg": {
            "name": "name1",
          },
          "attempts": 1,
          "status": "fulfilled",
          "time": 0,
        },
        {
          "arg": {
            "name": "name2",
          },
          "attempts": 1,
          "status": "fulfilled",
          "time": 0,
        },
        {
          "arg": {
            "name": "name3",
          },
          "attempts": 1,
          "status": "fulfilled",
          "time": 0,
        },
        {
          "arg": {
            "name": "name4",
          },
          "attempts": 1,
          "status": "fulfilled",
          "time": 0,
        },
        {
          "arg": {
            "name": "name5",
          },
          "attempts": 1,
          "status": "pending",
          "time": 0,
        },
        {
          "arg": {
            "name": "name6",
          },
          "attempts": 1,
          "status": "rejected",
          "time": 0,
        },
      ]
    `);
  });
});
