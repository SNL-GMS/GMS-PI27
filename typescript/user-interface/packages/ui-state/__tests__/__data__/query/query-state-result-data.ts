import { QueryStatus } from '@reduxjs/toolkit/dist/query';

import type { UseQueryStateResult } from '../../../src/ts/app/query';

export const useQueryStateResult: UseQueryStateResult<any> = {
  isError: false,
  isFetching: false,
  isLoading: false,
  isSuccess: true,
  isUninitialized: true,
  currentData: undefined,
  data: undefined,
  endpointName: undefined,
  error: undefined,
  fulfilledTimeStamp: undefined,
  originalArgs: undefined,
  requestId: undefined,
  startedTimeStamp: undefined,
  status: QueryStatus.uninitialized
};
