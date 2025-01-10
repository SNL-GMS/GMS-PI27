import { selectRequestStats, useAppSelector } from '@gms/ui-state';
import React from 'react';

/**
 * Simple component to render the count
 */
export const LoadingCounter = React.memo(function LoadingCounter() {
  const { initiated, completed } = useAppSelector(selectRequestStats);
  return (
    <span className="loading-counter monospace">
      {/* Three empty spaces in case initiated is 0 */}
      {initiated > 0 ? `${completed}/${initiated}` : `\u00A0\u00A0\u00A0`}
    </span>
  );
});
