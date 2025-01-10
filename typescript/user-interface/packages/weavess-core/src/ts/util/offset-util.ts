import type { Station } from '../types';

/**
 * Update minOffset
 *
 * @param stations
 * @returns number
 */
function calculateMinOffset(stations: Station[]) {
  const minOffset = Math.min(
    ...stations.map(s =>
      s.defaultChannel.timeOffsetSeconds ? s.defaultChannel.timeOffsetSeconds : 0
    ),
    ...stations.map(s =>
      s.nonDefaultChannels
        ? Math.min(
            ...s.nonDefaultChannels.map(c => (c.timeOffsetSeconds ? c.timeOffsetSeconds : 0))
          )
        : 0
    )
  );
  return minOffset > 0 ? 0 : minOffset;
}

/**
 * Update maxOffset
 *
 * @param stations
 * @returns number
 */
function calculateMaxOffset(stations: Station[]) {
  const maxOffset = Math.max(
    ...stations.map(s =>
      s.defaultChannel.timeOffsetSeconds ? s.defaultChannel.timeOffsetSeconds : 0
    ),
    ...stations.map(s =>
      s.nonDefaultChannels
        ? Math.max(
            ...s.nonDefaultChannels.map(c => (c.timeOffsetSeconds ? c.timeOffsetSeconds : 0))
          )
        : 0
    )
  );
  return maxOffset < 0 ? 0 : maxOffset;
}

/**
 * @param stations the list of WeavessStations to be displayed
 * @returns the min and max offset times from all channels
 */
export const calculateMinMaxOffsets = (
  stations: Station[]
): { minOffset: number; maxOffset: number } => {
  const minOffset = calculateMinOffset(stations);
  const maxOffset = calculateMaxOffset(stations);
  return { minOffset, maxOffset };
};
