import isEqual from 'lodash/isEqual';

import type { ChannelSegmentTypes } from '../common-model';
import type { ChannelSegmentDescriptor } from './types';

/**
 * Determine if channelSegmentDescriptor is in the selected waveforms list
 *
 * @return returns is in list
 */
export function isSelectedWaveform(
  channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor,
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[]
): boolean {
  return (
    !!selectedWaveforms?.length &&
    selectedWaveforms.some(selectedCSD => isEqual(selectedCSD, channelSegmentDescriptor))
  );
}

/**
 * Create a unique string
 *
 * @param id ChannelSegmentDescriptor throws an error if undefined
 * @returns unique string representing the ChannelSegmentDescriptor
 */
export function createChannelSegmentString(id: ChannelSegmentDescriptor | undefined): string {
  if (!id) throw new Error('Cannot build channel segment id for undefined');
  return `${id.channel.name}.${id.channel.effectiveAt}.${id.creationTime}.${id.startTime}.${id.endTime}`;
}
