import type { ChannelSegmentTypes, FkTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';

import { mutateFkThumbnailRecord } from '../../../../../src/ts/app/api/data/fk/mutate-fk-channel-segment-record';
import type { FkFrequencyThumbnailRecord } from '../../../../../src/ts/types';
import { fkInput } from '../../../../__data__';
import { getTestFkChannelSegment } from '../../../../__data__/fk/fk-channel-segment-data';

const fkChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra> =
  getTestFkChannelSegment(signalDetectionsData[0]);
const fkFrequencyThumbnail: FkTypes.FkFrequencyThumbnail = {
  fkSpectra: fkChannelSegment.timeseries[0],
  frequencyBand: {
    highFrequencyHz: fkInput.configuration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz,
    lowFrequencyHz: fkInput.configuration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz
  }
};
describe('Fk Frequency Thumbnail Record', () => {
  it('adds a fk channel segment', () => {
    const fkThumbnailRecord: FkFrequencyThumbnailRecord = {};

    mutateFkThumbnailRecord(
      fkInput.configuration.fkSpectraParameters.fkFrequencyRange,
      fkInput.signalDetectionId,
      fkThumbnailRecord,
      fkChannelSegment
    );
    expect(fkThumbnailRecord[fkInput.signalDetectionId]).toEqual([fkFrequencyThumbnail]);
  });

  it('will not add duplicate fk channel segments', () => {
    const fkThumbnailRecord: FkFrequencyThumbnailRecord = {};
    mutateFkThumbnailRecord(
      fkInput.configuration.fkSpectraParameters.fkFrequencyRange,
      fkInput.signalDetectionId,
      fkThumbnailRecord,
      fkChannelSegment
    );
    mutateFkThumbnailRecord(
      fkInput.configuration.fkSpectraParameters.fkFrequencyRange,
      fkInput.signalDetectionId,
      fkThumbnailRecord,
      fkChannelSegment
    );

    expect(Object.keys(fkThumbnailRecord)).toHaveLength(1);
    expect(fkThumbnailRecord[fkInput.signalDetectionId]).toHaveLength(1);
  });
});
