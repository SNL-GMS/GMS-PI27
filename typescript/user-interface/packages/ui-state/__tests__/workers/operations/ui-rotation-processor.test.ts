import type { WaveformTypes } from '@gms/common-model';
import {
  akasgBHEChannel,
  akasgBHNChannel,
  sampleRotationDefinition
} from '@gms/common-model/__tests__/__data__';
import { ChannelOrientationType } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';

import { channelOrientationTypeToCode } from '../../../src/ts/app/util/channel-factory-util';
import type { UiChannelSegment } from '../../../src/ts/types';
import { maskAndRotate2d } from '../../../src/ts/workers/waveform-worker/operations/ui-rotation-processor';
import { buildUiChannelSegmentWithPopulatedClaimCheck } from '../../__data__';

describe('ui-rotation-processor', () => {
  // todo: fix test and remove any's
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('creates rotated channels and ui channel segments', async () => {
    const northChannel = akasgBHNChannel;
    const eastChannel = akasgBHEChannel;

    const northUiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> =
      await buildUiChannelSegmentWithPopulatedClaimCheck();
    const eastUiChannelSegment = await buildUiChannelSegmentWithPopulatedClaimCheck();

    const result: any = await maskAndRotate2d({
      rotationDefinition: sampleRotationDefinition,
      channels: [northChannel, eastChannel],
      uiChannelSegmentPair: [northUiChannelSegment, eastUiChannelSegment],
      rotationTimeInterval: { startTimeSecs: 0, endTimeSecs: 1 },
      processingMasks: []
    } as any);

    expect(result.channels[0]).toMatchObject({
      channelOrientationCode: channelOrientationTypeToCode(ChannelOrientationType.RADIAL),
      channelOrientationType: ChannelOrientationType.RADIAL
    });

    expect(result.channels[1]).toMatchObject({
      channelOrientationCode: channelOrientationTypeToCode(ChannelOrientationType.TRANSVERSE),
      channelOrientationType: ChannelOrientationType.TRANSVERSE
    });

    expect(result.uiChannelSegments).toHaveLength(2);

    expect(result.uiChannelSegments[0].channelSegment.timeseries[0]._uiClaimCheckId).toBeDefined();
    expect(result.uiChannelSegments[1].channelSegment.timeseries[0]._uiClaimCheckId).toBeDefined();
  });
});
