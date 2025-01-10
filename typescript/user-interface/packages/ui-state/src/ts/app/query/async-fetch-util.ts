import { epochSecondsNow } from '@gms/common-util';
import { isSerializedError, type SerializedAxiosError } from '@gms/ui-workers';
import type { PayloadAction, SerializedError, unwrapResult } from '@reduxjs/toolkit';
import type { Draft } from 'immer/dist/internal';
import flatMap from 'lodash/flatMap';
import isEqual from 'lodash/isEqual';

import type { AsyncFetchHistory, AsyncFetchHistoryEntry } from './types';
import { AsyncActionStatus } from './types';

/**
 * Adds an {@link AsyncFetchHistoryEntry} into the provided history.
 *
 * @param history the history to add the entry to
 * @param id the unique identifier to look up the {@link AsyncFetchHistoryEntry}s
 * @param meta the meta data provided by the original action
 * @param status the status of the {@link AsyncFetchHistoryEntry}
 * @param shouldIncrementAttempt true if the number of attempts should be incremented
 * @param error (optional) the error of the {@link AsyncFetchHistoryEntry}
 */
function addAsyncFetchHistoryEntry<Args>(
  history: Draft<AsyncFetchHistory<Args>> | AsyncFetchHistory<Args>,
  id: string | number,
  meta: {
    arg: Args;
    requestId: string;
    requestStatus: string;
  },
  status: AsyncActionStatus,
  shouldIncrementAttempt: boolean,
  error?: SerializedError | SerializedAxiosError
): void {
  const { requestId } = meta;
  const arg = meta.arg as Draft<Args>;

  // ensure that the initial entry is there for a request
  if (!history[id]) {
    // * this modification is okay; it is a writable draft
    // eslint-disable-next-line no-param-reassign
    history[id] = {};
  }

  const entries = history[id];

  let attempts = entries[requestId]?.attempts;
  let time = entries[requestId]?.time;

  // update the number of attempts
  if (shouldIncrementAttempt) {
    attempts = entries[requestId]?.attempts ? entries[requestId].attempts + 1 : 1;
    time = epochSecondsNow();
  }

  entries[requestId] = {
    arg,
    attempts,
    time,
    status,
    error: error ?? ({} as SerializedError | SerializedAxiosError)
  };
}

/**
 * Adds an {@link AsyncFetchHistoryEntry} into the provided history with the
 * status of `pending`.
 *
 * @param history the history to add the entry to
 * @param id the unique identifier to look up the {@link AsyncFetchHistoryEntry}s
 * @param action the async thunk action
 * @param shouldIncrementAttempt true if the number of attempts should be incremented; @default false
 */
export function addAsyncFetchHistoryEntryPending<Args, Result>(
  history: Draft<AsyncFetchHistory<Args>> | AsyncFetchHistory<Args>,
  id: string | number,
  action: PayloadAction<
    Result,
    string,
    {
      arg: Args;
      requestId: string;
      requestStatus: 'pending';
    }
  >,
  shouldIncrementAttempt = false
): void {
  addAsyncFetchHistoryEntry(
    history,
    id,
    action.meta,
    AsyncActionStatus.pending,
    shouldIncrementAttempt
  );
}

/**
 * Adds an {@link AsyncFetchHistoryEntry} into the provided history with the
 * status of `fulfilled`.
 *
 * @param history the history to add the entry to
 * @param id the unique identifier to look up the {@link AsyncFetchHistoryEntry}s
 * @param action the async thunk action
 * @param shouldIncrementAttempt true if the number of attempts should be incremented; @default true
 */
export function addAsyncFetchHistoryEntryFulfilled<Args, Result>(
  history: Draft<AsyncFetchHistory<Args>> | AsyncFetchHistory<Args>,
  id: string | number,
  action: PayloadAction<
    Result,
    string,
    {
      arg: Args;
      requestId: string;
      requestStatus: 'fulfilled';
    }
  >,
  shouldIncrementAttempt = true
): void {
  addAsyncFetchHistoryEntry(
    history,
    id,
    action.meta,
    AsyncActionStatus.fulfilled,
    shouldIncrementAttempt
  );
}

/**
 * Adds an {@link AsyncFetchHistoryEntry} into the provided history with the
 * status of `rejected`.
 *
 * @param history the history to add the entry to
 * @param id the unique identifier to look up the {@link AsyncFetchHistoryEntry}s
 * @param action the async thunk action
 * @param shouldIncrementAttempt true if the number of attempts should be incremented; @default true
 */
export function addAsyncFetchHistoryEntryRejected<Args, Result>(
  history: Draft<AsyncFetchHistory<Args>> | AsyncFetchHistory<Args>,
  id: string | number,
  action: PayloadAction<
    Result,
    string,
    {
      arg: Args;
      requestId: string;
      requestStatus: 'rejected';
    },
    unknown
  >,
  shouldIncrementAttempt = true
): void {
  let error: SerializedError | SerializedAxiosError = action.error ?? {};
  if (isSerializedError(action.payload)) {
    error = action.payload; // async thunk reject with value puts the error on the payload
  }

  addAsyncFetchHistoryEntry(
    history,
    id,
    action.meta,
    AsyncActionStatus.rejected,
    shouldIncrementAttempt,
    error
  );
}

/**
 * Flattens the history and returns an array of {@link AsyncFetchHistoryEntry<ArgType>} objects.
 *
 * @param history the {@link AsyncFetchHistory} to flatten
 * @param predicate — A function that accepts up to three arguments.
 * The filter method calls the predicate function one time for each element in the array.
 * @returns a collections of {@link AsyncFetchHistoryEntry<ArgType>} objects
 */
export function flattenHistory<ArgType>(
  history: AsyncFetchHistory<ArgType>,
  predicate?: (
    value: { requestId: string; request: AsyncFetchHistoryEntry<ArgType> },
    index: number,
    array: { requestId: string; request: AsyncFetchHistoryEntry<ArgType> }[]
  ) => boolean
): AsyncFetchHistoryEntry<ArgType>[] {
  return flatMap(
    Object.values(history).map(entry =>
      Object.entries(entry)
        .map(e => ({ requestId: e[0], request: e[1] }))
        // apply filter to entries if provided
        .filter(predicate || (() => true))
        .map(e => e.request)
    )
  );
}

/**
 * A helper function that flatten the history and filters out the provided request {@link id} and
 * the any history entries with a {@link AsyncActionStatus} of rejected.
 *
 * @param history the fully query {@link AsyncFetchHistory}<{@link Args}> history
 * @param id the unique identifier generated by {@link idGenerator}
 * @returns the filtered collections of {@link AsyncFetchHistoryEntry} objects
 */
export function flattenFilterHistory<Args>(history: AsyncFetchHistory<Args>, id: string) {
  return flattenHistory(
    history,
    // ignore requests of the same id; these were checked in the `condition` function
    // only include requests that are pending or fulfilled; e.g. currently active or successfully completed requests
    entry => entry.requestId !== id && entry.request.status !== AsyncActionStatus.rejected
  );
}

// TODO: Remove when depreciated functions: 'computeFk', 'getFilterDefinitionsForSignalDetectionHypotheses'
// and 'getDefaultFilterDefinitionByUsageForChannelSegments' have been refactored
/**
 * Returns true if the new request (arg) has already been requested; false otherwise
 * which indicates that the requests has not been issued (a new request).
 *
 * @param requests the requests that have already been issued, to check against
 * @param arg the new request to check to see if it has already been issued
 */
export function hasAlreadyBeenRequested<ArgType>(
  requests: Record<string, AsyncFetchHistoryEntry<ArgType>>,
  arg: ArgType
): boolean {
  let result = false;
  Object.keys(requests).forEach(requestId => {
    const request = requests[requestId];
    if (!result && request.status !== AsyncActionStatus.rejected) {
      result ||= isEqual(arg, request.arg);
    }
  });
  return result;
}

/**
 * Returns true if the new request (arg) has been rejected; false otherwise
 * which indicates that the requests has not been issued (a new request).
 *
 * @param requests the requests that have already been issued, to check against
 * @param arg the new request to check to see if it previously had been rejected
 */
export function hasBeenRejected<ArgType>(
  requests: Record<string, AsyncFetchHistoryEntry<ArgType>>,
  arg: ArgType
): boolean {
  let result = false;
  Object.keys(requests).forEach(requestId => {
    const request = requests[requestId];
    if (!result && request.status === AsyncActionStatus.rejected) {
      result ||= isEqual(arg, request.arg);
    }
  });
  return result;
}

/**
 * Returns true if the new request (arg) is pending; false otherwise
 * which indicates that the requests has not been issued (a new request).
 *
 * @param requests the requests that have already been issued, to check against
 * @param arg the new request to check to see if it is currently pending
 */
export function requestIsPending<ArgType>(
  requests: Record<string, AsyncFetchHistoryEntry<ArgType>>,
  arg: ArgType
): boolean {
  let result = false;
  Object.keys(requests).forEach(requestId => {
    const request = requests[requestId];
    if (!result && request.status === AsyncActionStatus.pending) {
      result ||= isEqual(arg, request.arg);
    }
  });
  return result;
}

/**
 * Add some handlers for cancelled requests to a function before calling it.
 * Using this, we handle requests cancelled by the asyncThunk (because the condition returns false).
 * These may happen because the query is fulfilled, pending, or in a retry-backoff loop.
 *
 * TODO: More complete implementation needed—this simply returns undefined if the request
 * was cancelled, rather than actually awaiting the pending result, or getting the result
 * from the redux store.
 *
 * @param unwrap a function to unwrap a returned asyncThunk result
 * @returns a function that unwraps the result, but is designed to handle cancelled queries
 * that end up in the `then` callback
 */
export function handleCanceledRequests(unwrap: typeof unwrapResult) {
  return result => {
    if (result.meta.condition) {
      // ! Need a way to handle safely if the condition returned false and the result was canceled (e.g. it was already fulfilled)
      // ! Ideally, we await the pending query if it is queued, fetch it from redux if resolved, or throw...?
      // ! this can happen if the query is rejected because it is fulfilled, pending, skipped, or queued
      return undefined;
    }
    if (result.meta.requestStatus === 'rejected') {
      throw new Error(
        `Request ${result.type} was rejected. See error above for details about the result.`
      );
    }
    return unwrap(result);
  };
}
