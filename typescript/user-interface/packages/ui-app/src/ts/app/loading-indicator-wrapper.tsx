import { LoadingBar } from '@gms/ui-core-components';
import { selectRequestStats, useAppSelector } from '@gms/ui-state';
import React from 'react';

/**
 * Creates a loading indicator if there are pending requests
 */
export function LoadingIndicatorWrapper() {
  const { completed, initiated } = useAppSelector(selectRequestStats);
  return <LoadingBar isLoading={completed < initiated} />;
}
