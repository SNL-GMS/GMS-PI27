/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WeavessTypes } from '@gms/weavess-core';
import cloneDeep from 'lodash/cloneDeep';

import { getChannelSegmentsFromStationAndTime } from '../../../src/ts/components/weavess-waveform-display/utils';

function createConfiguredInputString(channelName: string): string {
  const csd = {
    channel: {
      name: channelName,
      effectiveAt: 0
    },
    startTime: 0,
    endTime: 100,
    creationTime: 0
  };
  return JSON.stringify(csd);
}
describe('[Weavess] Waveform display utils', () => {
  describe('getChannelSegmentsFromStationAndTime', () => {
    const channelSegmentsRecordDefaultChannel: Record<string, WeavessTypes.ChannelSegment[]> = {};
    channelSegmentsRecordDefaultChannel[WeavessTypes.UNFILTERED] = [
      {
        configuredInputName: createConfiguredInputString('ABC'),
        channelName: 'ABC',
        wfFilterId: WeavessTypes.UNFILTERED,
        isSelected: false,
        dataSegments: [
          {
            color: 'tomato',
            pointSize: 1,
            data: {
              startTimeSecs: 0,
              endTimeSecs: 100,
              sampleRate: 40,
              values: Float32Array.from([0, 0, 1, 10, 2, 20, 3, 30])
            }
          }
        ]
      }
    ];
    channelSegmentsRecordDefaultChannel.Filter1 = [
      {
        configuredInputName: createConfiguredInputString('ABC'),
        channelName: 'ABC',
        wfFilterId: 'Filter1',
        isSelected: false,
        dataSegments: [
          {
            color: 'tomato',
            pointSize: 1,
            data: {
              startTimeSecs: 0,
              endTimeSecs: 100,
              sampleRate: 40,
              values: Float32Array.from([0, 0, 1, 5, 2, 10, 3, 15])
            }
          }
        ]
      }
    ];
    const channelSegmentsRecordNonDefaultChannel: Record<string, WeavessTypes.ChannelSegment[]> =
      {};
    channelSegmentsRecordNonDefaultChannel[WeavessTypes.UNFILTERED] = [
      {
        configuredInputName: createConfiguredInputString('ABC.DEF1.GHI'),
        channelName: 'ABC.DEF1.GHI',
        wfFilterId: WeavessTypes.UNFILTERED,
        isSelected: false,
        dataSegments: [
          {
            color: 'tomato',
            pointSize: 1,
            data: {
              startTimeSecs: 0,
              endTimeSecs: 100,
              sampleRate: 40,
              values: Float32Array.from([0, 0, 1, 10, 2, 20, 3, 30])
            }
          }
        ]
      }
    ];
    channelSegmentsRecordNonDefaultChannel.Filter1 = [
      {
        configuredInputName: createConfiguredInputString('ABC.DEF1.GHI'),
        channelName: 'ABC.DEF1.GHI',
        wfFilterId: 'Filter1',
        isSelected: false,
        dataSegments: [
          {
            color: 'tomato',
            pointSize: 1,
            data: {
              startTimeSecs: 0,
              endTimeSecs: 100,
              sampleRate: 40,
              values: Float32Array.from([0, 0, 1, 5, 2, 10, 3, 15])
            }
          }
        ]
      }
    ];
    const channelSegmentsRecordNonDefaultChannel2: Record<string, WeavessTypes.ChannelSegment[]> =
      {};
    channelSegmentsRecordNonDefaultChannel2[WeavessTypes.UNFILTERED] = [
      {
        configuredInputName: createConfiguredInputString('ABC.DEF2.GHI'),
        channelName: 'ABC.DEF2.GHI',
        wfFilterId: WeavessTypes.UNFILTERED,
        isSelected: false,
        dataSegments: [
          {
            color: 'tomato',
            pointSize: 1,
            data: {
              startTimeSecs: 0,
              endTimeSecs: 100,
              sampleRate: 40,
              values: Float32Array.from([0, 0, 1, 10, 2, 20, 3, 30])
            }
          }
        ]
      }
    ];
    const stations: WeavessTypes.Station[] = [
      {
        id: 'ABC',
        name: `ABC`,
        defaultChannel: {
          height: 40,
          id: 'ABC.DEF.GHI/other-channel-name-info',
          name: 'ABC.DEF.GHI',
          isSelected: false,
          timeOffsetSeconds: 0,
          waveform: {
            channelSegmentId: WeavessTypes.UNFILTERED,
            channelSegmentsRecord: channelSegmentsRecordDefaultChannel
          }
        },
        nonDefaultChannels: [
          {
            height: 40,
            id: 'ABC.DEF1.GHI',
            name: 'ABC.DEF1.GHI',
            isSelected: false,
            timeOffsetSeconds: 0,
            waveform: {
              channelSegmentId: 'Filter1',
              channelSegmentsRecord: channelSegmentsRecordNonDefaultChannel
            }
          },
          {
            height: 40,
            id: 'ABC.DEF2.GHI',
            name: 'ABC.DEF2.GHI',
            isSelected: false,
            waveform: {
              channelSegmentId: WeavessTypes.UNFILTERED,
              channelSegmentsRecord: channelSegmentsRecordNonDefaultChannel2
            }
          }
        ]
      }
    ];
    const filteredDefaultChanStations = cloneDeep(stations);
    if (filteredDefaultChanStations[0].defaultChannel.waveform)
      filteredDefaultChanStations[0].defaultChannel.waveform.channelSegmentId = 'Filter1';

    it('gets unfiltered channel segments for default channel', () => {
      const chanSegs = getChannelSegmentsFromStationAndTime('ABC.DEF.GHI', 1, stations, true);
      expect(chanSegs).toStrictEqual(channelSegmentsRecordDefaultChannel[WeavessTypes.UNFILTERED]);
    });
    it('gets filtered channel segments for default channel', () => {
      const chanSegs = getChannelSegmentsFromStationAndTime(
        'ABC.DEF.GHI',
        1,
        filteredDefaultChanStations,
        true
      );
      expect(chanSegs).toStrictEqual(channelSegmentsRecordDefaultChannel.Filter1);
    });
    it('gets unfiltered channel segments for non-default channel', () => {
      const chanSegs = getChannelSegmentsFromStationAndTime('ABC.DEF2.GHI', 1, stations, false);
      expect(chanSegs).toStrictEqual(
        channelSegmentsRecordNonDefaultChannel2[WeavessTypes.UNFILTERED]
      );
    });
    it('gets filtered channel segments for non-default channel', () => {
      const chanSegs = getChannelSegmentsFromStationAndTime('ABC.DEF1.GHI', 1, stations, false);
      expect(chanSegs).toStrictEqual(channelSegmentsRecordNonDefaultChannel.Filter1);
    });
  });
});
