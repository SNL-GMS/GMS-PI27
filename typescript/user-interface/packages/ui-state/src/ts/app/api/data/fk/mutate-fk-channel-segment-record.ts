import type { ChannelSegmentTypes, FkTypes } from '@gms/common-model';
import type { WritableDraft } from 'immer/dist/internal';

import type { FkFrequencyThumbnailRecord } from '../../../../types';

/**
 * TODO: Delete this function after legacyComputeFk() is removed
 * Update FkFrequencyThumbnailRecord in state with frequency thumbnail
 *
 * @param args FkInputWithConfiguration
 * @param draft FkFrequencyThumbnailRecord
 * @param fkChannelSegment fk channel segment returned from computeFk call
 */
export const mutateFkThumbnailRecord = (
  fkFrequencyRange: FkTypes.FkFrequencyRange,
  signalDetectionId: string,
  draft: WritableDraft<FkFrequencyThumbnailRecord>,
  fkChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra>
): void => {
  if (!fkChannelSegment || !fkFrequencyRange) return;

  if (!draft[signalDetectionId]) {
    draft[signalDetectionId] = [];
  }

  // Find the index of thumbnail to replace else add it
  const frequencyBand: FkTypes.FkFrequencyRange = {
    lowFrequencyHz: fkFrequencyRange.lowFrequencyHz,
    highFrequencyHz: fkFrequencyRange.highFrequencyHz
  };
  const frequencyFk: FkTypes.FkFrequencyThumbnail = {
    fkSpectra: fkChannelSegment.timeseries[0],
    frequencyBand
  };
  const index = draft[signalDetectionId].findIndex(
    thumbnail =>
      thumbnail.frequencyBand.lowFrequencyHz === frequencyBand.lowFrequencyHz &&
      thumbnail.frequencyBand.highFrequencyHz === frequencyBand.highFrequencyHz
  );
  // replace
  if (index >= 0) {
    draft[signalDetectionId][index] = frequencyFk;
  } else {
    draft[signalDetectionId].push(frequencyFk);
  }
};
