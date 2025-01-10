import { WeavessConstants } from '@gms/weavess-core';
import * as React from 'react';

import { deltaTimeString, timeRangeDisplayString } from '../../../utils';
import type { TimeRangeProps } from './types';

function InternalTimeRange(props: TimeRangeProps) {
  const { labelWidthPx, currentZoomInterval } = props;
  const fullTimeString = timeRangeDisplayString(currentZoomInterval);
  const shortTimeString = timeRangeDisplayString(currentZoomInterval, 'HH:mm:ss.SSS');
  const veryShortTimeString = deltaTimeString(currentZoomInterval);
  return (
    <div
      className="weavess-wp-time-range"
      style={{
        left: `${labelWidthPx ?? WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS}px`
      }}
    >
      <span className="very-short-time">{veryShortTimeString}</span>
      <span className="short-time">{shortTimeString}</span>
      <span className="full-time">{fullTimeString}</span>
    </div>
  );
}

/**
 * A memoized component that simply draws a time range string at the desired location on the page.
 * If labelWidthPx are given, will draw them at that offset. Otherwise, defaults to WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS
 */
export const TimeRange = React.memo(InternalTimeRange);
