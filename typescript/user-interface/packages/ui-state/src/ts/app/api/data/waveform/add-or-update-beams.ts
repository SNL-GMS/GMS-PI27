import type { WaveformTypes } from '@gms/common-model';
import type { Draft } from 'immer';

import type { UiChannelSegment } from '../../../../types';
import type { UiChannelSegmentByEventHypothesisId } from './find-event-beams-by-event-hypothesis-and-stations';

/**
 * Mutates a draft event beams record with new event beam {@link UiChannelSegment}s
 * ! Mutates the draft in place
 *
 * @param draft the writable draft ui channel segment by event hypothesis record
 * @param eventHypothesisId the event hypothesis ID that the event beams are associated with
 * @param uiChannelSegment the ui channel segments to add
 */
export function addOrUpdateEventBeams(
  draft: Draft<UiChannelSegmentByEventHypothesisId>,
  eventHypothesisId: string,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
): void {
  if (!draft[eventHypothesisId]) {
    draft[eventHypothesisId] = [];
  }

  uiChannelSegments.forEach(channelSegment => {
    const index = draft[eventHypothesisId].findIndex(
      cs =>
        cs.channelSegmentDescriptor.channel.name ===
        channelSegment.channelSegmentDescriptor.channel.name
    );
    // If one exists we should update it as we can only have 1 event beam per channel
    if (index !== -1) draft[eventHypothesisId][index] = channelSegment;
    else draft[eventHypothesisId].push(channelSegment);
  });
}
