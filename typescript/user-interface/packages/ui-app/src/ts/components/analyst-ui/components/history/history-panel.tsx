import { selectHistorySize, useAppSelector } from '@gms/ui-state';
import React from 'react';

import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';

import { HistoryStack } from './history-stack';
import { HistoryToolbar } from './history-toolbar';

/**
 * Renders the {@link HistoryPanel} with props {@link HistoryPanelProps}
 */
export function HistoryPanel() {
  const historySize = useAppSelector(selectHistorySize);
  const [, height] = useBaseDisplaySize();

  React.useEffect(() => {
    // scroll to the bottom
    document.querySelectorAll('.list--history').forEach((panel: HTMLElement) => {
      if (!panel.scrollTo) return;
      panel.scrollTo({ top: panel.scrollHeight, left: 0, behavior: 'smooth' });
    });
  }, [height, historySize]);

  return (
    <div className="history-panel" data-cy="history">
      <HistoryToolbar />
      <HistoryStack />
    </div>
  );
}
