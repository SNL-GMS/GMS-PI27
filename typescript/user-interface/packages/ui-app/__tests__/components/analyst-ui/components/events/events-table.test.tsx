import { WorkflowTypes } from '@gms/common-model';
import { eventData, openIntervalName } from '@gms/common-model/__tests__/__data__';
import { MILLISECONDS_IN_SECOND, SECONDS_IN_HOUR } from '@gms/common-util';
import type { AnalystWaveformTypes, AppState } from '@gms/ui-state';
import { EventsColumn, getStore, setOpenInterval, useAppDispatch } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { HotkeyListener } from '@gms/ui-util';
import { render } from '@testing-library/react';
import Immutable from 'immutable';
import React from 'react';
import { Provider } from 'react-redux';

import {
  dispatchSetEventId,
  EventsTable,
  handleOnRowClickEvent,
  onCloseEvent,
  onRowDoubleClicked,
  rowClassRules
} from '../../../../../src/ts/components/analyst-ui/components/events/events-table';
import { EventFilterOptions } from '../../../../../src/ts/components/analyst-ui/components/events/types';
import { dummyData } from './event-table-mock-data';

jest.mock('@gms/ui-state/lib/app/api/data/event/get-events-detections-segments-by-time', () => {
  const actual = jest.requireActual(
    '@gms/ui-state/lib/app/api/data/event/get-events-detections-segments-by-time'
  );
  return {
    ...actual,
    getEventsWithDetectionsAndSegmentsByTime: () => async () =>
      new Promise(resolve => {
        resolve(0);
      })
  };
});

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const mockDispatch = () => jest.fn();
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useGetEvents: jest.fn().mockReturnValue({
      data: [eventData]
    }),
    useGetEventsByTime: jest.fn(),
    useFetchEventsWithDetectionsAndSegmentsByTime: jest.fn(),
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
      data: { stages: [{ name: 'Auto Network' }, { name: openIntervalName }] }
    })),
    useUpdateEventStatusMutation: jest.fn(() => [jest.fn()]),
    useEventStatusQuery: jest.fn(() => ({
      isSuccess: true,
      data: {
        '7cce53cf-9057-3442-b717-20a370c3c723': {
          stageId: {
            name: openIntervalName
          },
          eventId: '7cce53cf-9057-3442-b717-20a370c3c723',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        '9ac403da-7947-3183-884c-18a67d3aa8de': {
          stageId: {
            name: openIntervalName
          },
          eventId: '9ac403da-7947-3183-884c-18a67d3aa8de',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        '31b3b31a-1c2f-3a37-8206-f111127c0dbd': {
          stageId: {
            name: openIntervalName
          },
          eventId: '31b3b31a-1c2f-3a37-8206-f111127c0dbd',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        '1587965f-b4d4-35af-a842-8a4a024feb0d': {
          stageId: {
            name: openIntervalName
          },
          eventId: '1587965f-b4d4-35af-a842-8a4a024feb0d',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        'eddb904a-6db7-3375-9d28-57aacadb1cb0': {
          stageId: {
            name: openIntervalName
          },
          eventId: 'eddb904a-6db7-3375-9d28-57aacadb1cb0',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        '08fe2621-d8e7-36b0-aec0-da35256a998d': {
          stageId: {
            name: openIntervalName
          },
          eventId: '08fe2621-d8e7-36b0-aec0-da35256a998d',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        'fed33392-d3a4-3aa1-89a8-7a38b875ba4a': {
          stageId: {
            name: openIntervalName
          },
          eventId: 'fed33392-d3a4-3aa1-89a8-7a38b875ba4a',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        '7f975a56-c761-3b65-86ec-a0b37ce6ec87': {
          stageId: {
            name: openIntervalName
          },
          eventId: '7f975a56-c761-3b65-86ec-a0b37ce6ec87',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        'aa68c75c-4a77-387f-97fb-686b2f068676': {
          stageId: {
            name: openIntervalName
          },
          eventId: 'aa68c75c-4a77-387f-97fb-686b2f068676',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        '58c54802-a9fb-3526-8d09-23353a34a7ae': {
          stageId: {
            name: openIntervalName
          },
          eventId: '58c54802-a9fb-3526-8d09-23353a34a7ae',
          eventStatusInfo: {
            eventStatus: 'NOT_STARTED',
            activeAnalystIds: []
          }
        },
        'fba9d881-64f3-32d9-909e-e770223212a0': {
          stageId: {
            name: openIntervalName
          },
          eventId: 'fba9d881-64f3-32d9-909e-e770223212a0',
          eventStatusInfo: {
            eventStatus: 'IN_PROGRESS',
            activeAnalystIds: ['John']
          }
        }
      }
    })),
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
      state.app.workflow.openIntervalName = openIntervalName;
      state.app.waveform.viewableInterval = range;
      state.app.waveform.stationsVisibility = stationsVisibility;
      state.app.common.selectedStationIds = ['station-name'];

      return stateFunc(state);
    }),
    useUiTheme: () => [
      {
        colors: {
          gmsSelection: '#123123',
          gmsMain: '#BADBAD',
          gmsMainInverted: '#DABDAB',
          gmsBackground: '#000000'
        }
      },
      jest.fn()
    ]
  };
});

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const store = getStore();
setOpenInterval(
  {
    startTimeSecs: MOCK_TIME / MILLISECONDS_IN_SECOND - SECONDS_IN_HOUR,
    endTimeSecs: MOCK_TIME / MILLISECONDS_IN_SECOND
  },
  {
    name: 'Station Group',
    effectiveAt: 0,
    description: ''
  },
  openIntervalName,
  ['Event Review'],
  WorkflowTypes.AnalysisMode.SCAN
  // eslint-disable-next-line @typescript-eslint/unbound-method
)(store.dispatch, store.getState);

const columnFilterMap = Immutable.Map(
  Object.values(EventsColumn)
    // all columns are visible by default
    .map(v => [v, true])
);

describe('Events Table', () => {
  it('is exported', () => {
    expect(EventsTable).toBeDefined();
  });

  test('handleOnRowClickEvent can handle an onclick', () => {
    const setEventActionTargets: (targetIds: string[]) => void = jest.fn();

    const keyboardShortcutConfigurations: any = {
      clickEvents: { showEventDetails: { combos: ['alt'] } }
    };
    expect(handleOnRowClickEvent).toBeDefined();

    HotkeyListener.subscribeToGlobalHotkeyListener();
    const altClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      altKey: true
    });

    const event: any = {
      node: {
        rowIndex: 0,
        isSelected: () => false,
        setSelected: jest.fn()
      },
      api: {
        getSelectedNodes: jest.fn(() => []),
        getEditingCells: jest.fn(() => [])
      },
      event: altClick,
      data: {
        id: 'id',
        depthKm: 4,
        latitudeDegrees: 44,
        longitudeDegrees: 44,
        time: 44
      }
    };

    handleOnRowClickEvent(event, keyboardShortcutConfigurations, setEventActionTargets);
    expect(setEventActionTargets).toHaveBeenCalledTimes(1);
  });

  test('EventsTable matches snapshot', () => {
    const component = render(
      <Provider store={store}>
        <EventsTable
          columnsToDisplay={columnFilterMap}
          data={[dummyData]}
          setEventId={jest.fn()}
          setCreateEventMenuState={jest.fn()}
        />
      </Provider>
    );

    expect(component.container).toMatchSnapshot();
  });

  it('onCloseEvent opens an event', async () => {
    const closeEvent = jest.fn();
    await onCloseEvent('mockId', closeEvent);
    expect(closeEvent).toHaveBeenCalledWith('mockId');
  });

  it('calls dispatch and set event id', () => {
    const setEventId = jest.fn();
    const mockDispatch = useAppDispatch();
    dispatchSetEventId('mockId', mockDispatch, setEventId);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(setEventId).toHaveBeenCalledWith('mockId');
  });

  it('calculates row color correctly', () => {
    let mockParams = {
      data: { isOpen: true, eventFilterOptions: [EventFilterOptions.INTERVAL] } as any
    };
    expect(rowClassRules).toMatchInlineSnapshot(`
      {
        "action-target-row": [Function],
        "deleted-event-row": [Function],
        "edge-event-row": [Function],
        "open-event-row": [Function],
        "rejected-event-row": [Function],
        "unqualified-action-target-row": [Function],
      }
    `);

    mockParams = { data: { isOpen: false, eventFilterOptions: [EventFilterOptions.INTERVAL] } };
    expect(rowClassRules['open-event-row'](mockParams)).toBeFalsy();
    mockParams = { data: { isOpen: true, eventFilterOptions: [EventFilterOptions.INTERVAL] } };
    expect(rowClassRules['open-event-row'](mockParams)).toBeTruthy();

    mockParams = { data: { isOpen: false, eventFilterOptions: [EventFilterOptions.INTERVAL] } };
    expect(rowClassRules['edge-event-row'](mockParams)).toBeFalsy();
    mockParams = { data: { isOpen: false, eventFilterOptions: [EventFilterOptions.AFTER] } };
    expect(rowClassRules['edge-event-row'](mockParams)).toBeTruthy();
    mockParams = { data: { isOpen: false, eventFilterOptions: [EventFilterOptions.BEFORE] } };
    expect(rowClassRules['edge-event-row'](mockParams)).toBeTruthy();
  });

  it('onRowDoubleClicked is defined', () => {
    expect(onRowDoubleClicked).toBeDefined();
  });

  it('onRowDoubleClicked does not throw for closed event', async () => {
    const mockEvent: any = {
      event: { x: 1, y: 2 },
      data: { id: 'mockId', isOpen: false, activeAnalysts: [] }
    };
    const openEvent = jest.fn();
    const closeEvent = jest.fn();
    const setEventId = jest.fn();
    await expect(
      onRowDoubleClicked(
        useAppDispatch(),
        mockEvent,
        {
          openEvent,
          closeEvent,
          setEventId
        },
        'username'
      )
    ).resolves.not.toThrow();
  });

  it('onRowDoubleClicked does not throw for open event', async () => {
    const mockEvent: any = {
      event: { x: 1, y: 2 },
      data: { id: 'mockId', isOpen: true, activeAnalysts: ['username'] }
    };
    const openEvent = jest.fn();
    const closeEvent = jest.fn();
    const setEventId = jest.fn();
    await expect(
      onRowDoubleClicked(
        useAppDispatch(),
        mockEvent,
        {
          openEvent,
          closeEvent,
          setEventId
        },
        'username'
      )
    ).resolves.not.toThrow();
  });
});
