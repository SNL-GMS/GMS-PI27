/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessUtil } from '@gms/weavess-core';
import cloneDeep from 'lodash/cloneDeep';

import {
  channelSegmentToWeavessChannelSegment,
  getTimeRangeFromDataSegment,
  getTimeRangeFromWeavessChannelSegment
} from '../../../src/ts/app/util/data-segment-util';
import { csTimeRange, unfilteredClaimCheckUiChannelSegment } from '../../__data__';

const dsTimeRange: WeavessTypes.TimeRange = {
  startTimeSecs: 1000,
  endTimeSecs: 2000
};

const valueInput = [0, 100, -5, 10, -5, 1];
const float32Input: number[] = [];
const timeValuePairs: WeavessTypes.TimeValuePair[] = [];
const timeInc = (dsTimeRange.endTimeSecs - dsTimeRange.startTimeSecs) / (valueInput.length - 1);
valueInput.forEach((value, index) => {
  const timeSecs = timeInc * index + dsTimeRange.startTimeSecs;
  timeValuePairs.push({ timeSecs, value });
  float32Input.push(timeSecs);
  float32Input.push(value);
});

const float32Buffer = Float32Array.from(float32Input);
const dataSegment = WeavessUtil.createFlatLineDataSegment(
  dsTimeRange.startTimeSecs,
  dsTimeRange.endTimeSecs,
  5
);
describe('Data segment util tests', () => {
  test('getTimeRangeFromDataSegment isDataBySampleRate', () => {
    expect(getTimeRangeFromDataSegment(dataSegment)).toEqual(dsTimeRange);
  });

  test('getTimeRangeFromDataSegment DataClaimCheck', () => {
    const claimCheckDataSegment = cloneDeep(dataSegment);
    claimCheckDataSegment.data = {
      ...claimCheckDataSegment.data,
      domainTimeRange: {
        startTimeSecs: 1,
        endTimeSecs: 2
      },
      sampleRate: 1,
      startTimeSecs: 1,
      endTimeSecs: 2,
      values: undefined,
      id: 'foo'
    };
    expect(getTimeRangeFromDataSegment(claimCheckDataSegment)).toMatchInlineSnapshot(`
      {
        "endTimeSecs": 2,
        "startTimeSecs": 1,
      }
    `);
  });

  test('getTimeRangeFromDataSegment DataByTime float32Array', () => {
    const dataByTime = cloneDeep(dataSegment);
    dataByTime.data = {
      values: float32Buffer
    };
    expect(getTimeRangeFromDataSegment(dataByTime)).toEqual(dsTimeRange);
  });

  test('getTimeRangeFromDataSegment DataByTime TimeValuePair', () => {
    const dataByTime = cloneDeep(dataSegment);
    dataByTime.data = {
      values: timeValuePairs
    };
    expect(getTimeRangeFromDataSegment(dataByTime)).toEqual(dsTimeRange);
  });

  test('getTimeRangeFromWeavessChannelSegment then gets time range', () => {
    const weavessChannelSegment = channelSegmentToWeavessChannelSegment(
      unfilteredClaimCheckUiChannelSegment,
      {
        waveformColor: 'red',
        labelTextColor: 'green'
      }
    );
    expect(weavessChannelSegment).toMatchSnapshot();
    expect(getTimeRangeFromWeavessChannelSegment(weavessChannelSegment)).toEqual(csTimeRange);
  });
});
