import {
  asarAS01Channel,
  asarAS02Channel,
  eventBeamDefinition,
  PD01Channel,
  pd01ProcessingMask,
  PD02Channel,
  PD03Channel,
  pdar
} from '@gms/common-model/__tests__/__data__';

import { maskAndBeamWaveformsWorker } from '../../../src/ts/workers/waveform-worker/operations/ui-beam-processor';
import { channelSegmentWithSamples, filteredUiChannelSegmentWithClaimCheck } from '../../__data__';

jest.mock('../../../src/ts/app/util/channel-factory', () => {
  const actual = jest.requireActual('../../../src/ts/app/util/channel-factory');

  return {
    ...actual,
    // Have the creates return different channels for testing
    // eslint-disable-next-line @typescript-eslint/require-await
    createBeamed: jest.fn(async () => asarAS01Channel),
    // eslint-disable-next-line @typescript-eslint/require-await
    createFiltered: jest.fn(async () => asarAS02Channel)
  };
});

jest.mock('../../../src/ts/workers/waveform-worker/operations/export-channel-segments', () => {
  const actual = jest.requireActual(
    '../../../src/ts/workers/waveform-worker/operations/export-channel-segments'
  );
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/require-await
    convertUiChannelSegmentsToChannelSegments: jest.fn(async () => channelSegmentWithSamples)
  };
});

describe('maskAndBeamWaveformsWorker', () => {
  it('makes calls to maskAndBeamWaveforms and post processes', async () => {
    const result = await maskAndBeamWaveformsWorker({
      beamDefinition: eventBeamDefinition,
      beamStartTime: 1636503404,
      beamEndTime: 1636503704,
      station: pdar,
      currentInterval: { startTimeSecs: 1636503404, endTimeSecs: 1636503704 },
      filteredChannelSegments: [filteredUiChannelSegmentWithClaimCheck],
      processingMasksByChannel: [{ channel: PD01Channel, processingMasks: [pd01ProcessingMask] }],
      missingInputChannels: [
        { channel: PD02Channel, timeRanges: [{ startTime: 1636503304, endTime: 1636503804 }] },
        { channel: PD03Channel, timeRanges: [{ startTime: 1636503304, endTime: 1636503804 }] }
      ]
    });

    expect(result).toMatchSnapshot();
  });
});
