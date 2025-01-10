import { IconNames } from '@blueprintjs/icons';
import type { CommonTypes } from '@gms/common-model';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import type GoldenLayout from '@gms/golden-layout';
import type { NonIdealStateDefinition } from '@gms/ui-core-components';
import { nonIdealStateWithNoSpinner, WithNonIdealStates } from '@gms/ui-core-components';
import { selectHistorySize, selectWorkflowTimeRange, useAppSelector } from '@gms/ui-state';
import React from 'react';

import { timeRangeNonIdealStateDefinitions } from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';
import { BaseDisplay } from '~common-ui/components/base-display';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';

import { HistoryPanel } from './history-panel';

export interface HistoryProps {
  // passed in from golden-layout
  readonly glContainer?: GoldenLayout.Container;
}

interface HistoryPanelOrNonIdealStateProps {
  /** Used to determine non-ideal state */
  readonly timeRange: CommonTypes.TimeRange;
  /** Used to determine non-ideal state */
  readonly historySize: number;
}

export const historyNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: HistoryPanelOrNonIdealStateProps): boolean => {
      return props.historySize < 1;
    },
    element: nonIdealStateWithNoSpinner(
      'No Undo/Redo History Available',
      'Perform an action to view undo/redo entries',
      IconNames.UNDO
    )
  }
];

export const HistoryPanelOrNonIdealState = WithNonIdealStates<HistoryPanelOrNonIdealStateProps>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...timeRangeNonIdealStateDefinitions('undo/redo history'),
    ...historyNonIdealStateDefinitions
  ],
  HistoryPanel
);

/**
 * Renders the {@link HistoryPanel} with props {@link HistoryProps}
 */
export const HistoryComponent = React.memo(function HistoryComponent({
  glContainer
}: HistoryProps) {
  const timeRange = useAppSelector(selectWorkflowTimeRange);
  const historySize = useAppSelector(selectHistorySize);

  return (
    <BaseDisplay
      glContainer={glContainer}
      className="history-display-window gms-body-text"
      tabName={IanDisplays.HISTORY}
    >
      <HistoryPanelOrNonIdealState timeRange={timeRange} historySize={historySize} />
    </BaseDisplay>
  );
});
