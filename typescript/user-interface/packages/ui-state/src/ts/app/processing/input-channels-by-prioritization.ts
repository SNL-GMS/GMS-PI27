import type { ChannelTypes } from '@gms/common-model';

/**
 * Determines the channel prioritization by using configured list to see if any channels
 * contain first entry, if not continues down the list until one is found.
 *
 * @param channels to be filtered
 * @param prioritizationList list from config on prioritization
 * @returns prioritization string to be used for filtering
 */
function determineChannelPrioritization(
  channels: ChannelTypes.Channel[],
  prioritizationList: string[]
) {
  return prioritizationList.find(input => {
    return !!channels.find(channel => channel.name.includes(input));
  });
}

/**
 * Gets the channels that match the prioritization while taking into account the minimum channels
 * needed to beam. If priority is found, but filtering doesn't provide enough channels, will go onto
 * the next item in the prioritization list
 *
 * @param channels to be filtered
 * @param prioritizationList list from config on prioritization
 * @param minimumNumberOfChannels if beaming minimum channels to beam or minimum minimum waveforms for spectra if computing fk
 * @returns channels filtered down by prioritization
 */
export function inputChannelsByPrioritization(
  channels: ChannelTypes.Channel[],
  prioritizationList: string[],
  minimumNumberOfChannels: number
) {
  const prioritization = determineChannelPrioritization(channels, prioritizationList);
  if (!prioritization) return [];

  let filteredChannels: ChannelTypes.Channel[] = [];
  const prioritizationIndex = prioritizationList.indexOf(prioritization);
  for (let i = prioritizationIndex; i < prioritizationList.length; i += 1) {
    filteredChannels = channels.filter(channel => channel.name.includes(prioritizationList[i]));
    if (filteredChannels.length >= minimumNumberOfChannels) {
      break;
    }
  }
  return filteredChannels;
}
