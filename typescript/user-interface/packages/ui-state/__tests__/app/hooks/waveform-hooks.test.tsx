/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable jest/expect-expect */
import type { ChannelTypes, StationTypes } from '@gms/common-model';
import { WaveformTypes } from '@gms/common-model';
import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import type { WeavessTypes } from '@gms/weavess-core';
import { act, renderHook } from '@testing-library/react-hooks';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';
import type Redux from 'redux';

import { useGetChannelSegments } from '../../../src/ts/app/hooks/channel-segment-hooks';
import type { LoadDataOptions } from '../../../src/ts/app/hooks/waveform-hooks';
import {
  useBaseStationTime,
  useLoadData,
  useMaximumOffset,
  useMinimumOffset,
  useShouldShowPredictedPhases,
  useShouldShowTimeUncertainty,
  useStationsVisibility,
  useViewableInterval,
  useViewportVisibleStations,
  useZoomInterval
} from '../../../src/ts/app/hooks/waveform-hooks';
import { isChannelVisible } from '../../../src/ts/app/state/waveform/util';
import {
  waveformInitialState,
  waveformSlice
} from '../../../src/ts/app/state/waveform/waveform-slice';
import type { AppState } from '../../../src/ts/app/store';
import { configureNewStore, HookChecker } from '../../test-util';

axios.request = jest.fn().mockImplementation();

jest.mock(
  '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );

    return {
      ...actual,
      processingConfigurationApiSlice: {
        middleware: actual.processingConfigurationApiSlice.middleware,
        endpoints: {
          getProcessingAnalystConfiguration: {
            select: jest.fn(() =>
              jest.fn(() => ({
                data: processingAnalystConfigurationData
              }))
            )
          }
        }
      }
    };
  }
);

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    request: jest.fn().mockReturnValue(Promise.resolve({}))
  };
});

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    startTransition: jest.fn((fn: () => void) => fn())
  };
});

function checkHookReturnValue<HookReturnType = unknown>(
  storeToUse: Redux.Store<AppState>,
  useHookToTest: () => HookReturnType,
  assertion: (result: HookReturnType) => void
): void {
  create(
    <Provider store={storeToUse}>
      <HookChecker<ReturnType<typeof useHookToTest>> useHook={useHookToTest}>
        {assertion}
      </HookChecker>
    </Provider>
  ).toJSON();
}

async function expectThatAsyncHookUpdates<HookReturnType = unknown>(
  storeToUse: Redux.Store<AppState>,
  useHookToTest: () => [HookReturnType, (result: HookReturnType) => void],
  assertion: (result: ReturnType<typeof useHookToTest>) => Promise<void>
) {
  return new Promise<void>(done => {
    create(
      <Provider store={storeToUse}>
        <HookChecker<ReturnType<typeof useHookToTest>> useHook={useHookToTest}>
          {async (result: ReturnType<typeof useHookToTest>) => {
            await assertion(result);
            done(); // resolve the promise
          }}
        </HookChecker>
      </Provider>
    ).toJSON();
  });
}

const toyInterval = {
  startTimeSecs: 123,
  endTimeSecs: 456
};

function assertReturnsInitialStateAndSetter<HookReturnType>(expectedValue: HookReturnType) {
  return ([value, setValue]) => {
    expect(value).toEqual(expectedValue);
    expect(typeof setValue).toEqual('function');
  };
}

function assertSetterWorks(valueToSet) {
  return async ([value, setValue]: [typeof valueToSet, any]) => {
    if (value !== valueToSet) {
      await act(() => {
        setValue(valueToSet);
      });
    } else {
      // we use a conditional expect here because it must be hit to consider this a success.
      // if the expect is not hit, the `done` function call on the next line will not be either,
      // ensuring that the test will fail (promise won't resolve and it will time out).
      // throw new Error(JSON.stringify({ value, valueToSet }));
      expect(value).toEqual(valueToSet);
    }
  };
}

describe('UI State Waveform Hooks', () => {
  let store: Redux.Store<AppState>;
  beforeEach(() => {
    store = configureNewStore();
  });

  describe('useViewableInterval', () => {
    it('returns the initial state and a setter', () => {
      checkHookReturnValue(
        store,
        useViewableInterval,
        assertReturnsInitialStateAndSetter(waveformInitialState.viewableInterval)
      );
    });

    it('sets a value using the setter', async () => {
      await expectThatAsyncHookUpdates(store, useViewableInterval, assertSetterWorks(toyInterval));
    });
  });

  describe('useMinimumOffset', () => {
    it('returns the initial state and a setter', () => {
      const { result } = renderHook(() => useMinimumOffset(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.minimumOffset);
    });

    it('sets a value using the setter', () => {
      const { result } = renderHook(() => useMinimumOffset(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.minimumOffset);
      act(() => {
        result.current[1](100);
      });
      expect(result.current[0]).toBe(100);
    });
  });

  describe('useMaximumOffset', () => {
    it('returns the initial state and a setter', () => {
      const { result } = renderHook(() => useMaximumOffset(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.maximumOffset);
    });

    it('sets a value using the setter', () => {
      const { result } = renderHook(() => useMaximumOffset(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.maximumOffset);
      act(() => {
        result.current[1](100);
      });
      expect(result.current[0]).toBe(100);
    });
  });

  describe('useZoomInterval', () => {
    it('returns the initial state and a setter', () => {
      checkHookReturnValue(
        store,
        useZoomInterval,
        assertReturnsInitialStateAndSetter(waveformInitialState.zoomInterval)
      );
    });

    it('sets a value using the setter', async () => {
      await expectThatAsyncHookUpdates(store, useViewableInterval, assertSetterWorks(toyInterval));
      await expectThatAsyncHookUpdates(store, useZoomInterval, assertSetterWorks(toyInterval));
    });
  });

  describe('useLoadData', () => {
    function assertItLoadData(
      str: Redux.Store<AppState>,
      loadDirection: WaveformTypes.LoadType,
      loadDataOptions: LoadDataOptions
    ) {
      return async (
        loadData: (loadDirection: WaveformTypes.LoadType, loadingOptions: LoadDataOptions) => void
      ) => {
        expect(typeof loadData).toBe('function');
        // eslint-disable-next-line no-useless-catch
        try {
          await act(() => {
            loadData(loadDirection, loadDataOptions);
          });
        } catch (err) {
          throw err;
        }
        const { zoomInterval } = store.getState().app.waveform;
        expect(zoomInterval).toMatchSnapshot();
      };
    }

    it('sets the zoom interval', () => {
      const onLoadingLimitReached = jest.fn();
      checkHookReturnValue(
        store,
        useLoadData,
        assertItLoadData(store, WaveformTypes.LoadType.Later, {
          onLoadingLimitReached
        })
      );
    });
  });

  describe('useBaseStationTime', () => {
    it('returns the initial state and a setter', () => {
      const { result } = renderHook(() => useBaseStationTime(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.baseStationTime);
    });

    it('sets a value using the setter', () => {
      const { result } = renderHook(() => useBaseStationTime(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.baseStationTime);
      act(() => {
        result.current[1](100);
      });
      expect(result.current[0]).toBe(100);
    });
  });

  describe('Time Uncertainty', () => {
    it('returns the time uncertainty value and a setter', () => {
      const { result } = renderHook(() => useShouldShowTimeUncertainty(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.shouldShowTimeUncertainty);
      const newValue = !waveformInitialState.shouldShowTimeUncertainty;
      act(() => {
        result.current[1](newValue);
      });
      expect(result.current[0]).toBe(newValue);
    });
  });

  describe('Predicted Phases', () => {
    it('returns the predicted phases value and a setter', () => {
      const { result } = renderHook(() => useShouldShowPredictedPhases(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current[0]).toBe(waveformInitialState.shouldShowPredictedPhases);
      const newValue = !waveformInitialState.shouldShowPredictedPhases;
      act(() => {
        result.current[1](newValue);
      });
      expect(result.current[0]).toBe(newValue);
    });
  });

  describe('Use Hook for Waveform Query', () => {
    it('returns the use waveform query for current channels value and a setter', () => {
      store.dispatch(waveformSlice.actions.setViewableInterval(toyInterval));
      const { result } = renderHook(() => useGetChannelSegments(toyInterval), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result).toMatchSnapshot();
    });
  });

  describe('Stations Visibility Hooks', () => {
    const mockChannel = { name: 'chan1' } as ChannelTypes.Channel;
    const mockStation = {
      name: 'station1',
      allRawChannels: [mockChannel]
    } as StationTypes.Station;

    it('returns the default station visibility', () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current.stationsVisibility).toBe(waveformInitialState.stationsVisibility);
    });

    it("can set a station's visibility to true and false", () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current.stationsVisibility).toBe(waveformInitialState.stationsVisibility);
      act(() => {
        result.current.setStationVisibility(mockStation, true);
      });
      expect(result.current.stationsVisibility[mockStation.name].visibility).toBe(true);
      act(() => {
        // use string for better branch testing
        result.current.setStationVisibility(mockStation.name, false);
      });
      expect(result.current.stationsVisibility[mockStation.name].visibility).toBe(false);
    });

    it('can tell if a station is visible or not', () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      act(() => {
        result.current.setStationVisibility(mockStation, true);
      });
      expect(result.current.isStationVisible(mockStation)).toBe(true);
      act(() => {
        result.current.setStationVisibility(mockStation, false);
      });
      expect(result.current.isStationVisible(mockStation)).toBe(false);
    });

    it('can set if a station is expanded or not', () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current.stationsVisibility).toBe(waveformInitialState.stationsVisibility);
      act(() => {
        result.current.setStationExpanded(mockStation, true);
      });
      expect(result.current.stationsVisibility[mockStation.name].isStationExpanded).toBe(true);
      act(() => {
        // use string for better branch testing
        result.current.setStationExpanded(mockStation.name, false);
      });
      expect(result.current.stationsVisibility[mockStation.name].isStationExpanded).toBe(false);
    });

    it('can tell if a station is expanded or not', () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      act(() => {
        result.current.setStationExpanded(mockStation, true);
      });
      expect(result.current.isStationExpanded(mockStation)).toBe(true);
      act(() => {
        result.current.setStationExpanded(mockStation, false);
      });
      expect(result.current.isStationExpanded(mockStation)).toBe(false);
    });

    it('can determine which stations are visible in a station list', () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current.stationsVisibility).toBe(waveformInitialState.stationsVisibility);
      act(() => {
        // set up some stations as visible and some that aren't
        result.current.setStationVisibility('a', true);
        result.current.setStationVisibility('b', true);
        result.current.setStationVisibility('c', false);
        result.current.setStationVisibility('d', true);
      });
      let visibleStations;
      act(() => {
        // use string for better branch testing
        visibleStations = result.current.getVisibleStationsFromStationList([
          { name: 'a' } as StationTypes.Station,
          { name: 'c' } as StationTypes.Station,
          { name: 'd' } as StationTypes.Station
        ]);
      });
      expect(JSON.stringify(visibleStations)).toEqual(
        JSON.stringify([
          { name: 'a' } as StationTypes.Station,
          { name: 'd' } as StationTypes.Station
        ])
      );
    });

    it('can set if a channel is visible or not', () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current.stationsVisibility).toBe(waveformInitialState.stationsVisibility);
      act(() => {
        result.current.setChannelVisibility(mockStation, mockChannel, false);
      });
      expect(
        result.current.stationsVisibility[mockStation.name].hiddenChannels?.includes(
          mockChannel.name
        )
      ).toBe(true);
      act(() => {
        // use string for better branch testing
        result.current.setChannelVisibility(mockStation.name, mockChannel.name, true);
      });
      expect(
        isChannelVisible(mockChannel.name, result.current.stationsVisibility[mockStation.name])
      ).toBe(true);
    });

    it('can show all channels', () => {
      const { result } = renderHook(() => useStationsVisibility(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      const channelList = [
        { name: 'a' } as ChannelTypes.Channel,
        { name: 'c' } as ChannelTypes.Channel,
        { name: 'd' } as ChannelTypes.Channel
      ];
      const mockStation2: StationTypes.Station = {
        name: 'mockStation2',
        allRawChannels: channelList
      } as any;
      expect(result.current.stationsVisibility).toBe(waveformInitialState.stationsVisibility);
      act(() => {
        channelList.forEach(chan => {
          result.current.setChannelVisibility(mockStation2, chan, false);
        });
      });
      channelList.forEach(chan => {
        expect(
          result.current.stationsVisibility[mockStation2.name].hiddenChannels?.includes(chan.name)
        ).toBe(true);
      });
      act(() => {
        // use string for better branch testing
        result.current.showAllChannels(mockStation2.name);
      });
      channelList.forEach(chan => {
        expect(
          isChannelVisible(chan.name, result.current.stationsVisibility[mockStation2.name])
        ).toBe(true);
      });
    });
  });

  describe('useViewportVisibleStations', () => {
    it('is defined', () => {
      expect(useViewportVisibleStations).toBeDefined();
    });

    it('provides a tuple with the current value and setter', () => {
      const { result } = renderHook(() => useViewportVisibleStations(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      const [value, setter] = result.current;
      expect(value).toMatchObject([]);
      expect(setter).toBeDefined();
    });

    it('spiral sorts the incoming channel ids based on the indexStart and indexEnd', () => {
      const channels: WeavessTypes.Channel[] = 'abcdefghijklmnopqrstuvwxyz'.split('').map(id => ({
        id,
        name: 'test',
        isSelected: false,
        height: 50,
        timeOffsetSeconds: 0,
        waveform: {
          channelSegmentId: 'unfiltered',
          channelSegmentsRecord: {},
          predictedPhases: [],
          signalDetections: [],
          markers: {
            verticalMarkers: [],
            selectionWindows: []
          }
        }
      }));
      const { result } = renderHook(() => useViewportVisibleStations(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        result.current[1](channels, 0, 9);
      });
      // Result should be spiral sort away from the 5th element (index 4)
      expect(result.current[0]).toMatchObject([
        'e',
        'f',
        'd',
        'g',
        'c',
        'h',
        'b',
        'i',
        'a',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z'
      ]);

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        result.current[1](channels, channels.length - 10, channels.length);
      });

      // Result should be spiral sort away from the 22nd element (index 21)
      expect(result.current[0]).toMatchObject([
        'v',
        'w',
        'u',
        'x',
        't',
        'y',
        's',
        'z',
        'r',
        'q',
        'p',
        'o',
        'n',
        'm',
        'l',
        'k',
        'j',
        'i',
        'h',
        'g',
        'f',
        'e',
        'd',
        'c',
        'b',
        'a'
      ]);
    });
  });
});
