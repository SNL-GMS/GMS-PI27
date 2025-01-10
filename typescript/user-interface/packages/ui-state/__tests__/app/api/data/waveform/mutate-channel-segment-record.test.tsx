import type { WaveformTypes } from '@gms/common-model';

import { mutateUiChannelSegmentsRecord } from '../../../../../src/ts/app/api/data/waveform/mutate-channel-segment-record';
import type { UiChannelSegment } from '../../../../../src/ts/types';
import { uiChannelSegmentRecord, unfilteredClaimCheckUiChannelSegment } from '../../../../__data__';

describe('Waveform Data Cache', () => {
  it('adds a channel segment', () => {
    const waveformCache = {};

    mutateUiChannelSegmentsRecord(waveformCache, 'PDAR.PD01.SHZ', [
      unfilteredClaimCheckUiChannelSegment
    ]);
    expect(waveformCache).toEqual(uiChannelSegmentRecord);
  });

  it('can exercise immer produce method with undefined channel segment', () => {
    const waveformCache = {};

    mutateUiChannelSegmentsRecord(waveformCache, 'PDAR.PD01.SHZ', []);
    expect(waveformCache).toEqual({});
  });

  it('will not add duplicate channel segments', () => {
    const waveformCache = {};
    mutateUiChannelSegmentsRecord(waveformCache, 'PDAR.PD01.SHZ', [
      unfilteredClaimCheckUiChannelSegment
    ]);

    mutateUiChannelSegmentsRecord(waveformCache, 'PDAR.PD01.SHZ', [
      unfilteredClaimCheckUiChannelSegment
    ]);

    expect(waveformCache).toEqual(uiChannelSegmentRecord);
  });

  it('will not add non duplicate channel segments', () => {
    const a: UiChannelSegment<WaveformTypes.Waveform> = {
      ...unfilteredClaimCheckUiChannelSegment,
      channelSegmentDescriptor: {
        ...unfilteredClaimCheckUiChannelSegment.channelSegmentDescriptor,
        channel: {
          name: 'A',
          effectiveAt: 0
        }
      }
    };

    const b: UiChannelSegment<WaveformTypes.Waveform> = {
      ...unfilteredClaimCheckUiChannelSegment,
      channelSegmentDescriptor: {
        ...unfilteredClaimCheckUiChannelSegment.channelSegmentDescriptor,
        channel: {
          name: 'B',
          effectiveAt: 0
        }
      }
    };

    const waveformCache = {};
    mutateUiChannelSegmentsRecord(waveformCache, 'PDAR.PD01.SHZ', [a]);

    mutateUiChannelSegmentsRecord(waveformCache, 'PDAR.PD01.SHZ', [b]);

    expect(waveformCache).toEqual({
      'PDAR.PD01.SHZ': {
        Unfiltered: [a, b]
      }
    });
  });

  it('will add channel segments to the correct channel name', () => {
    const waveformCache = {};
    mutateUiChannelSegmentsRecord(waveformCache, 'A', [unfilteredClaimCheckUiChannelSegment]);

    mutateUiChannelSegmentsRecord(waveformCache, 'B', [unfilteredClaimCheckUiChannelSegment]);

    expect(waveformCache).toEqual({
      A: {
        Unfiltered: [unfilteredClaimCheckUiChannelSegment]
      },
      B: {
        Unfiltered: [unfilteredClaimCheckUiChannelSegment]
      }
    });
  });
});
