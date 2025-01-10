import { formatTimeForDisplay } from '@gms/common-util';
import { Tooltip2Wrapper } from '@gms/ui-core-components';
import uniqueId from 'lodash/uniqueId';
import React from 'react';

import type { ConflictedEventInfo } from '../../tooltips/conflicts-tooltip-content';
import { ConflictsTooltipContent } from '../../tooltips/conflicts-tooltip-content';

/**
 * Display content for the event times, where more than 3 event
 * items are "overflowed" into an ellipsis.
 */
export function EventTimesDisplayItem({
  time,
  conflictData
}: {
  time: string[];
  conflictData: ConflictedEventInfo[];
}) {
  let content: JSX.Element | JSX.Element[];
  if (conflictData.length === 0) {
    content = <span>{time.length > 0 ? time : 'N/A'}</span>;
  } else if (conflictData.length > 3) {
    content = (
      <>
        {conflictData.slice(0, 3).map(t => (
          <span key={uniqueId(`${t.time}`)}>{formatTimeForDisplay(t.time)}</span>
        ))}
        <span>. . . {conflictData.length - 3} more . . .</span>
      </>
    );
  } else {
    content = conflictData.map(t => (
      <span key={uniqueId(`${t.time}`)}>{formatTimeForDisplay(t.time)}</span>
    ));
  }

  return conflictData.length > 3 ? (
    <Tooltip2Wrapper content={<ConflictsTooltipContent data={conflictData} lengthLimit={5} />}>
      <div className="signal-detection-details__event-time-content">{content}</div>
    </Tooltip2Wrapper>
  ) : (
    <div className="signal-detection-details__event-time-content">{content}</div>
  );
}
