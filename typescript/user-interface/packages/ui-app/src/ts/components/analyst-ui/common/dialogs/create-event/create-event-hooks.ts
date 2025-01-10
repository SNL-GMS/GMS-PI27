import { CommonTypes } from '@gms/common-model';
import { MILLISECONDS_IN_SECOND } from '@gms/common-util';
import { useViewableInterval, useZoomInterval } from '@gms/ui-state';

/**
 * Determine the appropriate initial event date based on zoom and visible intervals
 */
export function useInitialEventDate(): Date | undefined {
  const [viewableInterval] = useViewableInterval();
  const [zoomInterval] = useZoomInterval();

  try {
    CommonTypes.Util.validateTimeRange(viewableInterval);
    CommonTypes.Util.validateTimeRange(zoomInterval);
  } catch {
    return undefined;
  }

  // Case 1: Viewable interval start
  let initialEventDate = new Date(viewableInterval.startTimeSecs * MILLISECONDS_IN_SECOND);

  // Case 2: Zoom interval start exceeds viewable interval start (zoomed into viewable interval)
  if (zoomInterval?.startTimeSecs > viewableInterval.startTimeSecs) {
    initialEventDate = new Date(zoomInterval.startTimeSecs * MILLISECONDS_IN_SECOND);
  }

  // Case 3: Zoom interval start exceeds the viewable interval end (fully outside viewable interval)
  if (zoomInterval?.startTimeSecs > viewableInterval.endTimeSecs) {
    initialEventDate = new Date(viewableInterval.endTimeSecs * MILLISECONDS_IN_SECOND);
  }

  return initialEventDate;
}
