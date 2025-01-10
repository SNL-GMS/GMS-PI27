import { Priority } from '@gms/common-model/lib/endpoints/types';
import type { PriorityRequestConfig } from '@gms/ui-workers';
import produce from 'immer';
import React from 'react';

import type { UseQueryStateResult } from './types';

/**
 * Utility function that handles the `special case` when a query should be skipped.
 * If the query should be skipped, the data returned will always be `null`; this is to help
 * ensure that subscribers of the query are not using old stale data when a query is marked as
 * skipped after it has already fired.
 * NOTE: If skipped, the result will be referentially stable on subsequent calls if they
 * are also skipped.
 *
 * If `skip` is false, it just returns the data `as is` from the query response.
 *
 * @param data the data type of the request
 * @param skip true if the query should be skipped; false otherwise
 * @returns returns the query result where the `data` is set appropriate based on the skip flag
 */
export function useProduceAndHandleSkip<Data>(
  data: UseQueryStateResult<Data>,
  skip: boolean
): UseQueryStateResult<Data> {
  return React.useMemo(
    () =>
      produce(data, draft => {
        // if draft.data is already null, do nothing. This preserves referential stability.
        if (skip && draft.data !== null) {
          draft.data = undefined;
        }
      }),
    [data, skip]
  );
}

/**
 * Appends the required headers and priority to an existing request config, so that it can be pre-cached.
 * !Pre-cache requests must not update redux so they cannot be triggered through RTK
 *
 * @param requestConfig the request config to append the headers and priority
 * @param priority the priority of the pre-cache request
 * @returns a new copy of the config with new headers and priority for pre-caching
 */
export const appendPreCacheConfigToRequestConfig = (
  requestConfig: PriorityRequestConfig,
  priority?: number
): PriorityRequestConfig => {
  return {
    ...requestConfig,
    headers: {
      ...requestConfig.headers,
      'pre-cache': `${priority ?? 0}`
    },
    priority: Priority.LOWEST
  };
};
