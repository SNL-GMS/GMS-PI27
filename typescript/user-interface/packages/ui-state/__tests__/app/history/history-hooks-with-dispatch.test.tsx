import {
  eventData,
  eventStatusInfoNotComplete,
  openIntervalName,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { UNFILTERED } from '@gms/common-model/lib/filter';
import { AnalysisMode } from '@gms/common-model/lib/workflow/types';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import {
  addBeamedChannels,
  addChannelSegments,
  addEvents,
  addSignalDetections,
  analystActions,
  setAppAuthenticationStatus,
  useAppSelector,
  useUpdateSignalDetectionPhase,
  waveformActions,
  workflowSlice
} from '../../../src/ts/app';
import {
  selectHistory,
  useEventRedoById,
  useEventUndoById,
  useHistoryMode,
  useRedoById,
  useUndo,
  useUndoById,
  useUndoRedoPosition
} from '../../../src/ts/app/history';
import type { ReduxStoreType } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';
import {
  getMatchingUiChannelSegmentRecordForSignalDetections,
  getMatchingUiChannelsForSignalDetections
} from '../../__data__/ui-channel-segments/ui-channel-segment-data-utils';

jest.mock('../../../src/ts/app/api/data/event/get-events-detections-segments-by-time', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/data/event/get-events-detections-segments-by-time'
  );
  return {
    ...actual,
    getEventsWithDetectionsAndSegmentsByTime: () => async () =>
      new Promise(resolve => {
        resolve(0);
      })
  };
});

jest.mock('axios', () => {
  const success = 'success';
  const actualAxios = jest.requireActual('axios');
  return {
    ...actualAxios,
    request: jest.fn().mockReturnValue(Promise.resolve(success))
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
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: processingAnalystConfigurationData
      }))
    };
  }
);

jest.mock('../../../src/ts/app/hooks/processing-analyst-configuration-hooks', () => {
  const actual = jest.requireActual(
    '@gms/ui-state/src/ts/app/hooks/processing-analyst-configuration-hooks'
  );

  return {
    ...actual,
    useProcessingAnalystConfiguration: jest.fn(() => processingAnalystConfigurationData)
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

jest.mock('../../../src/ts/app/hooks/event-manager-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/event-manager-hooks');
  return {
    ...actual,
    useGetEvents: jest.fn(() => ({
      isSuccess: true,
      data: [eventData]
    })),
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
    }))
  };
});

describe('history hooks', () => {
  let store: ReduxStoreType;

  beforeEach(() => {
    store = getStore();

    act(() => {
      const uiChannelSegmentRecord =
        getMatchingUiChannelSegmentRecordForSignalDetections(signalDetectionsData);

      const addChannelsPayload = getMatchingUiChannelsForSignalDetections(signalDetectionsData);

      const addChannelSegmentsPayload = Object.entries(uiChannelSegmentRecord).map(
        ([name, filterRecord]) => {
          const channelSegments = filterRecord[UNFILTERED];

          return {
            name,
            channelSegments
          };
        }
      );

      store.dispatch(
        waveformActions.setViewableInterval({ startTimeSecs: 0, endTimeSecs: Infinity })
      );

      store.dispatch(addChannelSegments(addChannelSegmentsPayload));
      store.dispatch(addBeamedChannels(addChannelsPayload));
      store.dispatch(addEvents([eventData]));
      store.dispatch(addSignalDetections(signalDetectionsData));

      store.dispatch(
        setAppAuthenticationStatus({
          authenticated: true,
          authenticationCheckComplete: true,
          failedToConnect: false,
          userName: 'test'
        })
      );
      store.dispatch(
        workflowSlice.actions.setTimeRange({ startTimeSecs: 1669150800, endTimeSecs: 1669154400 })
      );
      store.dispatch(
        workflowSlice.actions.setStationGroup({
          effectiveAt: 1669150800,
          name: 'ALL_1',
          description: 'test'
        })
      );
      store.dispatch(workflowSlice.actions.setOpenIntervalName('AL1'));
      store.dispatch(workflowSlice.actions.setOpenActivityNames(['AL1 Event Review']));
      store.dispatch(workflowSlice.actions.setAnalysisMode(AnalysisMode.EVENT_REVIEW));

      store.dispatch(analystActions.setSelectedSdIds([signalDetectionsData[0].id]));
    });
  });

  it('exists', () => {
    expect(useHistoryMode).toBeDefined();
    expect(useUndoRedoPosition).toBeDefined();
    expect(useUndoById).toBeDefined();
    expect(useRedoById).toBeDefined();
    expect(useEventUndoById).toBeDefined();
    expect(useEventRedoById).toBeDefined();
  });

  it('useHistoryMode', () => {
    const result = renderHook(() => useHistoryMode(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    expect(result.result.current[0]).toEqual('global');
    expect(result.result.current[1]).toBeDefined();
    expect(result.result.current[2]).toBeFalsy();

    act(() => {
      result.result.current[1]('event');
    });

    expect(result.result.current[0]).toEqual('event');
    expect(result.result.current[1]).toBeDefined();
    expect(result.result.current[2]).toBeFalsy();

    act(() => {
      store.dispatch(analystActions.setOpenEventId('test'));
    });

    expect(result.result.current[0]).toEqual('event');
    expect(result.result.current[1]).toBeDefined();
    expect(result.result.current[2]).toBeTruthy();
  });

  it('useHistoryUndoRedoPosition - no history', () => {
    const resultUseHistoryMode = renderHook(() => useHistoryMode(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    const resultUseHistoryUndoRedoPosition = renderHook(() => useUndoRedoPosition(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(-1);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeFalsy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();

    act(() => {
      store.dispatch(analystActions.setOpenEventId('test'));
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(-1);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeFalsy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();

    act(() => {
      resultUseHistoryMode.result.current[1]('event');
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(-1);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeFalsy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();
  });

  it('useHistoryUndoRedoPosition - with history no event', async () => {
    const resultUseHistoryMode = renderHook(() => useHistoryMode(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    const resultUseHistoryUndoRedoPosition = renderHook(() => useUndoRedoPosition(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(-1);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeFalsy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();

    act(() => {
      store.dispatch(analystActions.setOpenEventId('test'));
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(-1);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeFalsy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();

    act(() => {
      store.dispatch(analystActions.setOpenEventId(''));
    });

    const useUpdateSignalDetectionPhaseResult = renderHook(() => useUpdateSignalDetectionPhase(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    const useSelectHistoryResult = renderHook(() => useAppSelector(selectHistory), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(async () =>
        useUpdateSignalDetectionPhaseResult.result.current(
          signalDetectionsData.map(s => s.id),
          'P5KPdf'
        )
      ).not.toThrow();
    });

    await act(async () => useSelectHistoryResult.waitForNextUpdate());

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(1);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeTruthy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();

    act(() => {
      store.dispatch(analystActions.setOpenEventId('test'));
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(1);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeTruthy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();

    act(() => {
      resultUseHistoryMode.result.current[1]('event');
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(1);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeTruthy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();

    act(() => {
      store.dispatch(analystActions.setOpenEventId(''));
      resultUseHistoryMode.result.current[1]('global');
    });

    const useUndoResult = renderHook(() => useUndo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => useUndoResult.result.current(1)).not.toThrow();
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(-1);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeFalsy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeTruthy();
  });

  it('useUndoById', () => {
    const result = renderHook(() => useUndoById(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => result.result.current('')).toThrow();
    });
  });

  it('useRedoById', () => {
    const result = renderHook(() => useRedoById(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => result.result.current('')).toThrow();
    });
  });

  it('useEventUndoById', () => {
    const result = renderHook(() => useEventUndoById(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => result.result.current('', '')).toThrow();
    });
  });

  it('useEventRedoById', () => {
    const result = renderHook(() => useEventRedoById(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => result.result.current('', '')).toThrow();
    });
  });
});
