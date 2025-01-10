import { ChannelSegmentTypes } from '@gms/common-model';
import {
  PD01Channel,
  PD02Channel,
  PD03Channel,
  signalDetectionAsarAs01Shz,
  signalDetectionsData,
  signalDetectionsRecord
} from '@gms/common-model/__tests__/__data__';
import { UNFILTERED } from '@gms/common-model/lib/filter';
import { findArrivalTimeFeatureMeasurementUsingSignalDetection } from '@gms/common-model/lib/signal-detection/util';
import { renderHook } from '@testing-library/react-hooks';
import Axios from 'axios';
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { addChannelSegments, addSignalDetections, dataInitialState } from '../../../src/ts/app';
import type { GetChannelSegmentsByChannelQueryArgs } from '../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel';
import {
  collectSdIdsToMultiSelect,
  collectSdIdsToSingleSelect,
  collectWaveformsToMultiSelect,
  collectWaveformsToSingleSelect,
  useCacheChannelSegmentsByChannels,
  useGetChannelSegments,
  useGetChannelSegmentsByChannels,
  useGetRawUnfilteredUiChannelSegments,
  useGetVisibleChannelSegmentsByStationAndTime,
  useSetSelectedWaveformsByChannelSegmentDescriptorIds
} from '../../../src/ts/app/hooks/channel-segment-hooks';
import { initialState } from '../../../src/ts/app/state/reducer';
import type { AppState } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';
import {
  unfilteredClaimCheckUiChannelSegment,
  unfilteredSamplesUiChannelSegment
} from '../../__data__';
import { appState } from '../../test-util';

jest.mock('../../../src/ts/app/hooks/operational-time-period-configuration-hooks', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/hooks/operational-time-period-configuration-hooks'
  );
  return {
    ...actual,
    useEffectiveTime: jest.fn(() => 100)
  };
});

jest.mock('../../../src/ts/app/hooks/event-beams-by-event-hypothesis-and-stations-hooks', () => {
  const app = jest.requireActual(
    '../../../src/ts/app/hooks/event-beams-by-event-hypothesis-and-stations-hooks'
  );
  return {
    ...app,
    useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent: jest.fn(() => {
      return {
        data: {},
        pending: 0,
        fulfilled: 0,
        rejected: 0,
        isLoading: false,
        isError: false
      };
    })
  };
});

describe('channel segment hooks', () => {
  it('exists', () => {
    expect(useGetChannelSegments).toBeDefined();
    expect(useGetChannelSegmentsByChannels).toBeDefined();
  });

  it('useGetRawUnfilteredUIChannelSegments get uiChannelSegments', async () => {
    const myDataInitialState = cloneDeep(dataInitialState);
    myDataInitialState.channels.raw = { key1: { name: 'key1' } } as any;
    myDataInitialState.uiChannelSegments = {
      chanSegName: {
        Unfiltered: [{ channelSegmentDescriptor: { channel: { name: 'key1' } } } as any]
      }
    };
    const myAppState: AppState = {
      eventManagerApi: {} as any,
      processingConfigurationApi: {} as any,
      processingStationApi: {} as any,
      signalEnhancementConfigurationApi: {} as any,
      userManagerApi: {} as any,
      workflowApi: {} as any,
      stationDefinitionApi: {} as any,
      systemEventGatewayApi: {} as any,
      data: myDataInitialState,
      history: {} as any,
      app: cloneDeep(initialState)
    };
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(myAppState);

    function Wrapper({ children }) {
      return <Provider store={store}>{children}</Provider>;
    }
    const { result } = renderHook(() => useGetRawUnfilteredUiChannelSegments(), {
      wrapper: Wrapper
    });
    expect(typeof result.current).toBe('function');
    const val = await result.current();
    expect(val).toMatchInlineSnapshot(`
      [
        {
          "channelSegmentDescriptor": {
            "channel": {
              "name": "key1",
            },
          },
        },
      ]
    `);
  });

  it('useGetChannelSegmentsByChannels returns an object with loading values', () => {
    const mockAxios = jest.fn().mockImplementation(async () =>
      Promise.resolve({
        data: {
          /* empty */
        }
      })
    );
    Axios.request = mockAxios;

    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const dataInitialStateCopy = clone(dataInitialState);
    dataInitialStateCopy.uiChannelSegments = {
      'PDAR.BHZ': { unfiltered: [unfilteredSamplesUiChannelSegment] }
    };
    const mockAppState = appState;
    mockAppState.data = dataInitialStateCopy;
    const store = mockStoreCreator(mockAppState);
    const queryArgs: GetChannelSegmentsByChannelQueryArgs = {
      startTime: 1274391900,
      endTime: 1274399099,
      channels: [
        { name: 'PDAR.BHZ', effectiveAt: 101 },
        { name: 'PDAR.BHA', effectiveAt: 101 }
      ]
    };

    function Wrapper({ children }) {
      return <Provider store={store}>{children}</Provider>;
    }
    const { result } = renderHook(() => useGetChannelSegmentsByChannels(queryArgs), {
      wrapper: Wrapper
    });
    expect(result.current).toMatchSnapshot();
  });

  it('useGetChannelSegmentsByChannels filters out channel segments outside the requested range', () => {
    const mockAxios = jest.fn().mockImplementation(async () =>
      Promise.resolve({
        data: {
          /* empty */
        }
      })
    );
    Axios.request = mockAxios;

    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const dataInitialStateCopy = clone(dataInitialState);
    dataInitialStateCopy.uiChannelSegments = {
      'PDAR.BHZ': { unfiltered: [unfilteredSamplesUiChannelSegment] }
    };
    const mockAppState = appState;
    mockAppState.data = dataInitialStateCopy;
    const store = mockStoreCreator(mockAppState);
    const queryArgs: GetChannelSegmentsByChannelQueryArgs = {
      startTime: 0,
      endTime: 100,
      channels: [
        { name: 'PDAR.BHZ', effectiveAt: 101 },
        { name: 'PDAR.BHA', effectiveAt: 101 }
      ]
    };

    function Wrapper({ children }) {
      return <Provider store={store}>{children}</Provider>;
    }
    const { result } = renderHook(() => useGetChannelSegmentsByChannels(queryArgs), {
      wrapper: Wrapper
    });
    expect(result.current).toMatchSnapshot();
  });

  it('hook query for channel segments', () => {
    const mockAxios = jest.fn().mockImplementation(async () =>
      Promise.resolve({
        data: {
          /* empty */
        }
      })
    );
    Axios.request = mockAxios;

    const store = getStore();

    function Component1() {
      const result = useGetChannelSegments({ startTimeSecs: 1274391900, endTimeSecs: 1274399099 });
      return <>{JSON.stringify(result.data)}</>;
    }

    function Component2() {
      // call twice to hit other blocks of code
      const result = useGetChannelSegments({ startTimeSecs: 1274391900, endTimeSecs: 1274399099 });
      return <>{JSON.stringify(result.data)}</>;
    }

    expect(
      create(
        <Provider store={store}>
          <Component1 />
          <Component2 />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    expect(
      create(
        <Provider store={store}>
          <Component1 />
          <Component2 />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  describe('useCacheChannelSegmentsByChannels', () => {
    it('is defined', () => {
      expect(useCacheChannelSegmentsByChannels).toBeDefined();
    });

    it('pre-caches channel segments for all channels', async () => {
      const mockAxios = jest.fn().mockImplementation(async () =>
        Promise.resolve({
          data: {
            /* empty */
          }
        })
      );
      Axios.request = mockAxios;

      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          channels: {
            ...appState.data.channels,
            raw: {
              [PD01Channel.name]: PD01Channel,
              [PD02Channel.name]: PD02Channel,
              [PD03Channel.name]: PD03Channel
            }
          }
        }
      };
      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }

      const renderedHook = await act(() =>
        renderHook(
          () =>
            useCacheChannelSegmentsByChannels({
              startTimeSecs: 100,
              endTimeSecs: 500
            }),
          {
            wrapper: Wrapper
          }
        )
      );

      await act(() => renderedHook.rerender());

      expect(mockAxios).toMatchInlineSnapshot(`
        [MockFunction] {
          "calls": [
            [
              {
                "baseURL": "http://localhost/waveform-manager-service/waveform",
                "data": {
                  "channels": [
                    {
                      "effectiveAt": 100,
                      "name": "PDAR.PD01.SHZ",
                    },
                    {
                      "effectiveAt": 100,
                      "name": "PDAR.PD02.SHZ",
                    },
                    {
                      "effectiveAt": 100,
                      "name": "PDAR.PD03.SHZ",
                    },
                  ],
                  "endTime": 500,
                  "startTime": 100,
                },
                "headers": {
                  "Cancel-Token": "CANCEL_ON_INTERVAL_CLOSE",
                  "accept": "application/msgpack",
                  "content-type": "application/json",
                  "pre-cache": "-9007199254740991",
                },
                "method": "POST",
                "proxy": false,
                "timeout": 180000,
                "transformRequest": [
                  [Function],
                ],
                "transformResponse": [
                  [Function],
                ],
                "url": "http://localhost/waveform-manager-service/waveform/channel-segment/query/channel-timerange",
              },
            ],
          ],
          "results": [
            {
              "type": "return",
              "value": Promise {},
            },
          ],
        }
      `);
    });
  });

  describe('useVisibleChannelSegmentsByStationAndTime', () => {
    it('is defined', () => {
      expect(useGetVisibleChannelSegmentsByStationAndTime).toBeDefined();
    });

    it('returns a callback', () => {
      const mockAxios = jest.fn().mockImplementation(async () =>
        Promise.resolve({
          data: {
            /* empty */
          }
        })
      );
      Axios.request = mockAxios;

      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments: {
            [unfilteredSamplesUiChannelSegment.channelSegment.id.channel.name]: {
              unfiltered: [unfilteredSamplesUiChannelSegment]
            }
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useGetVisibleChannelSegmentsByStationAndTime(), {
        wrapper: Wrapper
      });
      expect(result.current).toBeDefined();
    });

    it('callback finds channel segments based on input', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const { startTime, endTime } = unfilteredSamplesUiChannelSegment.channelSegmentDescriptor;

      const mockAppState: AppState = {
        ...appState,
        app: {
          ...appState.app,
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: endTime + 1000
            }
          }
        },
        data: {
          ...appState.data,
          uiChannelSegments: {
            AAK: { [UNFILTERED]: [unfilteredSamplesUiChannelSegment] },
            BAK: {
              [UNFILTERED]: [unfilteredSamplesUiChannelSegment, unfilteredSamplesUiChannelSegment]
            }
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useGetVisibleChannelSegmentsByStationAndTime(), {
        wrapper: Wrapper
      });

      // TODO
      expect(result.current('AAK', startTime - 1)).toHaveLength(0);
      expect(result.current('AAK', endTime + 1)).toHaveLength(0);
      expect(result.current('AAK', startTime)).toHaveLength(0);
      expect(result.current('AAK', endTime)).toHaveLength(0);

      expect(result.current('BAK', startTime - 1)).toHaveLength(0);
      expect(result.current('BAK', endTime + 1)).toHaveLength(0);
      expect(result.current('BAK', startTime)).toHaveLength(0);
      expect(result.current('BAK', endTime)).toHaveLength(0);
    });
  });

  describe('Waveform selection helper functions', () => {
    const channelSegStringOne =
      'TESTONE.beam.BHZ/beam,fk,coherent/steer,az_48.526deg,slow_4.273s_per_deg/dedac34494f7146afaab822e2810498921a39fb522876ede367aa410e3c42d27.1694526241.211.1694526241.211.1694526241.211.1694526541.186';

    const channelSegDescriptorOne: ChannelSegmentTypes.ChannelSegmentDescriptor = {
      ...unfilteredSamplesUiChannelSegment.channelSegmentDescriptor,
      channel: {
        ...unfilteredSamplesUiChannelSegment.channelSegmentDescriptor.channel,
        name: channelSegStringOne
      }
    };
    const channelSegStringTwo =
      'TESTTWO.beam.BHZ/beam,fk,coherent/steer,az_20.136deg,slow_3.876s_per_deg/91d26256b9c9b440cb8b935f08786216f4de5eaec9739b73343248e541006bc0.1694526384.261.1694526384.261.1694526384.261.1694526684.236';

    const channelSegDescriptorTwo: ChannelSegmentTypes.ChannelSegmentDescriptor = {
      ...unfilteredSamplesUiChannelSegment.channelSegmentDescriptor,
      channel: {
        ...unfilteredSamplesUiChannelSegment.channelSegmentDescriptor.channel,
        name: channelSegStringTwo
      }
    };
    const arrival = findArrivalTimeFeatureMeasurementUsingSignalDetection(signalDetectionsData[0]);
    const stupidNullCheckCSD: ChannelSegmentTypes.ChannelSegmentDescriptor = {
      channel: {
        name: 'stupicNullChecks',
        effectiveAt: 0
      },
      startTime: 0,
      endTime: 0,
      creationTime: 0
    };
    const sdDataChannelSegmentDescriptor = arrival?.analysisWaveform
      ? arrival.analysisWaveform.waveform.id
      : stupidNullCheckCSD;

    test('collectWaveformsToSingleSelect', () => {
      expect(
        collectWaveformsToSingleSelect([channelSegDescriptorOne], channelSegDescriptorTwo)
      ).toEqual([channelSegDescriptorTwo]);
      expect(
        collectWaveformsToSingleSelect([channelSegDescriptorOne], channelSegDescriptorOne)
      ).toEqual([]);
    });

    test('collectWaveformsToMultiSelect', () => {
      expect(
        collectWaveformsToMultiSelect([channelSegDescriptorOne], channelSegDescriptorTwo)
      ).toEqual([channelSegDescriptorOne, channelSegDescriptorTwo]);
      expect(
        collectWaveformsToMultiSelect([channelSegDescriptorOne], channelSegDescriptorOne)
      ).toEqual([]);
    });

    test('collectSdIdsToSingleSelect', () => {
      expect(collectSdIdsToSingleSelect(channelSegDescriptorOne, signalDetectionsData, [])).toEqual(
        []
      );
      expect(
        collectSdIdsToSingleSelect(sdDataChannelSegmentDescriptor, signalDetectionsData, [
          sdDataChannelSegmentDescriptor
        ])
      ).toEqual([]);
      expect(
        collectSdIdsToSingleSelect(sdDataChannelSegmentDescriptor, signalDetectionsData, [
          channelSegDescriptorOne
        ])
      ).toEqual([signalDetectionsData[0].id]);
    });

    test('collectSdIdsToMultiSelect', () => {
      const sdIds = signalDetectionsData.flatMap(sd => sd.id);
      expect(collectSdIdsToMultiSelect(channelSegDescriptorOne, [], signalDetectionsData)).toEqual(
        []
      );
      expect(
        collectSdIdsToMultiSelect(channelSegDescriptorOne, [sdIds[0]], signalDetectionsData)
      ).toEqual([sdIds[0]]);
      expect(
        collectSdIdsToMultiSelect(
          sdDataChannelSegmentDescriptor,
          [sdIds[0]],
          [signalDetectionsData[0]]
        )
      ).toEqual([]);
      expect(
        collectSdIdsToMultiSelect(sdDataChannelSegmentDescriptor, [], [signalDetectionsData[0]])
      ).toEqual([signalDetectionsData[0].id]);
    });
  });

  describe('useSetSelectedWaveformsByChannelSegmentDescriptorIds', () => {
    it('sets the selected waveforms by their associated signal detection ids', async () => {
      const store = getStore();

      const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurementUsingSignalDetection(
        signalDetectionAsarAs01Shz
      );

      expect(!!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id).toBe(true);

      if (!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id) {
        return;
      }

      const channelSegmentDescriptor = arrivalTimeFeatureMeasurement.analysisWaveform.waveform.id;
      const matchingUiChannelSegment = cloneDeep(unfilteredClaimCheckUiChannelSegment);
      matchingUiChannelSegment.channelSegment.id = channelSegmentDescriptor;
      matchingUiChannelSegment.channelSegmentDescriptor = channelSegmentDescriptor;

      const id = ChannelSegmentTypes.Util.createChannelSegmentString(channelSegmentDescriptor);

      store.dispatch(
        addChannelSegments([
          {
            name: matchingUiChannelSegment.channelSegment.id.channel.name,
            channelSegments: [matchingUiChannelSegment]
          }
        ])
      );
      store.dispatch(addSignalDetections(Object.values(signalDetectionsRecord)));

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useSetSelectedWaveformsByChannelSegmentDescriptorIds(), {
        wrapper: Wrapper
      });

      await act(() => {
        result.current([id]);
      });

      expect(store.getState().app.analyst.selectedWaveforms).toMatchObject([
        channelSegmentDescriptor
      ]);
      expect(store.getState().app.analyst.selectedSdIds).toMatchObject([
        signalDetectionAsarAs01Shz.id
      ]);
    });

    it('does not allow duplicate selections', async () => {
      const store = getStore();

      const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurementUsingSignalDetection(
        signalDetectionAsarAs01Shz
      );

      expect(!!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id).toBe(true);

      if (!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id) {
        return;
      }

      const channelSegmentDescriptor = arrivalTimeFeatureMeasurement.analysisWaveform.waveform.id;
      const matchingUiChannelSegment = cloneDeep(unfilteredClaimCheckUiChannelSegment);
      matchingUiChannelSegment.channelSegment.id = channelSegmentDescriptor;
      matchingUiChannelSegment.channelSegmentDescriptor = channelSegmentDescriptor;

      const id = ChannelSegmentTypes.Util.createChannelSegmentString(channelSegmentDescriptor);

      store.dispatch(
        addChannelSegments([
          {
            name: matchingUiChannelSegment.channelSegment.id.channel.name,
            channelSegments: [matchingUiChannelSegment]
          }
        ])
      );
      store.dispatch(addSignalDetections(Object.values(signalDetectionsRecord)));

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useSetSelectedWaveformsByChannelSegmentDescriptorIds(), {
        wrapper: Wrapper
      });

      await act(() => {
        result.current([id, id]);
      });

      expect(store.getState().app.analyst.selectedWaveforms).toMatchObject([
        channelSegmentDescriptor
      ]);
      expect(store.getState().app.analyst.selectedSdIds).toMatchObject([
        signalDetectionAsarAs01Shz.id
      ]);
    });

    it('will not select waveforms without valid match', async () => {
      const store = getStore();

      const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurementUsingSignalDetection(
        signalDetectionAsarAs01Shz
      );

      expect(!!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id).toBe(true);

      if (!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id) {
        return;
      }

      const channelSegmentDescriptor = arrivalTimeFeatureMeasurement.analysisWaveform.waveform.id;
      const matchingUiChannelSegment = cloneDeep(unfilteredClaimCheckUiChannelSegment);
      matchingUiChannelSegment.channelSegment.id = channelSegmentDescriptor;
      matchingUiChannelSegment.channelSegmentDescriptor = channelSegmentDescriptor;

      store.dispatch(
        addChannelSegments([
          {
            name: matchingUiChannelSegment.channelSegment.id.channel.name,
            channelSegments: [matchingUiChannelSegment]
          }
        ])
      );
      store.dispatch(addSignalDetections(Object.values(signalDetectionsRecord)));

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useSetSelectedWaveformsByChannelSegmentDescriptorIds(), {
        wrapper: Wrapper
      });

      await act(() => {
        result.current(['abc']);
      });

      expect(store.getState().app.analyst.selectedWaveforms).toMatchObject([]);
      expect(store.getState().app.analyst.selectedSdIds).toMatchObject([]);
    });

    it('will reset selections to empty', async () => {
      const store = getStore();

      const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurementUsingSignalDetection(
        signalDetectionAsarAs01Shz
      );

      expect(!!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id).toBe(true);

      if (!arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id) {
        return;
      }

      const channelSegmentDescriptor = arrivalTimeFeatureMeasurement.analysisWaveform.waveform.id;
      const matchingUiChannelSegment = cloneDeep(unfilteredClaimCheckUiChannelSegment);
      matchingUiChannelSegment.channelSegment.id = channelSegmentDescriptor;
      matchingUiChannelSegment.channelSegmentDescriptor = channelSegmentDescriptor;

      store.dispatch(
        addChannelSegments([
          {
            name: matchingUiChannelSegment.channelSegment.id.channel.name,
            channelSegments: [matchingUiChannelSegment]
          }
        ])
      );
      store.dispatch(addSignalDetections(Object.values(signalDetectionsRecord)));

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useSetSelectedWaveformsByChannelSegmentDescriptorIds(), {
        wrapper: Wrapper
      });

      await act(() => {
        result.current([]);
      });

      expect(store.getState().app.analyst.selectedWaveforms).toMatchObject([]);
      expect(store.getState().app.analyst.selectedSdIds).toMatchObject([]);
    });
  });
});
