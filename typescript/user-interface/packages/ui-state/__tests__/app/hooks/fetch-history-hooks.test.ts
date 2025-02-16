import { renderHook } from '@testing-library/react-hooks';

import { useFetchHistoryStatus } from '../../../src/ts/app/hooks/fetch-history-hooks';
import type { AsyncFetchHistory, AsyncFetchHistoryEntry } from '../../../src/ts/app/query';
import { AsyncActionStatus } from '../../../src/ts/app/query';

interface TestArg {
  name: string;
}

const requests: Record<string, AsyncFetchHistoryEntry<TestArg>> = {};
requests['0'] = {
  arg: { name: 'name0' },
  error: undefined,
  status: AsyncActionStatus.pending,
  time: 0,
  attempts: 1
};
requests['1'] = {
  arg: { name: 'name1' },
  error: undefined,
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['2'] = {
  arg: { name: 'name2' },
  error: undefined,
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['3'] = {
  arg: { name: 'name3' },
  error: undefined,
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['4'] = {
  arg: { name: 'name4' },
  error: undefined,
  status: AsyncActionStatus.fulfilled,
  time: 0,
  attempts: 1
};
requests['5'] = {
  arg: { name: 'name5' },
  error: undefined,
  status: AsyncActionStatus.pending,
  time: 0,
  attempts: 1
};

const history: AsyncFetchHistory<TestArg> = {};
history.test = requests;

describe('fetch history hooks', () => {
  it('is exported', () => {
    expect(useFetchHistoryStatus).toBeDefined();
  });

  it('can use fetch history status', () => {
    const { result } = renderHook(() => useFetchHistoryStatus(history));
    expect(result.current).toMatchSnapshot();
  });
});
