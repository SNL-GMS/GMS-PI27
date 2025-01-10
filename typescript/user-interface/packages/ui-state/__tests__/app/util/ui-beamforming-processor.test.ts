import type { ChannelTypes } from '@gms/common-model';
import {
  eventBeamDefinition,
  PD01Channel,
  pdar,
  processingMaskDefinition
} from '@gms/common-model/__tests__/__data__';
import type { ProcessingMask, ProcessingOperation } from '@gms/common-model/lib/channel-segment';
import { Units } from '@gms/common-model/lib/common';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import {
  ChannelBandType,
  ChannelInstrumentType
} from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';

import { maskAndBeamWaveforms } from '../../../src/ts/app/util/ui-beam-processor';

describe('maskAndBeamWaveforms', () => {
  const createProcessingMasksMock: (
    channel: VersionReference<'name', ChannelTypes.Channel>,
    startTime: number,
    endTime: number,
    processingOperation: ProcessingOperation,
    phaseType: string
  ) => Promise<{
    processingMasks: ProcessingMask[];
    channel: Channel;
  }> = jest.fn(async () =>
    Promise.resolve({
      processingMasks: [],
      channel: { ...PD01Channel, processingDefinition: processingMaskDefinition }
    })
  );

  it('throws error if no channel segments are found', async () => {
    let error;
    await maskAndBeamWaveforms({
      beamDefinition: eventBeamDefinition,
      beamStartTime: 0,
      beamEndTime: 100,
      station: pdar,
      channels: pdar.allRawChannels,
      channelSegments: [],
      createProcessingMasks: createProcessingMasksMock,
      expandedTimeBuffer: 100,
      currentInterval: { startTimeSecs: 0, endTimeSecs: 100 }
    }).catch(e => {
      error = e;
    });

    expect(error.message).toEqual('Cannot create beam. No valid waveforms found for beaming.');
  });

  it('toasts error messages if channels are out of sample rate tolerance', async () => {
    let error;

    const outOfToleranceChannel = { ...PD01Channel, nominalSampleRateHz: 0 };
    await maskAndBeamWaveforms({
      beamDefinition: eventBeamDefinition,
      beamStartTime: 0,
      beamEndTime: 100,
      station: pdar,
      channels: [PD01Channel, outOfToleranceChannel],
      channelSegments: [],
      createProcessingMasks: createProcessingMasksMock,
      expandedTimeBuffer: 100,
      currentInterval: { startTimeSecs: 0, endTimeSecs: 100 }
    }).catch(e => {
      error = e;
    });

    expect(error.message).toEqual('Incompatible channels for PDAR');
    expect(error.details).toEqual(
      'Sample rates outside of tolerance (20.000+/-5 hz): PDAR.PD01.SHZ (0).'
    );
  });

  it('toasts error messages if channels have incompatible ground motion values', async () => {
    let error;

    const incompatibleChannel = {
      ...PD01Channel,
      units: Units.HERTZ,
      channelBandType: ChannelBandType.PERIOD_GREATER_TEN_DAYS,
      channelInstrumentType: ChannelInstrumentType.BOLOMETER,
      channelOrientationCode: 'N',
      orientationAngles: { verticalAngleDeg: 90, horizontalAngleDeg: 180 }
    };

    await maskAndBeamWaveforms({
      beamDefinition: eventBeamDefinition,
      beamStartTime: 0,
      beamEndTime: 100,
      station: pdar,
      channels: [PD01Channel, incompatibleChannel],
      channelSegments: [],
      createProcessingMasks: createProcessingMasksMock,
      expandedTimeBuffer: 100,
      currentInterval: { startTimeSecs: 0, endTimeSecs: 100 }
    }).catch(e => {
      error = e;
    });

    expect(error.message).toEqual('Incompatible channels for PDAR');
    expect(error.details).toEqual(
      'Inconsistent types of ground motion: PDAR.PD01.SHZ (band type: SHORT_PERIOD instrument type: HIGH_GAIN_SEISMOMETER units: NANOMETERS_PER_COUNT orientation code: Z horizontal angle: -1 vertical angle: 0 ), PDAR.PD01.SHZ (band type: PERIOD_GREATER_TEN_DAYS instrument type: BOLOMETER units: HERTZ orientation code: N horizontal angle: 180 vertical angle: 90 )'
    );
  });
});
