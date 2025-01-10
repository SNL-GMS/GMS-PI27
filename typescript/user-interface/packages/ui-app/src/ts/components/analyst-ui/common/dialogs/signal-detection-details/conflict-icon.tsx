import { Icon, IconSize } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Tooltip2Wrapper } from '@gms/ui-core-components';
import React from 'react';

import type { ConflictedEventInfo } from '../../tooltips/conflicts-tooltip-content';
import { ConflictsTooltipContent } from '../../tooltips/conflicts-tooltip-content';

/**
 * Conflict icon. Also includes a tooltip listing all the event
 * times in conflict with one another.
 */
export function SignalDetectionDetailsConflictIcon({
  conflictData
}: {
  conflictData: ConflictedEventInfo[];
}) {
  return (
    <Tooltip2Wrapper content={<ConflictsTooltipContent data={conflictData} />}>
      <Icon
        icon={IconNames.ISSUE}
        size={IconSize.STANDARD}
        className="signal-detection-details__conflicted"
      />
    </Tooltip2Wrapper>
  );
}
