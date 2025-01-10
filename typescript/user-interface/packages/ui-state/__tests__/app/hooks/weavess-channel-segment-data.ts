/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes } from '@gms/common-model';
import { WeavessTypes } from '@gms/weavess-core';

export const waveformChannelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> = {
  units: CommonTypes.Units.NANOMETERS,
  id: {
    channel: {
      name: 'AAK.AAK.BHZ',
      effectiveAt: 1274391900
    },
    startTime: 1274391900,
    endTime: 1274391900.4,
    creationTime: 1274391900
  },
  timeseriesType: ChannelSegmentTypes.TimeseriesType.WAVEFORM,
  timeseries: [
    {
      endTime: 1274391900.4,
      type: ChannelSegmentTypes.TimeseriesType.WAVEFORM,
      startTime: 1274391900,
      sampleRateHz: 40,
      samples: new Float64Array([
        223.633869, 227.47485600000002, 231.592173, 226.811664, 234.90813300000002, 232.39353,
        228.55254300000001, 231.757971, 227.47485600000002, 224.24179500000002, 231.675072,
        234.687069, 229.10520300000002, 234.687069, 224.68392300000002, 223.164108
      ]),
      sampleCount: 16
    }
  ],
  missingInputChannels: [],
  maskedBy: [],
  _uiFilterId: 'Unfiltered'
};

export const weavessChannelSegment: WeavessTypes.ChannelSegment = {
  configuredInputName: JSON.stringify(waveformChannelSegment.id),
  channelName: 'AAK.AAK.BHZ',
  wfFilterId: 'unfiltered',
  isSelected: false,
  description: 'unfiltered',
  descriptionLabelColor: '#f5f8fa',
  dataSegments: [
    {
      displayType: [WeavessTypes.DisplayType.LINE],
      color: '#4580e6',
      pointSize: 1,
      data: {
        startTimeSecs: 1274391900,
        endTimeSecs: 1274391900.4,
        sampleRate: 40,
        values: [
          -12.50173664093017, 233.5541229248047, -12.501389503479004, 237.5885314941406,
          -12.501041412353516, 249.0285949707031, -12.500694274902344, 240.24130249023438,
          -12.500347137451172, 227.83409118652344
        ]
      }
    },
    {
      displayType: [WeavessTypes.DisplayType.LINE],
      color: '#4580e6',
      pointSize: 1,
      data: {
        startTimeSecs: 1274399100,
        endTimeSecs: 1274400898.975,
        sampleRate: 40,
        values: [
          87.51215362548828, 226.728759765625, 87.51250457763672, 228.63543701171875,
          87.5128479003906, 228.13804626464844, 87.51319885253906, 222.72198486328125,
          87.51354217529297, 232.2830047607422
        ]
      }
    }
  ],
  channelSegmentBoundaries: {
    topMax: 307.306593,
    bottomMax: 154.606635,
    channelAvg: 230.31431241288792,
    samplesCount: 179980,
    offset: 307.306593,
    channelSegmentId: 'unfiltered'
  }
};
