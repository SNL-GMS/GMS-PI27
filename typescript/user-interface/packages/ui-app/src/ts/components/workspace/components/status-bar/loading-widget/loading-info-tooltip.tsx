import { selectLoadingActionStatuses, selectRequestStats, useAppSelector } from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';

import { LoadingListEntry } from './loading-list-entry';

const MAX_NUM_REQUESTS_TO_RENDER = 500;

/**
 * Creates the contents of the loading info tooltip: a list of each entry that is being loaded.
 */
export const LoadingInfoTooltip = React.memo(function LoadingInfoTooltip() {
  const requests = useAppSelector(selectLoadingActionStatuses);
  const { initiated, completed } = useAppSelector(selectRequestStats);
  const numRequests = Object.values(requests).length;
  const listEntries = React.useMemo(
    () =>
      Object.entries(requests)
        .slice(-1 * Math.min(numRequests, MAX_NUM_REQUESTS_TO_RENDER))
        .reverse()
        .map(([id, loadingStatus]) => {
          return <LoadingListEntry key={id} loadingStatus={loadingStatus} />;
        }),
    [numRequests, requests]
  );
  return (
    <div>
      <div className={classNames(['loading-list__sticky-label'])}>
        {`Loaded ${completed} out of ${initiated} requests`}
      </div>
      <ol className="loading-list">
        {listEntries}
        {numRequests > MAX_NUM_REQUESTS_TO_RENDER ? (
          <li className="loading-list-entry__description loading-list-entry__description--set-apart">
            . . . {numRequests - MAX_NUM_REQUESTS_TO_RENDER} older requests not shown . . .
          </li>
        ) : null}
      </ol>
    </div>
  );
});
