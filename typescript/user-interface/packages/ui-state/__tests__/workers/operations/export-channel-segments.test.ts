/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  convertUiChannelSegmentsToChannelSegments,
  exportChannelSegmentsWithFilterAssociations
} from '../../../src/ts/workers/waveform-worker/operations/export-channel-segments';
import { WaveformStore } from '../../../src/ts/workers/waveform-worker/worker-store/waveform-store';
import {
  claimCheckChannelSegment,
  unfilteredClaimCheckUiChannelSegment,
  unfilteredSamplesUiChannelSegment
} from '../../__data__';

describe('Export Channel Segments', () => {
  beforeAll(async () => {
    const sampleData = new Float64Array([
      1, 2.0000000000001, 3, 4.0000000000001, 5, 6.0000000000001, 7, 8.0000000000001, 9
    ]);
    // Arrange data in the store ahead of time
    await WaveformStore.store(
      claimCheckChannelSegment.timeseries[0]._uiClaimCheckId || '',
      sampleData
    );
  });
  describe('exportChannelSegmentsWithFilterAssociations', () => {
    it('will return a blob of the data', async () => {
      const uiChannelSegments = [];
      const result = await exportChannelSegmentsWithFilterAssociations({
        filterAssociations: [],
        channelSegments: uiChannelSegments
      });
      // Jest does not fully implement blob so we cant check the data
      expect(result.type).toBe('application/json');
    });
  });
  describe('convertUiChannelSegmentsToChannelSegments', () => {
    it('will not fail with empty data', async () => {
      const uiChannelSegments = [];
      const result = await convertUiChannelSegmentsToChannelSegments(uiChannelSegments);
      expect(result).toMatchObject([]);
    });

    it('will throw an error if a non claim check ui channel segment is processed', async () => {
      const uiChannelSegments = [unfilteredSamplesUiChannelSegment];
      await expect(convertUiChannelSegmentsToChannelSegments(uiChannelSegments)).rejects.toThrow(
        'Cannot convert timeseries that is not data claim check'
      );
    });

    it('will return properly formatted COI channel segments without loss of precision', async () => {
      const uiChannelSegments = [unfilteredClaimCheckUiChannelSegment];
      const result = await convertUiChannelSegmentsToChannelSegments(uiChannelSegments);
      const output = [
        {
          id: {
            channel: {
              effectiveAt: 1636503404,
              name: 'PDAR.PD01.SHZ'
            },
            creationTime: 1636503404,
            endTime: 1636503704,
            startTime: 1636503404
          },
          timeseries: [
            {
              endTime: 1638298200,
              sampleCount: 4,
              sampleRateHz: 40,
              samples: new Float64Array([
                2.0000000000001, 4.0000000000001, 6.0000000000001, 8.0000000000001
              ]),
              startTime: 1638297900,
              type: 'WAVEFORM'
            }
          ],
          timeseriesType: 'WAVEFORM',
          units: 'NANOMETERS'
        }
      ];
      expect(result).toMatchObject(output);
    });
  });
});
