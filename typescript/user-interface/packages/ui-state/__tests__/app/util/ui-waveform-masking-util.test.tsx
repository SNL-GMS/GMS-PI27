import {
  PD01Channel,
  processingMaskDefinition,
  qcSegment,
  qcSegment2Version,
  qcSegment3Version2,
  qcSegment4Version,
  qcSegment5Version,
  qcSegment6Version,
  qcSegmentAkasgBHE,
  qcSegmentAkasgBHN,
  qcSegmentVersion
} from '@gms/common-model/__tests__/__data__';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { WithRequired } from '@gms/common-model/lib/type-util/type-util';
import { MILLISECONDS_IN_SECOND } from '@gms/common-util';
import type { PriorityRequestConfig } from '@gms/ui-workers';
import { renderHook } from '@testing-library/react-hooks';
import type { AxiosResponse } from 'axios';
import Axios from 'axios';
import React from 'react';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { GetChannelsByNamesTimeRangeQueryArgs } from '../../../src/ts/app';
import type { AppState } from '../../../src/ts/app/store';
import {
  createProcessingMasksFromQCSegmentVersions,
  useCreateProcessingMasksFromChannelSegment
} from '../../../src/ts/app/util/ui-waveform-masking-util';
import { unfilteredSamplesUiChannelSegment } from '../../__data__';
import { appState } from '../../test-util';

const MOCK_UUID = 123456789;

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    epochSecondsNow: () => 100,
    uuid4: () => MOCK_UUID
  };
});

jest.mock('../../../src/ts/app/hooks/waveform-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/waveform-hooks');
  return {
    ...actual,
    useViewableInterval: () => [{ startTimeSecs: 0, endTimeSecs: 1000 }, jest.fn()]
  };
});

jest.mock('../../../src/ts/workers/api/fetch-channels-by-names-timerange', () => {
  const actual = jest.requireActual(
    '../../../src/ts/workers/api/fetch-channels-by-names-timerange'
  );
  return {
    ...actual,
    fetchChannelsByNamesTimeRange: async (
      requestConfig: WithRequired<
        PriorityRequestConfig<GetChannelsByNamesTimeRangeQueryArgs>,
        'data'
      >
    ): Promise<Channel[]> => {
      const { endTime, startTime } = requestConfig.data;
      if (startTime == null || endTime == null) {
        throw new Error('Error building mock Channel. startTime and endTime must be defined');
      }

      return Promise.resolve([PD01Channel]);
    }
  };
});

jest.mock('../../../src/ts/app/hooks/operational-time-period-configuration-hooks', () => {
  const app = jest.requireActual(
    '../../../src/ts/app/hooks/operational-time-period-configuration-hooks'
  );
  return {
    ...app,
    useEffectiveTime: jest.fn(() => PD01Channel.effectiveAt + 1000)
  };
});

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const response: AxiosResponse<unknown> = {
  status: 200,
  config: {},
  headers: {},
  statusText: '',
  data: {}
};

const mockAxiosRequest = jest.fn().mockImplementation(async requestConfig => {
  const { url } = requestConfig;
  if (url.includes('processing-mask')) {
    return Promise.resolve({
      ...response,
      data: {
        processingMaskDefinitionByPhaseByChannel: [
          {
            channel: requestConfig.data.channels[0],
            processingMaskDefinitionByPhase: {
              [requestConfig.data.phaseTypes[0]]: {
                ...processingMaskDefinition,
                processingOperation: ProcessingOperation.ROTATION
              }
            }
          }
        ]
      }
    });
  }
  if (url.includes('qc-segment')) {
    if (requestConfig.data.channels.find(chan => chan.name.includes('BHE'))) {
      return Promise.resolve({
        ...response,
        data: [
          {
            ...qcSegmentAkasgBHE,
            versionHistory: [
              {
                ...qcSegmentAkasgBHE.versionHistory[0],
                startTime: requestConfig.data.startTime,
                endTime: requestConfig.data.endTime
              }
            ]
          }
        ]
      });
    }
    if (requestConfig.data.channels.find(chan => chan.name.includes('BHN'))) {
      return Promise.resolve({
        ...response,
        data: [qcSegmentAkasgBHN]
      });
    }
  }

  const success = 'success';
  return Promise.resolve(success);
});
Axios.request = mockAxiosRequest;

describe('ui waveform masking util', () => {
  describe('createProcessingMasksFromQCSegmentVersions', () => {
    const segmentVersions = [
      qcSegmentVersion,
      qcSegment2Version,
      qcSegment3Version2,
      qcSegment4Version,
      qcSegment5Version
    ];

    it('is defined', () => {
      expect(createProcessingMasksFromQCSegmentVersions).toBeDefined();
    });
    it('filters out segments that do not match the mask definition', () => {
      const processingMasks = createProcessingMasksFromQCSegmentVersions(
        segmentVersions,
        processingMaskDefinition
      );
      expect(processingMasks[0].maskedQcSegmentVersions).toEqual([
        qcSegment3Version2,
        qcSegment5Version
      ]);
    });
    it('groups segments based on the threshold and sets teh start and end time to the min and max', () => {
      const processingMasks = createProcessingMasksFromQCSegmentVersions(
        segmentVersions.concat(qcSegment6Version),
        processingMaskDefinition
      );

      expect(processingMasks[0].maskedQcSegmentVersions).toEqual([
        qcSegment3Version2,
        qcSegment5Version
      ]);
      expect(processingMasks[0].startTime).toEqual(qcSegment3Version2.startTime);
      expect(processingMasks[0].endTime).toEqual(qcSegment5Version.endTime);
      expect(processingMasks[1].maskedQcSegmentVersions).toEqual([qcSegment6Version]);
      expect(processingMasks[1].startTime).toEqual(qcSegment6Version.startTime);
      expect(processingMasks[1].endTime).toEqual(qcSegment6Version.endTime);
    });
    it('generates a new UUID for the processing mask', () => {
      const processingMasks = createProcessingMasksFromQCSegmentVersions(
        segmentVersions.concat(qcSegment6Version),
        processingMaskDefinition
      );

      expect(processingMasks[0].id).toEqual(MOCK_UUID);
    });
    it('sets the effective at to now in seconds', () => {
      const processingMasks = createProcessingMasksFromQCSegmentVersions(
        segmentVersions.concat(qcSegment6Version),
        processingMaskDefinition
      );

      expect(processingMasks[0].effectiveAt).toEqual(Date.now() / MILLISECONDS_IN_SECOND);
    });

    it('sets the processing operation to that of the mask definition', () => {
      const processingMasks = createProcessingMasksFromQCSegmentVersions(
        segmentVersions.concat(qcSegment6Version),
        processingMaskDefinition
      );

      expect(processingMasks[0].processingOperation).toEqual(
        processingMaskDefinition.processingOperation
      );
    });
  });

  describe('useCreateProcessingMasksFromChannelSegment', () => {
    it('creates processing masks', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          channels: { ...appState.data.channels, raw: { [PD01Channel.name]: PD01Channel } },
          qcSegments: { [PD01Channel.name]: { [qcSegment.id]: qcSegment } },
          processingMaskDefinitionsByChannels: [
            {
              channel: PD01Channel,
              processingMaskDefinitions: { P: { EVENT_BEAM: processingMaskDefinition } }
            }
          ]
        }
      });

      const { result } = renderHook(() => useCreateProcessingMasksFromChannelSegment(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      const returnValue = await result.current(
        unfilteredSamplesUiChannelSegment,
        ProcessingOperation.EVENT_BEAM,
        'P'
      );
      expect(returnValue).toMatchSnapshot();
    });

    it('creates returns the original channel if no masks are applied', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          channels: { ...appState.data.channels, raw: { [PD01Channel.name]: PD01Channel } },
          qcSegments: { [PD01Channel.name]: {} },
          processingMaskDefinitionsByChannels: [
            {
              channel: PD01Channel,
              processingMaskDefinitions: { P: { EVENT_BEAM: processingMaskDefinition } }
            }
          ]
        }
      });

      const { result } = renderHook(() => useCreateProcessingMasksFromChannelSegment(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      const returnValue = await result.current(
        unfilteredSamplesUiChannelSegment,
        ProcessingOperation.EVENT_BEAM,
        'P'
      );
      expect(returnValue.channel).toEqual(PD01Channel);
    });
  });
});
