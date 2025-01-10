import { linearFilterDefinition } from '@gms/common-model/__tests__/__data__';
import type { WeavessTypes } from '@gms/weavess-core';

import { WaveformStore } from '../../../src/ts/workers';
import {
  changeUniqueIdFilter,
  convertAndStoreTimeseries
} from '../../../src/ts/workers/waveform-worker/util/position-buffer-util';
import { channelSegmentWithSamples, claimCheckChannelSegment } from '../../__data__';

const domain: WeavessTypes.TimeRange = {
  startTimeSecs: channelSegmentWithSamples.timeseries[0].startTime,
  endTimeSecs: channelSegmentWithSamples.timeseries[0].endTime
};
describe('Position Buffer Utils', () => {
  it('has a WaveformStore it can access', () => {
    expect(WaveformStore).toBeDefined();
  });

  it('convertAndStoreTimeseries', async () => {
    const result = await convertAndStoreTimeseries(channelSegmentWithSamples, domain);
    expect(result).toMatchSnapshot();
    expect(await WaveformStore.retrieve(result[0]._uiClaimCheckId || '')).toBeDefined();
  });

  it('changeUniqueIdFilter', () => {
    expect(() => changeUniqueIdFilter('')).toThrow('There was an error parsing the uniqueId');
    expect(
      claimCheckChannelSegment.timeseries[0]._uiClaimCheckId?.includes(linearFilterDefinition.name)
    ).toBeFalsy();
    const changedId = changeUniqueIdFilter(
      claimCheckChannelSegment.timeseries[0]._uiClaimCheckId || '',
      linearFilterDefinition.name
    );
    expect(changedId.includes(linearFilterDefinition.name)).toBeTruthy();
  });
});
