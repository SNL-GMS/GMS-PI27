import type { SerializedAxiosError } from '@gms/ui-workers';
import type { SerializedError } from '@reduxjs/toolkit';
import flatMap from 'lodash/flatMap';
import React from 'react';

import type { AsyncFetchHistory, AsyncFetchHistoryEntry, FetchHistoryStatus } from '../query';
import { AsyncActionStatus } from '../query';

/**
 * A hook that can be used to return the current status of retrieving the async fetch history.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the query
 *
 * @returns returns the current status of retrieving a query.
 */
export function useFetchHistoryStatus<T = unknown>(
  history: AsyncFetchHistory<T>
): FetchHistoryStatus {
  const [pending, fulfilled, rejected, isLoading, isError, error] = React.useMemo(() => {
    const statuses: AsyncFetchHistoryEntry<T>[] = flatMap(
      Object.values(history).map(entry => Object.values(entry))
    );

    const status = statuses.reduce<{
      pending: number;
      fulfilled: number;
      rejected: number;
      error: (SerializedError | SerializedAxiosError)[];
    }>(
      (prev, current) => ({
        pending: current.status === AsyncActionStatus.pending ? prev.pending + 1 : prev.pending,
        fulfilled:
          current.status === AsyncActionStatus.fulfilled ? prev.fulfilled + 1 : prev.fulfilled,
        rejected: current.status === AsyncActionStatus.rejected ? prev.rejected + 1 : prev.rejected,
        error: current.error ? prev.error.concat(current.error) : prev.error
      }),
      { pending: 0, fulfilled: 0, rejected: 0, error: [] }
    );

    return [
      status.pending,
      status.fulfilled,
      status.rejected,
      status.pending > 0,
      // flag an error if there at least one rejected request and no pending/fulfilled requests
      status.pending < 1 && status.fulfilled < 1 && status.rejected > 0,
      status.error
    ];
  }, [history]);

  return React.useMemo(() => {
    return {
      pending,
      fulfilled,
      rejected,
      isLoading,
      isError,
      error: isError ? error : undefined
    };
  }, [error, fulfilled, isError, isLoading, pending, rejected]);
}
