import type { AnalystWaveformTypes, AppState } from '@gms/ui-state';
import { getStore, useAppDispatch } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import { useEventRightClickHandler } from '~analyst-ui/components/map/event-right-click-handler';

import {
  useEventOnClickHandler,
  useHideShowContextMenuState,
  useIsMapSyncedToWaveformZoom,
  useMapNonPreferredEventData,
  useMapPreferredEventData,
  useSdOnClickHandler,
  useSetIsMapSyncedToWaveformZoom,
  useSignalDetectionOnRightClickHandler,
  useStationOnClickHandler,
  useStationOnRightClickHandler
} from '../../../../../src/ts/components/analyst-ui/components/map/map-hooks';
import { eventResultsWithRejected } from '../events/event-data-types';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
jest.setTimeout(60000);

jest.mock('@gms/ui-state', () => {
  const actualRedux = jest.requireActual('@gms/ui-state');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actualRedux,
    useAppDispatch: mockUseAppDispatch,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const stationsVisibility: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};
      stationsVisibility.name = {
        visibility: true,
        stationName: 'station-name',
        isStationExpanded: false
      };
      const state: AppState = appState;
      const range = { startTimeSecs: 100, endTimeSecs: 200 };
      state.app.workflow.timeRange = range;
      state.app.workflow.openIntervalName = 'AL1';
      state.app.waveform.viewableInterval = range;
      state.app.waveform.stationsVisibility = stationsVisibility;
      state.app.common.selectedStationIds = ['station-name'];
      state.app.analyst.selectedSdIds = ['sd-name'];
      return stateFunc(state);
    }),
    useGetEvents: jest.fn(() => ({
      ...eventResultsWithRejected
    })),
    useWorkflowQuery: jest.fn(() => ({
      isSuccess: true,
      data: { stages: [{ name: 'Auto Network' }, { name: 'AL1' }] }
    }))
  };
});

const store = getStore();

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

describe('map hooks', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('is defined', () => {
    expect(useHideShowContextMenuState).toBeDefined();
    expect(useStationOnClickHandler).toBeDefined();

    expect(useIsMapSyncedToWaveformZoom).toBeDefined();
    expect(useSetIsMapSyncedToWaveformZoom).toBeDefined();

    expect(useMapPreferredEventData).toBeDefined();
    expect(useMapNonPreferredEventData).toBeDefined();
    expect(useEventOnClickHandler).toBeDefined();

    expect(useEventRightClickHandler).toBeDefined();
    expect(useSignalDetectionOnRightClickHandler).toBeDefined();
    expect(useStationOnRightClickHandler).toBeDefined();
  });

  it('call useSetIsMapSyncedToWaveformZoom', () => {
    useSetIsMapSyncedToWaveformZoom(true);
    expect(useAppDispatch).toHaveBeenCalledTimes(1);
  });

  it('call useMapPreferredEventData', () => {
    const { result } = renderHook(() => useMapPreferredEventData(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result.current).toMatchSnapshot();
  });

  it('call useMapNonPreferredEventData', () => {
    const { result } = renderHook(() => useMapNonPreferredEventData(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result.current).toMatchSnapshot();
  });

  it('call useStationOnClickHandler', () => {
    const mockDispatch = useAppDispatch();
    const { result } = renderHook(() => useStationOnClickHandler());
    act(() => {
      const entity: any = {
        id: 'station-name',
        properties: {
          type: {
            getValue: jest.fn(() => 'Station')
          }
        }
      };
      const onClick = result.current(entity);
      onClick();
    });
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
    act(() => {
      const entity: any = {
        id: 'station-wrong-name',
        properties: {
          type: {
            getValue: jest.fn(() => 'Station')
          }
        }
      };
      const onClick = result.current(entity);
      onClick();
    });
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it('call useEventOnClickHandler', () => {
    const mockDispatch = useAppDispatch();
    const { result } = renderHook(() => useEventOnClickHandler());
    act(() => {
      const entity: any = {
        id: 'event-name',
        properties: {
          type: {
            getValue: jest.fn(() => 'Event location')
          }
        }
      };
      const onClick = result.current(entity);
      onClick();
    });
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    act(() => {
      const entity: any = {
        id: 'event-wrong-name',
        properties: {
          type: {
            getValue: jest.fn(() => 'Event location')
          }
        }
      };
      const onClick = result.current(entity);
      onClick();
    });
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    act(() => {
      const entity: any = {
        id: 'station',
        properties: {
          type: {
            getValue: jest.fn(() => 'Station')
          }
        }
      };
      const onClick = result.current(entity);
      onClick();
    });
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('call useSdOnClickHandler', () => {
    const mockDispatch = useAppDispatch();
    const { result } = renderHook(() => useSdOnClickHandler());
    act(() => {
      const entity: any = {
        id: 'sd-name',
        properties: {
          type: {
            getValue: jest.fn(() => 'Signal detection')
          }
        }
      };
      const onClick = result.current(entity);
      onClick();
    });
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    act(() => {
      const entity: any = {
        id: 'sd-wrong-name',
        properties: {
          type: {
            getValue: jest.fn(() => 'Signal detection')
          }
        }
      };
      const onClick = result.current(entity);
      onClick();
    });
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  describe('Map right-click handler hooks', () => {
    beforeEach(() => jest.clearAllMocks());

    function TestReduxWrapper({ children }: { children: React.ReactNode }) {
      return <Provider store={store}>{children}</Provider>;
    }

    const movementEvent: any = {
      position: {
        x: 3,
        y: 8
      }
    };

    const selectedEntityEvent: any = {
      properties: {
        id: {
          getValue: jest.fn(() => 'mockEventId')
        },
        event: {
          getValue: jest.fn(() => {
            return {
              event: {
                id: 'mockEventId',
                time: 0,
                latitudeDegrees: 45,
                longitudeDegrees: 45,
                depthKm: 10,
                status: 'Not Started'
              }
            };
          })
        },
        getValue: jest.fn(() => {
          return {
            event: {
              id: 'mockEventId',
              time: 0,
              latitudeDegrees: 45,
              longitudeDegrees: 45,
              depthKm: 10,
              status: 'Not Started'
            }
          };
        })
      }
    };

    const latitude = 25;
    const longitude = -71;

    it('useRightClickHandler opens the event context menu', () => {
      const mockSetEventId = jest.fn();

      // Get right-click handler function from hook
      const { result } = renderHook(() => useEventRightClickHandler(mockSetEventId, jest.fn), {
        wrapper: TestReduxWrapper
      });

      result.current(movementEvent, selectedEntityEvent, latitude, longitude);
    });

    it('useStationOnRightClickHandler opens the station context menu', () => {
      // Get right-click handler function from hook
      const { result } = renderHook(() => useStationOnRightClickHandler(jest.fn), {
        wrapper: TestReduxWrapper
      });

      result.current(movementEvent, selectedEntityEvent, latitude, longitude);
    });

    it('useSdOnRightClickHandler opens the signal detection context menu', () => {
      // Get right-click handler function from hook
      const { result } = renderHook(
        () => useSignalDetectionOnRightClickHandler(jest.fn(), jest.fn),
        {
          wrapper: TestReduxWrapper
        }
      );

      result.current(movementEvent, selectedEntityEvent, latitude, longitude);
    });
  });
});
