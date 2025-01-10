import type { ConfigurationTypes } from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes, StationTypes, WaveformTypes } from '@gms/common-model';
import {
  asarAS01Channel,
  asarAS02Channel,
  asarAS03Channel,
  defaultStations
} from '@gms/common-model/__tests__/__data__';
import { UNFILTERED } from '@gms/weavess-core/lib/types';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  useAllChannelsRecord,
  useBeamedChannels,
  useChannels,
  useGetChannelsQuery,
  useRawChannels,
  useUnfilteredChannelsRecord
} from '../../../src/ts/app/hooks/channel-hooks';
import { useAllStations } from '../../../src/ts/app/hooks/station-definition-hooks';
import { AsyncActionStatus } from '../../../src/ts/app/query/types';
import type { AppState } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';
import type { UiChannelSegment } from '../../../src/ts/types';
import { fetchChannelsByNamesTimeRange } from '../../../src/ts/workers/api/fetch-channels-by-names-timerange';
import { testChannel } from '../../__data__/channel-data';
import { appState } from '../../test-util';

const defaultMockStation: StationTypes.Station[] = [
  {
    name: 'station name',
    description: 'station description',
    type: StationTypes.StationType.HYDROACOUSTIC,
    effectiveAt: 123,
    effectiveUntil: 456,
    relativePositionsByChannel: {},
    location: { depthKm: 3, elevationKm: 3, latitudeDegrees: 3, longitudeDegrees: 3 },
    allRawChannels: [testChannel],
    channelGroups: []
  }
];

const defaultMockStationGroup: StationTypes.StationGroup[] = [
  {
    description: 'test group',
    effectiveAt: 123,
    effectiveUntil: 456,
    name: 'test group name',
    stations: defaultMockStation
  }
];

const defaultMockAnalystConfiguration: Partial<ConfigurationTypes.ProcessingAnalystConfiguration> =
  {
    defaultInteractiveAnalysisStationGroup: 'test'
  };

const defaultMockStationGroupNamesConfiguration: Partial<ConfigurationTypes.StationGroupNamesConfiguration> =
  {
    stationGroupNames: ['test']
  };

jest.mock(
  '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: defaultMockAnalystConfiguration
      })),
      useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
        data: defaultMockStationGroupNamesConfiguration
      }))
    };
  }
);

jest.mock('../../../src/ts/app/api/station-definition/station-definition-api-slice', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/station-definition/station-definition-api-slice'
  );
  return {
    ...actual,
    useGetStationGroupsByNamesQuery: jest.fn(() => ({
      data: defaultMockStationGroup
    })),
    useGetStationsQuery: jest.fn(() => ({
      data: defaultMockStation
    })),
    useGetStationsWithChannelsQuery: jest.fn(() => ({
      data: defaultMockStation
    }))
  };
});

jest.mock('../../../src/ts/app/hooks/operational-time-period-configuration-hooks', () => {
  return {
    useEffectiveTime: jest.fn(() => 0)
  };
});

jest.mock('../../../src/ts/app/hooks/signal-detection-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/signal-detection-hooks');
  return {
    ...actual,
    useGetSignalDetections: jest.fn()
  };
});

jest.mock('../../../src/ts/workers/api/fetch-channels-by-names-timerange', () => {
  return {
    fetchChannelsByNamesTimeRange: jest.fn()
  };
});

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  return {
    useAllStations: jest.fn(() => defaultStations)
  };
});

const uiChannelSegmentRecord: Record<
  string,
  Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>
> = {
  ASAR: {
    Unfiltered: [
      {
        channelSegment: {
          id: {
            channel: {
              effectiveAt: 1546711550,
              name: 'ASAR.beam.SHZ/beam,fk,coherent/steer,az_190.437deg,slow_24.168s_per_deg/1cf9fb9e-69d7-32c5-af81-22f550cdcbcd'
            },
            startTime: 1546711550.65,
            endTime: 1546711850.6,
            creationTime: 1546711550.65
          },
          units: CommonTypes.Units.NANOMETERS,
          timeseriesType: ChannelSegmentTypes.TimeseriesType.WAVEFORM,
          timeseries: [
            {
              endTime: 1546711850.6,
              type: ChannelSegmentTypes.TimeseriesType.WAVEFORM,
              startTime: 1546711550.65,
              sampleRateHz: 40.0,
              sampleCount: 12000,
              samples: new Float64Array()
            }
          ],
          _uiFilterId: WaveformTypes.UNFILTERED,
          missingInputChannels: [],
          maskedBy: []
        },
        channelSegmentDescriptor: {
          channel: {
            effectiveAt: 1546711550.65,
            name: 'ASAR.beam.SHZ/beam,fk,coherent/steer,az_190.437deg,slow_24.168s_per_deg/1cf9fb9e-69d7-32c5-af81-22f550cdcbcd'
          },
          startTime: 1546711550.65,
          endTime: 1546711850.6,
          creationTime: 1546711550.65
        },
        domainTimeRange: {
          startTimeSecs: 1546711550.65,
          endTimeSecs: 1546711850.6
        }
      }
    ]
  }
};

describe('channel hooks', () => {
  it('exists', () => {
    expect(useChannels).toBeDefined();
    expect(useGetChannelsQuery).toBeDefined();
    expect(useGetChannelsQuery).toBeDefined();
  });

  describe('useGetChannelsQuery', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('useGetChannelsQuery wont fetch without uiChannelSegments or visible stations', () => {
      (useAllStations as jest.Mock).mockReturnValueOnce([]);
      const store = getStore();

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      renderHook(() => useGetChannelsQuery(), {
        wrapper: Wrapper
      });
      expect(fetchChannelsByNamesTimeRange).not.toHaveBeenCalled();
    });

    it('useGetChannelsQuery requests derived channels from uiChannelSegments', () => {
      (useAllStations as jest.Mock).mockReturnValueOnce([]);
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        app: {
          ...appState.app,
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: 1
            }
          }
        },
        data: {
          ...appState.data,
          uiChannelSegments: uiChannelSegmentRecord
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      renderHook(() => useGetChannelsQuery(), {
        wrapper: Wrapper
      });

      const channelNames = Object.values(uiChannelSegmentRecord).flatMap(filter =>
        Object.values(filter).flatMap(channelSegments =>
          channelSegments.map(cs => cs.channelSegment.id.channel.name)
        )
      );

      expect(fetchChannelsByNamesTimeRange).toHaveBeenCalled();
      expect(fetchChannelsByNamesTimeRange).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            channelNames,
            startTime: 0,
            endTime: 1
          }
        })
      );
    });

    it('useGetChannelsQuery requests raw channels from visible stations', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        app: {
          ...appState.app,
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: 1
            }
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      renderHook(() => useGetChannelsQuery(), {
        wrapper: Wrapper
      });

      const channelNames = defaultStations.flatMap(station =>
        station.allRawChannels.map(channel => channel.name)
      );

      expect(fetchChannelsByNamesTimeRange).toHaveBeenCalled();
      expect(fetchChannelsByNamesTimeRange).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            channelNames,
            startTime: 0,
            endTime: 1
          }
        })
      );
    });

    it('useGetChannelsQuery wont duplicate calls for cached channels', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const channelNames = defaultStations.flatMap(station =>
        station.allRawChannels.map(channel => channel.name)
      );

      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          queries: {
            ...appState.data.queries,
            getChannelsByNamesTimeRange: {
              0: {
                '0a': {
                  arg: {
                    channelNames,
                    startTime: 0,
                    endTime: 1
                  },
                  status: AsyncActionStatus.fulfilled,
                  error: undefined,
                  time: 0,
                  attempts: 1
                }
              }
            }
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      renderHook(() => useGetChannelsQuery(), {
        wrapper: Wrapper
      });
      expect(fetchChannelsByNamesTimeRange).not.toHaveBeenCalled();
    });

    it('useGetChannelsQuery will expand the visible time range to include channels currently out of bounds', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

      const expectedTimes = {
        startTime: uiChannelSegmentRecord.ASAR[UNFILTERED][0].channelSegmentDescriptor.startTime,
        endTime: uiChannelSegmentRecord.ASAR[UNFILTERED][0].channelSegmentDescriptor.endTime
      };

      const mockAppState: AppState = {
        ...appState,
        app: {
          ...appState.app,
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: expectedTimes.startTime + 100,
              endTimeSecs: expectedTimes.endTime - 100
            }
          }
        },
        data: {
          ...appState.data,
          uiChannelSegments: uiChannelSegmentRecord
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      renderHook(() => useGetChannelsQuery(), {
        wrapper: Wrapper
      });
      expect(fetchChannelsByNamesTimeRange).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining(expectedTimes) })
      );
    });
  });

  describe('useChannels', () => {
    it('useChannels returns an array of raw and derived channels', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          channels: {
            raw: {
              [asarAS01Channel.name]: asarAS01Channel
            },
            beamed: {
              [asarAS02Channel.name]: asarAS02Channel
            },
            filtered: {}
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useChannels(), {
        wrapper: Wrapper
      });

      expect(result.current).toMatchObject([asarAS01Channel, asarAS02Channel]);
      expect(result.current).toHaveLength(2);
    });
  });

  describe('useRawChannels', () => {
    it('useRawChannels returns an array of only raw channels', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          channels: {
            raw: {
              [asarAS01Channel.name]: asarAS01Channel
            },
            beamed: {
              [asarAS02Channel.name]: asarAS02Channel
            },
            filtered: {}
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useRawChannels(), {
        wrapper: Wrapper
      });

      expect(result.current).toMatchObject([asarAS01Channel]);
      expect(result.current).toHaveLength(1);
    });
  });

  describe('useBeamedChannels', () => {
    it('useBeamedChannels returns an array of only derived channels', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          channels: {
            raw: {
              [asarAS01Channel.name]: asarAS01Channel
            },
            beamed: {
              [asarAS02Channel.name]: asarAS02Channel
            },
            filtered: {}
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useBeamedChannels(), {
        wrapper: Wrapper
      });

      expect(result.current).toMatchObject([asarAS02Channel]);
      expect(result.current).toHaveLength(1);
    });
  });

  describe('useAllChannelsRecord', () => {
    it('useAllChannelsRecord returns a record of channels by name', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          channels: {
            raw: {
              [testChannel.name]: testChannel
            },
            beamed: {},
            filtered: {}
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useAllChannelsRecord(), {
        wrapper: Wrapper
      });

      expect(result.current).toMatchObject({
        [testChannel.name]: testChannel
      });
    });
  });

  describe('useUnfilteredChannelsRecord', () => {
    it('useUnfilteredChannelsRecord returns a record of only unfiltered channels by name', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          channels: {
            raw: {
              [asarAS01Channel.name]: asarAS01Channel
            },
            beamed: {
              [asarAS02Channel.name]: asarAS02Channel
            },
            filtered: {
              [asarAS03Channel.name]: asarAS03Channel
            }
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useUnfilteredChannelsRecord(), {
        wrapper: Wrapper
      });

      expect(result.current).toMatchObject({
        [asarAS01Channel.name]: asarAS01Channel,
        [asarAS02Channel.name]: asarAS02Channel
      });
    });
  });
});
