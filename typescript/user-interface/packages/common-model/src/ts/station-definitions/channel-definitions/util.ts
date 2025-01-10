import type { ChannelSegmentDescriptor } from '../../channel-segment';
import type { Channel } from './channel-definitions';
import {
  CHANNEL_COMPONENT_SEPARATOR,
  COMPONENT_SEPARATOR,
  SPLIT_CHANNEL_TOKEN,
  TEMPORARY_CHANNEL_CODE
} from './channel-definitions';

/**
 * Determines if a channel name is formatted like a rotated channel by checking for `/rotate/`
 * This should work even for rotated channels which have since been filtered.
 *
 * @param inputChannelName
 * @returns true if '/rotate/' is found
 */
export function isRotatedChannelName(inputChannelName: string): boolean {
  return inputChannelName.includes('/rotate/');
}

/**
 * Determines if a channel name is formatted like a derived channel by checking the name for a component separator token.
 *
 * @param inputChannelName the source channel name
 * @returns true if the inputChannel is derived
 */
export function isDerivedChannelName(inputChannelName: string): boolean {
  return inputChannelName.includes(COMPONENT_SEPARATOR);
}

/**
 * Determines if a channel is derived by checking the name for a component separator token.
 *
 * @param inputChannel the source channel
 * @returns true if the inputChannel is derived
 */
export function isDerivedChannel(inputChannel: ChannelSegmentDescriptor['channel']): boolean {
  return isDerivedChannelName(inputChannel.name);
}

/**
 * Determines if a channel name is formatted like a split channel by checking the name for a component separator token.
 *
 * @param inputChannelName the source channel name
 * @returns true if the inputChannel is split
 */
export function isSplitChannelName(inputChannelName: string): boolean {
  return inputChannelName.includes(SPLIT_CHANNEL_TOKEN);
}

/**
 * Determines if a channel is split by checking the name for a component separator token.
 *
 * @param inputChannel the source channel
 * @returns true if the inputChannel is split
 */
export function isSplitChannel(inputChannel: ChannelSegmentDescriptor['channel']): boolean {
  return isSplitChannelName(inputChannel.name);
}

/**
 * Determines if a channel name is temporary by the temp channel code
 *
 * @param inputChannelName the source channel name
 * @returns true if the inputChannelName is temporary
 */
export function isTemporaryChannelName(inputChannelName: string): boolean {
  return inputChannelName !== undefined && inputChannelName?.includes(TEMPORARY_CHANNEL_CODE);
}

/**
 * Determines if a channel is temporary by checking the name for a temporary channel code.
 *
 * @param inputChannel the source channel
 * @returns true if the inputChannel is temporary
 */
export function isTemporaryChannel(inputChannel: Channel): boolean {
  return isTemporaryChannelName(inputChannel?.name);
}

/**
 * Determines if a channel name is formatted like a raw channel by checking the name for a component separator token.
 *
 * @param inputChannelName the source channel name
 * @returns true if the inputChannel is raw
 */
export function isRawChannelName(inputChannelName: string | undefined): boolean {
  return (
    !!inputChannelName &&
    ((!inputChannelName.includes('/') && inputChannelName.includes(CHANNEL_COMPONENT_SEPARATOR)) ||
      (inputChannelName.includes(CHANNEL_COMPONENT_SEPARATOR) &&
        !inputChannelName.includes('beam') &&
        !isRotatedChannelName(inputChannelName)))
  );
}

/**
 * Determines if a channel is raw by checking the name for a component separator token.
 *
 * @param inputChannel the source channel
 * @returns true if the inputChannel is raw
 */
export function isRawChannel(
  inputChannel: ChannelSegmentDescriptor['channel'] | undefined
): boolean {
  return !!inputChannel && isRawChannelName(inputChannel.name);
}

/**
 * Returns the beam type or undefined parsed from channel name
 *
 * @param channelName
 * @returns string beam type
 */
export function parseWaveformChannelType(
  channelName: string | undefined
): 'N/A' | 'Raw channel' | 'Fk beam' | 'Event beam' | 'Detection beam' | undefined {
  if (!channelName) {
    return undefined;
  }

  if (isTemporaryChannelName(channelName)) {
    return 'N/A';
  }

  if (isRawChannelName(channelName)) {
    return 'Raw channel';
  }

  const elements = channelName.split('/');

  if (!elements[1]) {
    return undefined;
  }

  const beamDescription = elements[1] === 'masked' ? elements[2] : elements[1];

  const beamPrefix = beamDescription.split(',')[1];
  switch (beamPrefix) {
    case 'fk':
      return 'Fk beam';
    case 'event':
      return 'Event beam';
    case 'detection':
      return 'Detection beam';
    default:
      return undefined;
  }
}
