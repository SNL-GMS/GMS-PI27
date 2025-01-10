import { Icon, IconSize } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { Tooltip2Wrapper } from '@gms/ui-core-components';
import type { AssociationConflictRecord } from '@gms/ui-state';
import {
  selectAssociationConflict,
  selectOpenIntervalName,
  useAppSelector,
  useGetEvents,
  useGetSignalDetections
} from '@gms/ui-state';
import React from 'react';

import { ConflictsTooltipContent } from '~analyst-ui/common/tooltips/conflicts-tooltip-content';
import { getConflictedSDsForEvent } from '~analyst-ui/common/utils/conflicts-utils';

interface EventDetailsConflictIconProps {
  eventId: string;
}

/**
 * Conflict icon. Also includes a tooltip listing all the event
 * times in conflict with one another.
 */
export function EventDetailsConflictIcon({ eventId }: EventDetailsConflictIconProps) {
  const openIntervalName: string = useAppSelector(selectOpenIntervalName);

  const allEventsInInterval: EventTypes.Event[] = useGetEvents().data;
  const allSignalDetectionsInInterval: SignalDetectionTypes.SignalDetection[] =
    useGetSignalDetections().data;

  const allConflicts: AssociationConflictRecord = useAppSelector(selectAssociationConflict);

  const sdConflicts = getConflictedSDsForEvent(
    allSignalDetectionsInInterval,
    allEventsInInterval,
    allConflicts,
    openIntervalName,
    eventId
  );

  return (
    <Tooltip2Wrapper content={<ConflictsTooltipContent data={sdConflicts} />}>
      <Icon
        icon={IconNames.ISSUE}
        size={IconSize.STANDARD}
        className="signal-detection-details__conflicted"
      />
    </Tooltip2Wrapper>
  );
}
