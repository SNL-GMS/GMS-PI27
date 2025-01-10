import {
  AnalystWorkspaceTypes,
  selectIsLoading,
  selectPendingRequests,
  useAppSelector
} from '@gms/ui-state';
import React from 'react';

import { getFriendlyNameFromRequest } from './loading-info-util';

const LoadingCompleteDescription = 'Complete';

/**
 * Displays the loading text for the LoadingWidget, which is either the last of the pending requests,
 * or else a "Loading: Complete" indicator.
 */
export const LoadingInfo = React.memo(function LoadingInfo() {
  const pendingRequests = Object.values(useAppSelector(selectPendingRequests));
  const lastRequest = pendingRequests?.[pendingRequests.length - 1];
  const loadingText = AnalystWorkspaceTypes.isRequestStatus(lastRequest)
    ? getFriendlyNameFromRequest(lastRequest?.url)
    : lastRequest?.clientAction;
  const isLoading = useAppSelector(selectIsLoading);
  return (
    <div className="loading-info">
      <span className="loading-info__label">Loading: </span>
      {isLoading ? loadingText ?? LoadingCompleteDescription : LoadingCompleteDescription}
    </div>
  );
});
