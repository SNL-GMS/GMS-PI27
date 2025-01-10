import { Icon, Spinner } from '@blueprintjs/core';
import type { ClientActionStatus, RequestStatus } from '@gms/ui-state/lib/app/state/analyst/types';
import { isRequestStatus } from '@gms/ui-state/lib/app/state/analyst/types';
import classNames from 'classnames';
import React from 'react';

import { getFriendlyNameFromRequest, getIconName } from './loading-info-util';

/**
 * Returns an error message, or null if the error is undefined.
 *
 * @param error the error from which to get the message. Errors have `any` type, so we use that it here, too
 * @returns an error message string, or null
 */
const getErrorMessage = (error: any): string | null => {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'See developer console for more details';
};

/**
 * The type of the props for the {@link LoadingListEntry} component
 */
export interface LoadingListEntryProps {
  loadingStatus: RequestStatus | ClientActionStatus;
}

/**
 * Creates a single loading list entry for the ordered list in the LoadingInfoTooltip
 */
export const LoadingListEntry = React.memo(function LoadingListEntry({
  loadingStatus
}: LoadingListEntryProps) {
  const iconName = getIconName(loadingStatus);
  return (
    <li
      className={classNames({
        'loading-list-entry': true,
        'is-error': !!loadingStatus.error,
        'is-complete': loadingStatus.isComplete,
        'is-pending': !loadingStatus.isComplete
      })}
    >
      <div className="loading-list-entry__description">
        {!loadingStatus.isComplete ? (
          <Spinner className="loading-list-entry__spinner" size={14} intent="none" />
        ) : (
          <Icon className="loading-list-entry__icon" icon={iconName} />
        )}
        {loadingStatus.error ? <span className="loading-list-entry__label">Error: </span> : null}

        <span className="loading-list-entry__value">
          {`${
            isRequestStatus(loadingStatus)
              ? getFriendlyNameFromRequest(loadingStatus.url)
              : loadingStatus.clientAction ?? 'Please wait'
          }`}
        </span>
      </div>
      {loadingStatus.error ? (
        <span className="loading-list-entry__more-info">
          {getErrorMessage(loadingStatus.error)}
        </span>
      ) : null}
    </li>
  );
});
