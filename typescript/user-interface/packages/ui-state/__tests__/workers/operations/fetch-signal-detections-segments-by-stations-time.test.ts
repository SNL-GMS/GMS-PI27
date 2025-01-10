/* eslint-disable @typescript-eslint/no-magic-numbers */
import type {
  ChannelSegmentTypes,
  CommonTypes,
  SignalDetectionTypes,
  WaveformTypes
} from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { uuid } from '@gms/common-util';
import type { AxiosResponse } from 'axios';
import Axios from 'axios';
import { enableMapSet } from 'immer';

import { config } from '../../../src/ts/app/api/data/signal-detection/endpoint-configuration';
import type { GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs } from '../../../src/ts/app/api/data/signal-detection/get-signal-detections-segments-by-station-time';
import type { FetchSignalDetectionWithSegmentsParameters } from '../../../src/ts/workers/waveform-worker/operations/fetch-signal-detections-segments-by-stations-time';
import {
  fetchSignalDetectionsWithSegments,
  requestSignalDetectionsWithSegments
} from '../../../src/ts/workers/waveform-worker/operations/fetch-signal-detections-segments-by-stations-time';
import { unfilteredSamplesUiChannelSegment } from '../../__data__';

enableMapSet();

// mock the uuid
uuid.asString = jest.fn().mockImplementation(() => '12345789');

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);
const channelSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[] = [
  unfilteredSamplesUiChannelSegment.channelSegment
];
describe('Signal Detection Query', () => {
  it('fetchSignalDetectionsWithSegments defined', () => {
    expect(fetchSignalDetectionsWithSegments).toBeDefined();
  });
  it('requestSignalDetectionsAndConvertWaveforms defined', () => {
    expect(requestSignalDetectionsWithSegments).toBeDefined();
  });

  describe('fetchSignalDetection', () => {
    const now = Date.now() / 1000;
    const timeRange: CommonTypes.TimeRange = {
      startTimeSecs: now - 3600,
      endTimeSecs: now
    };
    const aakStation = {
      name: 'AAK',
      effectiveAt: timeRange.startTimeSecs
    };
    const signalDetectionQueryArgs: GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs = {
      stations: [aakStation],
      startTime: timeRange.startTimeSecs,
      endTime: timeRange.endTimeSecs,
      stageId: {
        name: 'AL1',
        effectiveTime: timeRange.startTimeSecs
      }
    };
    const response: AxiosResponse<{
      channelSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[];
      signalDetections: SignalDetectionTypes.SignalDetection[];
    }> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: {
        channelSegments,
        signalDetections: signalDetectionsData
      }
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));

    const sdConfig =
      config.signalDetection.services.getDetectionsWithSegmentsByStationsAndTime.requestConfig;
    sdConfig.data = signalDetectionQueryArgs;
    sdConfig.baseURL = 'localhost:8000/';
    const params: FetchSignalDetectionWithSegmentsParameters = {
      requestConfig: sdConfig,
      originalDomain: timeRange
    };
    it('fetchSignalDetection returns the expected result with valid args', async () => {
      const result = await fetchSignalDetectionsWithSegments(params);
      expect(result).toMatchSnapshot();
    });

    it('fetchSignalDetection no baseURL', async () => {
      const badBaseURL = {
        ...params,
        requestConfig: {
          ...params.requestConfig,
          baseURL: undefined
        }
      };
      await expect(fetchSignalDetectionsWithSegments(badBaseURL)).rejects.toThrow();
    });
  });
});
