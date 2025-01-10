import { createChannelSegmentString, isSelectedWaveform } from '../../src/ts/channel-segment/util';
import type { ChannelSegmentTypes } from '../../src/ts/common-model';
import { pdarUiChannelSegmentDescriptor } from '../__data__';

describe('Channel Segment Util Tests', () => {
  it('createChannelSegmentString', () => {
    expect(createChannelSegmentString(pdarUiChannelSegmentDescriptor)).toMatchInlineSnapshot(
      `"PDAR.PD01.SHZ.1636503404.1636503404.1636503404.1636503704"`
    );
    const nullChannelSegmentDescriptor: unknown = undefined;
    expect(() =>
      createChannelSegmentString(
        nullChannelSegmentDescriptor as ChannelSegmentTypes.ChannelSegmentDescriptor
      )
    ).toThrow();
  });

  it('isSelectedWaveform', () => {
    const selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[] = [];
    const notPdarUiChannelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor = {
      ...pdarUiChannelSegmentDescriptor,
      channel: {
        ...pdarUiChannelSegmentDescriptor.channel,
        name: 'notPdar'
      }
    };
    expect(isSelectedWaveform(pdarUiChannelSegmentDescriptor, selectedWaveforms)).toBeFalsy();
    selectedWaveforms.push(notPdarUiChannelSegmentDescriptor);
    expect(isSelectedWaveform(pdarUiChannelSegmentDescriptor, selectedWaveforms)).toBeFalsy();
    selectedWaveforms.push(pdarUiChannelSegmentDescriptor);
    expect(isSelectedWaveform(pdarUiChannelSegmentDescriptor, selectedWaveforms)).toBeTruthy();
  });
});
