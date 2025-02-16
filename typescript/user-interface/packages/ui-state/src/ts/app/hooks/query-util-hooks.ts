import React from 'react';

import type { UseQueryStateResult } from '../query/types';

/**
 * A hook that returns the old data if a query is reloading.
 *
 * @param result The RTK Query State result object
 * @returns the data from within the redux cache for the query, or the old data, if the query is in a loading state.
 */
export function useOldQueryDataIfReloading<QueryResultType>(
  result: UseQueryStateResult<QueryResultType | undefined>
): QueryResultType | undefined {
  const oldDataRef = React.useRef<QueryResultType | undefined>(result?.data);
  React.useEffect(() => {
    if (result.data) {
      oldDataRef.current = result.data;
    }
  }, [result.data]);
  return React.useMemo(
    () => (result.isLoading ? oldDataRef.current : result?.data),
    [result?.data, result.isLoading]
  );
}
