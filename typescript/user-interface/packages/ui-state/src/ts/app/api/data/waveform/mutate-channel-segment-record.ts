import type { WaveformTypes } from '@gms/common-model';
import type { Draft } from 'immer';

import type { UiChannelSegment, UIChannelSegmentRecord } from '../../../../types';

/**
 * Creates a repeatable unique ID for a uiChannelSegment based on the channel name / station name, filter id
 * and ui channel segment parameters
 *
 * @param channelName the channel name / station name
 * @param filterId the filter id
 * @param uiChannelSegment the ui channel segment
 * @returns a unique channel segment id
 */
const generateChannelSegmentId = (
  channelName: string,
  filterId: string,
  uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>
) => {
  return `${channelName}${filterId}${uiChannelSegment.channelSegmentDescriptor.channel.name}${uiChannelSegment.channelSegmentDescriptor.channel.effectiveAt}${uiChannelSegment.channelSegmentDescriptor.startTime}${uiChannelSegment.channelSegmentDescriptor.endTime}`;
};

/**
 * Gets a flat list of ids, of the known ui channel segments.
 *
 * @param draft draft of ui channel segment record
 * @returns array of unique ids of ui channel segments
 */
const getKnownUiChannelSegmentIds = (
  channelName: string,
  filterId: string,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
) => {
  return uiChannelSegments.map(segment => generateChannelSegmentId(channelName, filterId, segment));
};

/**
 * Mutates a writable draft ui channel segment record with new uiChannelSegments
 * ! Mutates the draft in place
 *
 * @param draft the writable draft ui channel segment record
 * @param channelName the unique channel name to associate to channel segment records
 * @param uiChannelSegment the ui channel segments to add
 */
export const mutateUiChannelSegmentsRecord = (
  draft: Draft<UIChannelSegmentRecord>,
  channelName: string,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  filterName: string | undefined = undefined
): void => {
  if (!channelName || !uiChannelSegments || !uiChannelSegments.length) return;

  uiChannelSegments.forEach(uiChannelSegment => {
    const filterId = filterName || uiChannelSegment?.channelSegment?._uiFilterId;
    if (!filterId) throw new Error('Cannot mutate the uiChannelSegment record, missing filterId');

    let knownIds: string[] = [];

    // If haven't seen the channel
    if (!draft[channelName]) {
      draft[channelName] = {};
    }

    // If we haven't seen this filter id entry in the dictionary add an empty array
    if (!draft[channelName][filterId]) {
      draft[channelName][filterId] = [];
    } else {
      knownIds = getKnownUiChannelSegmentIds(channelName, filterId, draft[channelName][filterId]);
    }

    // If the uiChannelSegment does not already exist in the draft
    if (!knownIds.includes(generateChannelSegmentId(channelName, filterId, uiChannelSegment))) {
      draft[channelName][filterId].push(uiChannelSegment);
    }
  });
};
