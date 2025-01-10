import { WorkflowTypes } from '@gms/common-model';
import {
  defaultStations,
  deletedSignalDetectionData,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import {
  deletedEventData,
  eventData,
  eventStatusInfoNotComplete,
  openIntervalName,
  user
} from '@gms/common-model/__tests__/__data__/event/event-data';
import { act, renderHook } from '@testing-library/react-hooks';
import { produce } from 'immer';

import { useAppDispatch } from '../../../src/ts/app';
import {
  useAssociateSignalDetections,
  useCreateNewEvent,
  useCreateVirtualEvent,
  useDeleteEvents,
  useDuplicateEvents,
  useGetCommonOperationParams,
  useGetPreferredEventHypothesesByEventIds,
  useGetQualifiedAndUnqualifiedEventActionTargetIdsFromSelected,
  useRejectEvents,
  useSetSelectedEventIds,
  useUnassociateSignalDetections
} from '../../../src/ts/app/hooks/event-hooks';
import type { AppState } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';
import { appState, getTestReduxWrapper } from '../../test-util';

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = produce(appState, draft => {
        draft.data.signalDetections = {
          [signalDetectionsData[1].id]: signalDetectionsData[1],
          [deletedSignalDetectionData.id]: deletedSignalDetectionData
        };
        draft.data.events = {
          [eventData.id]: eventData,
          [deletedEventData.id]: deletedEventData
        };
        draft.app.userSession.authenticationStatus.userName = user;
        draft.app.workflow.openIntervalName = openIntervalName;
        draft.app.workflow.openActivityNames = ['AL1 Event Review'];
        draft.app.analyst.openEventId = eventData.id;
        draft.app.workflow.timeRange = { startTimeSecs: 1669150800, endTimeSecs: 1669154400 };
        draft.app.waveform.viewableInterval = {
          startTimeSecs: 1669150800,
          endTimeSecs: 1669154400
        };
        draft.app.analyst.selectedSdIds = [
          signalDetectionsData[1].id,
          deletedSignalDetectionData.id
        ];
        draft.app.analyst.selectedEventIds = [eventData.id, deletedEventData.id];
        draft.app.analyst.actionTargets.eventIds = [eventData.id, deletedEventData.id];
      });

      return stateFunc(state);
    })
  };
});

jest.mock('../../../src/ts/app/api/workflow/workflow-api-slice', () => {
  const actual = jest.requireActual('../../../src/ts/app/api/workflow/workflow-api-slice');
  return {
    ...actual,
    useWorkflowQuery: jest.fn(() => ({
      isSuccess: true,
      data: {
        stages: [
          {
            name: openIntervalName,
            mode: WorkflowTypes.StageMode.INTERACTIVE,
            activities: [{ stationGroup: { name: 'mockStationGroup' } }]
          },
          {
            name: 'AL2',
            mode: WorkflowTypes.StageMode.AUTOMATIC,
            activities: [{ stationGroup: { name: 'mockStationGroup2' } }]
          }
        ]
      }
    }))
  };
});

jest.mock(
  '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetProcessingMonitoringOrganizationConfigurationQuery: jest.fn(() => ({
        data: {
          monitoringOrganization: 'testOrg'
        }
      })),
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: processingAnalystConfigurationData
      }))
    };
  }
);

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  return {
    useAllStations: jest.fn(() => defaultStations),
    useVisibleStations: jest.fn(() => defaultStations)
  };
});

jest.mock('../../../src/ts/app/hooks/event-manager-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/event-manager-hooks');
  return {
    ...actual,
    useEventStatusQuery: jest.fn(() => ({
      isSuccess: true,
      data: {
        [eventData.id]: {
          stageId: {
            name: openIntervalName
          },
          eventId: eventData.id,
          eventStatusInfo: { ...eventStatusInfoNotComplete }
        }
      }
    })),
    useRejectDeleteEventStatus: jest.fn(() => jest.fn),
    useDuplicateEventStatus: jest.fn(() => jest.fn),
    useFetchEventsWithDetectionsAndSegmentsByTime: jest.fn(),
    useGetEvents: jest.fn().mockReturnValue({
      data: [eventData, deletedEventData],
      fulfilled: 0,
      isError: false,
      isLoading: false,
      pending: 0,
      rejected: 0
    })
  };
});

jest.mock('../../../src/ts/app/api/event-manager/event-manager-api-slice', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/event-manager/event-manager-api-slice'
  );
  return {
    ...actual,
    // Prevents async operations from hanging when the test finishes
    useUpdateEventStatusMutation: jest.fn(() => [jest.fn()])
  };
});

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    uuid4: () => '123456789'
  };
});

jest.mock('../../../src/ts/app/hooks/event-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/event-hooks');
  return {
    ...actual,
    useGetPreferredEventHypothesesByEventIds: jest
      .fn()
      .mockReturnValue([eventData.eventHypotheses[0], deletedEventData.eventHypotheses[0]])
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

const store = getStore();

describe('Event Hooks', () => {
  test('all hooks are defined', () => {
    expect(useGetCommonOperationParams).toBeDefined();
    expect(useAssociateSignalDetections).toBeDefined();
    expect(useUnassociateSignalDetections).toBeDefined();
    expect(useGetPreferredEventHypothesesByEventIds).toBeDefined();
    expect(useDuplicateEvents).toBeDefined();
    expect(useCreateNewEvent).toBeDefined();
    expect(useCreateVirtualEvent).toBeDefined();
    expect(useDeleteEvents).toBeDefined();
    expect(useRejectEvents).toBeDefined();
    expect(useSetSelectedEventIds).toBeDefined();
    expect(useGetQualifiedAndUnqualifiedEventActionTargetIdsFromSelected).toBeDefined();
  });

  test('useAssociateSignalDetections', () => {
    const mockDispatch = useAppDispatch();
    (mockDispatch as unknown as any).mock.calls = [];

    const { result } = renderHook(useAssociateSignalDetections, {
      wrapper: getTestReduxWrapper(store)
    });
    act(() => {
      result.current([signalDetectionsData[1].id]);
    });

    expect((mockDispatch as unknown as any).mock.calls).toEqual([
      [
        {
          payload: {
            eventId: eventData.id,
            openIntervalName,
            signalDetectionIds: ['012de1b9-8ae3-3fd4-800d-58123c3152cc'],
            stageId: {
              definitionId: {
                name: openIntervalName
              },
              startTime: 1669150800
            },
            username: user
          },
          type: 'data/associateSignalDetectionsToEvent'
        }
      ]
    ]);
  });

  test('useUnassociateSignalDetections', () => {
    const mockDispatch = useAppDispatch();
    (mockDispatch as unknown as any).mock.calls = [];

    const { result } = renderHook(useUnassociateSignalDetections, {
      wrapper: getTestReduxWrapper(store)
    });
    act(() => {
      result.current([signalDetectionsData[1].id]);
    });

    expect((mockDispatch as unknown as any).mock.calls).toEqual([
      [
        {
          payload: {
            eventId: eventData.id,
            openIntervalName,
            rejectAssociations: false,
            signalDetectionIds: ['012de1b9-8ae3-3fd4-800d-58123c3152cc'],
            stageId: {
              definitionId: {
                name: openIntervalName
              },
              startTime: 1669150800
            },
            username: user
          },
          type: 'data/unassociateSignalDetectionsToEvent'
        }
      ]
    ]);
  });

  test('useCreateNewEvent', async () => {
    const mockDispatch = useAppDispatch();
    (mockDispatch as unknown as any).mock.calls = [];

    const { result } = renderHook(useCreateNewEvent, {
      wrapper: getTestReduxWrapper(store)
    });

    await result.current([signalDetectionsData[1].id]);

    expect((mockDispatch as unknown as any).mock.calls).toEqual([
      [
        {
          payload: {
            newEventId: '123456789',
            signalDetectionIds: [signalDetectionsData[1].id],
            monitoringOrganization: 'testOrg',
            workflowDefinitionId: {
              name: openIntervalName
            },
            username: user,
            stations: defaultStations
          },
          type: 'data/createEventFromSignalDetections'
        }
      ]
    ]);
  });

  test('useCreateNewEvent with 1 rejected and 1 non-rejected signal detection', () => {
    const { result } = renderHook(useCreateNewEvent, {
      wrapper: getTestReduxWrapper(store)
    });
    const eventId = result.current([signalDetectionsData[1].id, deletedSignalDetectionData.id]);
    expect(eventId).toBeDefined();
  });

  test('useCreateVirtualEvent', async () => {
    const mockDispatch = useAppDispatch();
    (mockDispatch as unknown as any).mock.calls = [];

    const MOCK_TIME = 1606818240000;
    const mockDate = new Date(MOCK_TIME);
    const mockLatitudeDeg = 30;
    const mockLongitudeDeg = -60;
    const mockDepthKm = -40;

    const { result } = renderHook(useCreateVirtualEvent, {
      wrapper: getTestReduxWrapper(store)
    });

    await result.current(mockDate, mockLatitudeDeg, mockLongitudeDeg, mockDepthKm);

    expect((mockDispatch as unknown as any).mock.calls).toEqual([
      [
        {
          payload: {
            newEventId: '123456789',
            eventDate: mockDate,
            latitudeDegrees: mockLatitudeDeg,
            longitudeDegrees: mockLongitudeDeg,
            depthKm: mockDepthKm,
            monitoringOrganization: 'testOrg',
            workflowDefinitionId: {
              name: openIntervalName
            },
            username: user
          },
          type: 'data/createVirtualEvent'
        }
      ]
    ]);
  });

  test('useDuplicateEvents', () => {
    const mockDispatch = useAppDispatch();

    const { result } = renderHook(useDuplicateEvents, {
      wrapper: getTestReduxWrapper(store)
    });
    act(() => {
      result.current([eventData.id]);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        newEventIds: ['123456789'],
        eventIds: [eventData.id],
        openIntervalName,
        username: user,
        workflowDefinitionId: {
          name: openIntervalName
        }
      },
      type: 'data/duplicateEvents'
    });
  });

  test('useDeleteEvents', () => {
    const mockDispatch = useAppDispatch();

    const { result } = renderHook(useDeleteEvents, {
      wrapper: getTestReduxWrapper(store)
    });
    act(() => {
      result.current([eventData.id]);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        eventIds: [eventData.id],
        stageId: { definitionId: { name: openIntervalName }, startTime: 1669150800 },
        username: user,
        openIntervalName
      },
      type: 'data/deleteEvents'
    });
  });

  test('useRejectEvents', () => {
    const mockDispatch = useAppDispatch();

    const { result } = renderHook(() => useRejectEvents(), {
      wrapper: getTestReduxWrapper(store)
    });
    act(() => {
      result.current([eventData.id]);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        eventIds: ['eventID'],
        openIntervalName,
        stageId: { definitionId: { name: openIntervalName }, startTime: 1669150800 },
        username: user
      },
      type: 'data/rejectEvent'
    });
  });

  test('useSetSelectedEventIds', () => {
    const mockDispatch = useAppDispatch();

    const { result } = renderHook(() => useSetSelectedEventIds(), {
      wrapper: getTestReduxWrapper(store)
    });
    act(() => {
      result.current([eventData.id]);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: [eventData.id],
      type: 'analyst/setSelectedEventIds'
    });
  });

  test('useGetPreferredEventHypothesesByEventIds', () => {
    const { result } = renderHook(() => useGetPreferredEventHypothesesByEventIds([eventData.id]), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result.current).toBeDefined();
  });

  test('useGetCommonOperationParams', () => {
    const { result } = renderHook(() => useGetCommonOperationParams(), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result.current).toBeDefined();
  });

  test('useGetQualifiedAndUnqualifiedEventActionTargetIdsFromSelected', () => {
    const { result } = renderHook(
      () => useGetQualifiedAndUnqualifiedEventActionTargetIdsFromSelected(),
      {
        wrapper: getTestReduxWrapper(store)
      }
    );
    const eventActionTargetIds = result.current();
    expect(eventActionTargetIds.unqualified).toHaveLength(1);
    expect(eventActionTargetIds.qualified).toHaveLength(1);
  });
});
