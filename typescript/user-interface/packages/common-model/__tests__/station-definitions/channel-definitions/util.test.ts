import { parseWaveformChannelType } from '../../../src/ts/station-definitions/channel-definitions/util';

describe('Waveform Utils tests', () => {
  test('parseBeamType from channel name', () => {
    expect(parseWaveformChannelType(undefined)).toBeUndefined();
    expect(parseWaveformChannelType('foobar')).toBeUndefined();
    expect(parseWaveformChannelType('ASAR.AS01.BHZ')).toEqual('Raw channel');
    let channelName =
      'KSRS.beam.SHZ/beam,fk,coherent/steer,az_104.325deg,slow_13.808s_per_deg/33689b9f-8e74-36a2-a9eb-115ade4d6d9a';
    expect(parseWaveformChannelType(channelName)).toEqual('Fk beam');
    channelName =
      'KSRS.beam.SHZ/beam,event,coherent/steer,az_104.325deg,slow_13.808s_per_deg/33689b9f-8e74-36a2-a9eb-115ade4d6d9a';
    expect(parseWaveformChannelType(channelName)).toEqual('Event beam');
    channelName =
      'KSRS.beam.SHZ/beam,detection,coherent/steer,az_104.325deg,slow_13.808s_per_deg/33689b9f-8e74-36a2-a9eb-115ade4d6d9a';
    expect(parseWaveformChannelType(channelName)).toEqual('Detection beam');
    channelName = 'KSRS.temp.---';
    expect(parseWaveformChannelType(channelName)).toEqual('N/A');
    channelName =
      'KSRS.beam.SHZ/beam,foobar,coherent/steer,az_104.325deg,slow_13.808s_per_deg/33689b9f-8e74-36a2-a9eb-115ade4d6d9a';
    expect(parseWaveformChannelType(channelName)).toBeUndefined();
    expect(parseWaveformChannelType('KSRS.beam.SHZ/')).toBeUndefined();
  });
});
