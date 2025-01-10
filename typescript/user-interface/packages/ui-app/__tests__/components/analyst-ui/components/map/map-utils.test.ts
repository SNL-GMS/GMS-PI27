/* eslint-disable @typescript-eslint/no-magic-numbers */

import {
  eventData,
  eventStatusInfoInProgress,
  openIntervalName
} from '@gms/common-model/__tests__/__data__';
import type { AnalystWaveformTypes, AppState, EventStatus } from '@gms/ui-state';
import { GLDisplayState } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import type * as Cesium from 'cesium';

import * as MapUtils from '../../../../../src/ts/components/analyst-ui/components/map/map-utils';
import {
  ASAR_NO_CHANNEL_GROUPS,
  ChannelGroupsDupes,
  ChannelGroupSingle,
  ChannelGroupsNoDupes
} from '../../../../__data__/geojson-data';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const mockDispatch = () => jest.fn();
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
      data: {
        leadBufferDuration: 900,
        lagBufferDuration: 900
      }
    })),
    useEventsWithSegmentsAndSignalDetectionsByTimeQuery: jest.fn(() => ({
      data: undefined
    })),
    useWorkflowQuery: jest.fn(() => ({
      isSuccess: true,
      data: { stages: [{ name: 'Auto Network' }, { name: 'AL1' }] }
    })),
    useUpdateEventStatusMutation: jest.fn(() => [jest.fn()]),
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
      return stateFunc(state);
    }),
    useGetEvents: jest.fn().mockReturnValue({
      data: [{ id: 'testID' }]
    })
  };
});

const mockShowContextMenu = jest.fn();
const mockHideContextMenu = jest.fn();

jest.mock('@blueprintjs/core', () => {
  const actual = jest.requireActual('@blueprintjs/core');
  return {
    ...actual,
    showContextMenu: () => {
      mockShowContextMenu();
    },
    hideContextMenu: () => {
      mockHideContextMenu();
    }
  };
});

// Mock console.warn so they are not getting out put to the test log
// several tests are unhappy path tests and will console warn
console.warn = jest.fn();

describe('Ian map utils', () => {
  test('are defined', () => {
    expect(MapUtils.getObjectFromPoint).toBeDefined();
    expect(MapUtils.selectEntitiesInBox).toBeDefined();
    expect(MapUtils.buildMapEventSource).toBeDefined();
    expect(MapUtils.sdOnMouseEnterHandler).toBeDefined();
    expect(MapUtils.sdOnMouseLeaveHandler).toBeDefined();
  });

  test('getObjectFromPoint should match snapshot', () => {
    const pickedFeature = { id: 'myId' };
    const viewer = {
      scene: {
        pick: jest.fn(() => pickedFeature),
        requestRender: jest.fn()
      }
    };
    const endPosition = { x: 10, y: 10 };
    const pickedFeatureId = MapUtils.getObjectFromPoint(viewer as any, endPosition as any);
    expect(pickedFeatureId).toEqual(pickedFeature.id);
  });

  test('getObjectFromPoint should return undefined if there is no feature defined', () => {
    const viewer = {
      scene: {
        pick: jest.fn(() => undefined),
        requestRender: jest.fn()
      }
    };
    const endPosition = {};
    const pickedFeatureId = MapUtils.getObjectFromPoint(viewer as any, endPosition as any);
    expect(pickedFeatureId).toBeUndefined();
  });

  test('isSiteOrStation returns true for sites and stations', () => {
    expect(MapUtils.isSiteOrStation('ChannelGroup')).toBe(true);
    expect(MapUtils.isSiteOrStation('Station')).toBe(true);
  });

  test('isSiteOrStation returns false for non sites or stations', () => {
    expect(MapUtils.isSiteOrStation('aoeu')).toBe(false);
    expect(MapUtils.isSiteOrStation('')).toBe(false);
    expect(MapUtils.isSiteOrStation(undefined)).toBe(false);
    expect(MapUtils.isSiteOrStation(null)).toBe(false);
  });

  test('getStationLocation returns Location from station', () => {
    const result = MapUtils.getStationLocation('ASAR', [ASAR_NO_CHANNEL_GROUPS as any]);
    expect(result).toBeDefined();
    expect(result.latitudeDegrees).toEqual(71.6341);
    expect(result.longitudeDegrees).toEqual(128.8667);
    expect(result.depthKm).toEqual(0);
    expect(result.elevationKm).toEqual(0.04);
  });

  test('getStationLocation returns undefined if station is not found', () => {
    const result = MapUtils.getStationLocation('ASAaoeuR', [ASAR_NO_CHANNEL_GROUPS as any]);
    expect(result).not.toBeDefined();
  });

  describe('mapIanEntitiesToEntityComponent', () => {
    const mockEntity: Partial<Cesium.Entity> = {};
    const mockLeftClick = jest.fn();
    const mockDoubleClick = jest.fn();
    const mockOnMount = jest.fn();
    const mockRightClick = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('uses a right click handler', () => {
      const rightClickEntities: JSX.Element[] = MapUtils.mapIanEntitiesToEntityComponent(
        [mockEntity as any],
        null,
        mockRightClick
      );

      expect(rightClickEntities[0].props.onRightClick).toBeDefined();
      expect(rightClickEntities[0].props.onDoubleClick).toBeUndefined();
      expect(rightClickEntities[0].props.onMount).toBeUndefined();

      rightClickEntities[0].props.onRightClick();

      expect(mockRightClick).toHaveBeenCalled();
      expect(mockLeftClick).toHaveBeenCalledTimes(0);
      expect(mockDoubleClick).toHaveBeenCalledTimes(0);
      expect(mockOnMount).toHaveBeenCalledTimes(0);
    });

    it('uses a double click handler', () => {
      const doubleClickEntities: JSX.Element[] = MapUtils.mapIanEntitiesToEntityComponent(
        [mockEntity as any],
        null,
        null,
        mockDoubleClick
      );

      expect(doubleClickEntities[0].props.onDoubleClick).toBeDefined();
      expect(doubleClickEntities[0].props.onRightClick).toBeUndefined();
      expect(doubleClickEntities[0].props.onMount).toBeUndefined();

      doubleClickEntities[0].props.onDoubleClick();

      expect(mockDoubleClick).toHaveBeenCalled();
      expect(mockRightClick).toHaveBeenCalledTimes(0);
      expect(mockLeftClick).toHaveBeenCalledTimes(0);
      expect(mockOnMount).toHaveBeenCalledTimes(0);
    });

    it('uses a on mount function', () => {
      const mountEntities: JSX.Element[] = MapUtils.mapIanEntitiesToEntityComponent(
        [mockEntity as any],
        null,
        null,
        null,
        null,
        null,
        mockOnMount
      );

      expect(mountEntities[0].props.onMount).toBeDefined();
      expect(mountEntities[0].props.onRightClick).toBeUndefined();
      expect(mountEntities[0].props.onDoubleClick).toBeUndefined();
      expect(mountEntities[0].props.onDoubleClick).toBeUndefined();

      mountEntities[0].props.onMount();

      expect(mockOnMount).toHaveBeenCalled();
      expect(mockRightClick).toHaveBeenCalledTimes(0);
      expect(mockLeftClick).toHaveBeenCalledTimes(0);
      expect(mockDoubleClick).toHaveBeenCalledTimes(0);
    });
  });

  describe('selectEntitiesInBox', () => {
    const stationProperties = {
      coordinates: {
        _value: {
          latitude: 100,
          longitude: 100,
          elevation: 100
        }
      },
      statype: {
        _value: 'SEISMIC_3_COMPONENT'
      },
      type: 'Station'
    };

    const selectedEntityStation = {
      name: 'AAK',
      properties: { getValue: jest.fn(() => stationProperties) },
      position: {
        getValue: jest.fn(() => {
          return { x: 1, y: 2, z: 3 };
        })
      }
    };

    const stationsDataSource = {
      name: 'Stations',
      entities: {
        values: [selectedEntityStation]
      }
    };

    const rectangle = {
      north: 2,
      south: 3,
      west: 1,
      east: 2
    };

    const viewer = {
      dataSources: {
        getByName: jest.fn(() => {
          return [stationsDataSource];
        })
      },
      scene: {
        pickPosition: jest.fn(() => {
          return 'myPosition';
        }),
        requestRender: jest.fn()
      }
    };

    test('is defined', () => {
      expect(MapUtils.selectEntitiesInBox(rectangle as any, viewer as any)).toBeDefined();
    });

    test('match snapshot', () => {
      expect(MapUtils.selectEntitiesInBox(rectangle as any, viewer as any)).toMatchSnapshot();
    });
  });

  describe('getUniquelyLocatedChannelGroups', () => {
    it('given empty array, returns empty array', () => {
      const channelGroups = MapUtils.getUniquelyLocatedChannelGroups(
        [] as any,
        { latitudeDegrees: 1234, longitudeDegrees: 1234 } as any
      );
      expect(channelGroups).toBeDefined();
      expect(channelGroups).toHaveLength(0);
      expect(channelGroups).toEqual([]);
    });
    it('given undefined, returns empty array', () => {
      const channelGroups = MapUtils.getUniquelyLocatedChannelGroups(undefined, {
        latitudeDegrees: 1234,
        longitudeDegrees: 1234
      } as any);
      expect(channelGroups).toBeDefined();
      expect(channelGroups).toHaveLength(0);
      expect(channelGroups).toEqual([]);
    });
    it('returns all channel groups when no duplicates exist', () => {
      const channelGroups = MapUtils.getUniquelyLocatedChannelGroups(
        ChannelGroupsNoDupes as any,
        { latitudeDegrees: 1234, longitudeDegrees: 1234 } as any
      );
      expect(channelGroups).toHaveLength(ChannelGroupsNoDupes.length);
      expect(channelGroups).toEqual(ChannelGroupsNoDupes);
    });
    it('ignores ChannelGroup when it matches the station location', () => {
      const channelGroups = MapUtils.getUniquelyLocatedChannelGroups(
        ChannelGroupSingle as any,
        ChannelGroupSingle[0].location as any
      );
      expect(channelGroups).toHaveLength(0);
      expect(channelGroups).toEqual([]);
    });

    it('returns only unique channel groups when duplicates exist ignoring elevation', () => {
      const channelGroups = MapUtils.getUniquelyLocatedChannelGroups(
        ChannelGroupsDupes as any,
        { latitudeDegrees: 1234, longitudeDegrees: 1234 } as any
      );
      expect(channelGroups).toHaveLength(1); // only one unique (lat, long) pair
      expect(channelGroups).not.toHaveLength(ChannelGroupsDupes.length);
    });
  });

  test('applyStationMultiSelectionLogic', () => {
    let stations = ['AAK', 'ARCES'];
    let id = 'AAK';
    expect(MapUtils.applyStationMultiSelectionLogic(jest.fn, stations, id)).toMatchSnapshot();

    stations = ['ARCES'];
    id = 'ARCES';
    expect(MapUtils.applyStationMultiSelectionLogic(jest.fn, stations, id)).toMatchSnapshot();

    stations = ['AAK', 'ARCES'];
    id = 'AAAK';
    expect(MapUtils.applyStationMultiSelectionLogic(jest.fn, stations, id)).toMatchSnapshot();

    stations = undefined;
    id = 'AAK';
    expect(MapUtils.applyStationMultiSelectionLogic(jest.fn, stations, id)).toMatchSnapshot();
  });

  test('applyEventMultiSelectionLogic', () => {
    let events = ['mockId1', 'mockId2'];
    let id = 'mockId1';
    expect(MapUtils.applyEventMultiSelectionLogic(jest.fn, events, id)).toMatchSnapshot();

    events = ['mockId2'];
    id = 'mockId2';
    expect(MapUtils.applyEventMultiSelectionLogic(jest.fn, events, id)).toMatchSnapshot();

    events = ['mockId1', 'mockId2'];
    id = 'mockId3';
    expect(MapUtils.applyEventMultiSelectionLogic(jest.fn, events, id)).toMatchSnapshot();

    events = undefined;
    id = 'mockId1';
    expect(MapUtils.applyEventMultiSelectionLogic(jest.fn, events, id)).toMatchSnapshot();
  });

  test('applySdMultiSelectionLogic', () => {
    let sdIds = ['mockId1', 'mockId2'];
    let id = 'mockId1';
    expect(MapUtils.applySdMultiSelectionLogic(jest.fn, sdIds, id)).toMatchSnapshot();

    sdIds = ['mockId2'];
    id = 'mockId2';
    expect(MapUtils.applySdMultiSelectionLogic(jest.fn, sdIds, id)).toMatchSnapshot();

    sdIds = ['mockId1', 'mockId2'];
    id = 'mockId3';
    expect(MapUtils.applySdMultiSelectionLogic(jest.fn, sdIds, id)).toMatchSnapshot();

    sdIds = undefined;
    id = 'mockId1';
    expect(MapUtils.applySdMultiSelectionLogic(jest.fn, sdIds, id)).toMatchSnapshot();
  });

  describe('intervalIsSelected', () => {
    test('returns false with no interval', () => {
      expect(MapUtils.intervalIsSelected(null)).toBe(false);
      expect(MapUtils.intervalIsSelected(undefined)).toBe(false);
      expect(MapUtils.intervalIsSelected('' as any)).toBe(false);
      expect(MapUtils.intervalIsSelected({} as any)).toBe(false);
      expect(MapUtils.intervalIsSelected({ startTimeSecs: 345, endTimeSecs: undefined })).toBe(
        false
      );
      expect(MapUtils.intervalIsSelected({ startTimeSecs: undefined, endTimeSecs: 1 })).toBe(false);
      expect(MapUtils.intervalIsSelected({ startTimeSecs: undefined, endTimeSecs: 0 })).toBe(false);
      expect(MapUtils.intervalIsSelected({ startTimeSecs: 0, endTimeSecs: undefined })).toBe(false);
      expect(MapUtils.intervalIsSelected({ endTimeSecs: 34556 } as any)).toBe(false);
      expect(
        MapUtils.intervalIsSelected({ startTimeSecs: undefined, endTimeSecs: undefined })
      ).toBe(false);

      expect(MapUtils.intervalIsSelected({ startTimeSecs: null, endTimeSecs: null })).toBe(false);
    });

    test('returns true with interval', () => {
      expect(MapUtils.intervalIsSelected({ startTimeSecs: 0, endTimeSecs: 1 })).toBe(true);
      expect(MapUtils.intervalIsSelected({ startTimeSecs: -20, endTimeSecs: 0 })).toBe(true);
      expect(MapUtils.intervalIsSelected({ startTimeSecs: 340, endTimeSecs: 14325 })).toBe(true);
    });
  });

  test('WaveformDisplay is Open returns true when provided array contains waveform display', () => {
    const waveformOpen = { waveform: GLDisplayState.OPEN };
    const waveformClosed = {
      waveform: GLDisplayState.CLOSED
    };
    const waveformNotInMap = { waeoui: GLDisplayState.OPEN };

    expect(MapUtils.waveformDisplayIsOpen({})).toEqual(false);
    expect(MapUtils.waveformDisplayIsOpen(undefined)).toEqual(false);
    expect(MapUtils.waveformDisplayIsOpen(null)).toEqual(false);

    expect(MapUtils.waveformDisplayIsOpen(waveformOpen)).toEqual(true);
    expect(MapUtils.waveformDisplayIsOpen(waveformClosed)).toEqual(false);
    expect(MapUtils.waveformDisplayIsOpen(waveformNotInMap)).toEqual(false);
  });

  it('builds a map event correctly', () => {
    const eventStatuses: Record<string, EventStatus> = {};
    eventStatuses[eventData.id] = {
      stageId: { name: openIntervalName },
      eventId: eventData.id,
      eventStatusInfo: eventStatusInfoInProgress
    };

    expect(
      MapUtils.buildMapEventSource(
        {
          event: eventData,
          eventStatus: eventStatuses[eventData.id],
          eventIsOpen: false,
          eventInConflict: false,
          eventIsActionTarget: false
        },
        eventData.eventHypotheses[0].locationSolutions[0],
        openIntervalName,
        { startTimeSecs: 0, endTimeSecs: 100 },
        null
      )
    ).toMatchSnapshot();
  });

  test('sdOnMouseEnterHandler should match snapshot', () => {
    const mockMovement = {
      startPosition: { x: 0, y: 0 },
      endPosition: { x: 0, y: 0 }
    } as any;
    const mockTarget = {
      properties: { isSelected: false, polyline: { width: 1, material: { color: '#FFFFFF' } } }
    } as any;
    expect(MapUtils.sdOnMouseEnterHandler(mockMovement, mockTarget)).toMatchSnapshot();
  });

  test('sdOnMouseLeaveHandler should match snapshot', () => {
    const mockMovement = {
      startPosition: { x: 0, y: 0 },
      endPosition: { x: 0, y: 0 }
    } as any;
    const mockTarget = {
      properties: { isSelected: false, polyline: { width: 1, material: { color: '#FFFFFF' } } }
    } as any;
    expect(MapUtils.sdOnMouseLeaveHandler(mockMovement, mockTarget)).toMatchSnapshot();
  });
});
