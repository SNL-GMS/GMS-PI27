import { Icon, Spinner } from '@blueprintjs/core';
import { selectHasRequestErrorOccurred, selectIsLoading, useAppSelector } from '@gms/ui-state';
import React from 'react';

import { CompleteIcon, ErrorIcon } from './loading-info-util';

/**
 * Creates an icon or an indeterminate spinner to indicate the status of the app's requests.
 * Will be a spinner if loading, then an error icon if an error occurred, then a tick if complete.
 */
export const LoadingStatusIndicator = React.memo(function LoadingStatusIndicator() {
  const isLoading = useAppSelector(selectIsLoading);
  const isError = useAppSelector(selectHasRequestErrorOccurred);
  if (isLoading) {
    return <Spinner className="loading-widget__spinner" size={20} intent="none" />;
  }
  if (isError) {
    return <Icon icon={ErrorIcon} size={16} />;
  }
  return <Icon icon={CompleteIcon} size={20} />;
});
