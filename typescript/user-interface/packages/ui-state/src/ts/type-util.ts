import type { ChannelSegmentTypes } from '@gms/common-model';

import type { UiChannelSegment } from './types';

/**
 * Test to compare two {@link ChannelSegmentTypes.ChannelSegmentDescriptor}s to see if they are equal.
 *
 * @param a {@link ChannelSegmentTypes.ChannelSegmentDescriptor} to compare
 * @param b {@link ChannelSegmentTypes.ChannelSegmentDescriptor} to compare
 * @returns true if both {@link ChannelSegmentTypes.ChannelSegmentDescriptor} are equal
 */
export const areChannelSegmentDescriptorsEqual = (
  a: ChannelSegmentTypes.ChannelSegmentDescriptor,
  b: ChannelSegmentTypes.ChannelSegmentDescriptor
): boolean =>
  a.startTime === b.startTime && a.endTime === b.endTime && a.channel.name === b.channel.name;

/**
 * Test to compare two {@link UiChannelSegment}s to see if they have
 * the same (equal) {@link ChannelSegmentTypes.ChannelSegmentDescriptor}.
 *
 * @param a {@link UiChannelSegment} to compare
 * @param b {@link UiChannelSegment}  to compare
 * @returns true if both segments have the same {@link ChannelSegmentTypes.ChannelSegmentDescriptor}
 */
export function areUiChannelSegmentChannelSegmentDescriptorsEqual<
  T extends ChannelSegmentTypes.Timeseries
>(a: UiChannelSegment<T>, b: UiChannelSegment<T>) {
  return areChannelSegmentDescriptorsEqual(a.channelSegmentDescriptor, b.channelSegmentDescriptor);
}
