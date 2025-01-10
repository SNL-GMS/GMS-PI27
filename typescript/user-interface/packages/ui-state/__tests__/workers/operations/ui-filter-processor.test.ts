import {
  cascadeFilterDefinition,
  linearFilterDefinition
} from '@gms/common-model/__tests__/__data__';
import type { WeavessTypes } from '@gms/weavess-core';

import {
  designFilter,
  filterChannelSegments
} from '../../../src/ts/workers/waveform-worker/operations/ui-filter-processor';
import { WaveformStore } from '../../../src/ts/workers/waveform-worker/worker-store/waveform-store';
import { filteredUiChannelSegmentWithClaimCheck, valuesAsNumbers } from '../../__data__';

describe('UI Filter Processor', () => {
  describe('UI Filter Processor: designFilter', () => {
    it('designs a linear filter', async () => {
      const filter = await designFilter({
        filterDefinition: linearFilterDefinition,
        taper: 0,
        removeGroupDelay: false
      });
      expect(filter).toMatchObject(linearFilterDefinition);
    });

    it('designs a cascade filter', async () => {
      const filter = await designFilter({
        filterDefinition: cascadeFilterDefinition,
        taper: 0,
        removeGroupDelay: false
      });
      expect(filter).toMatchObject(cascadeFilterDefinition);
    });
  });
  describe('UI Filter Processor: filterChannelSegments', () => {
    beforeAll(() => {
      // Arrange data in the store ahead of time
      filteredUiChannelSegmentWithClaimCheck.channelSegment.timeseries.forEach(async timeseries => {
        await WaveformStore.store(
          timeseries._uiClaimCheckId || '',
          new Float64Array(valuesAsNumbers)
        );
      });
    });

    const domainTimeRange: WeavessTypes.TimeRange = {
      startTimeSecs: 1638297900,
      endTimeSecs: 1638298200
    };
    it('filters a channel segment by linear filter', async () => {
      const results = await filterChannelSegments({
        channelSegments: [filteredUiChannelSegmentWithClaimCheck.channelSegment],
        filterDefinitions: { 40: linearFilterDefinition },
        taper: 0,
        removeGroupDelay: false,
        domainTimeRange
      });
      const filterName = results[0]._uiFilterId;
      expect(filterName).toBe(linearFilterDefinition.name);
    });

    it('filters a channel segment by cascade filter', async () => {
      const results = await filterChannelSegments({
        channelSegments: [filteredUiChannelSegmentWithClaimCheck.channelSegment],
        filterDefinitions: { 40: cascadeFilterDefinition },
        taper: 0,
        removeGroupDelay: false,
        domainTimeRange
      });
      const filterName = results[0]._uiFilterId;
      expect(filterName).toBe(cascadeFilterDefinition.name);
    });
  });
});
