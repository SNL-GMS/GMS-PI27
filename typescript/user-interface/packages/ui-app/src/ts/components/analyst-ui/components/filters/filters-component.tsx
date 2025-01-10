import type { CommonTypes } from '@gms/common-model';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import type GoldenLayout from '@gms/golden-layout';
import { WithNonIdealStates } from '@gms/ui-core-components';
import { useCurrentIntervalWithBuffer } from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import * as React from 'react';

import { timeRangeNonIdealStateDefinitions } from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';
import { BaseDisplay } from '~common-ui/components/base-display';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';

import { FiltersPanel } from './filters-panel';

const logger = UILogger.create('GMS_LOG_FILTERS', process.env.GMS_LOG_FILTERS);

export interface FiltersComponentProps {
  // passed in from golden-layout
  readonly glContainer?: GoldenLayout.Container;
}

interface FiltersPanelOrNonIdealStateProps {
  /** Used to determine non-ideal state */
  readonly currentInterval: CommonTypes.TimeRange;
}

export const FiltersPanelOrNonIdealState = WithNonIdealStates<FiltersPanelOrNonIdealStateProps>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...timeRangeNonIdealStateDefinitions('filters', 'currentInterval')
  ],
  FiltersPanel
);

export function FiltersComponent(props: FiltersComponentProps) {
  logger.debug(`Rendering FiltersComponent`, props);
  const { glContainer } = props;
  const currentInterval = useCurrentIntervalWithBuffer();

  return (
    <BaseDisplay
      glContainer={glContainer}
      className="filters-display-window gms-body-text"
      data-cy="filters-display-window"
      tabName={IanDisplays.FILTERS}
    >
      <FiltersPanelOrNonIdealState currentInterval={currentInterval} />
    </BaseDisplay>
  );
}
