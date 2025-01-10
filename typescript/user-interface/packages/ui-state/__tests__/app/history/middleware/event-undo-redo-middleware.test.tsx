import type { ConfigurationTypes } from '@gms/common-model';
import { WorkflowTypes } from '@gms/common-model';
import {
  eventData,
  eventStatusInfoNotComplete,
  openIntervalName,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';
import { UNFILTERED } from '@gms/common-model/lib/filter';
import type { SignalDetection } from '@gms/common-model/lib/signal-detection';
import {
  findPhaseFeatureMeasurementValue,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import { AnalysisMode } from '@gms/common-model/lib/workflow/types';
import { act, renderHook } from '@testing-library/react-hooks';
import cloneDeep from 'lodash/cloneDeep';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { Provider } from 'react-redux';

import type { ReduxStoreType } from '../../../../src/ts/app';
import {
  addBeamedChannels,
  addChannelSegments,
  addEvents,
  addSignalDetections,
  analystActions,
  getStore,
  selectEventUndoRedoPositions,
  selectHistory,
  selectUndoRedoPositions,
  setAppAuthenticationStatus,
  useAppSelector,
  useEventRedo,
  useEventUndo,
  useUpdateSignalDetectionPhase,
  waveformActions,
  workflowSlice
} from '../../../../src/ts/app';
import { eventUndoRedoMiddleware } from '../../../../src/ts/app/history/middleware/event-undo-redo-middleware';
import {
  getMatchingUiChannelSegmentRecordForSignalDetections,
  getMatchingUiChannelsForSignalDetections
} from '../../../__data__/ui-channel-segments/ui-channel-segment-data-utils';

const events = {};
events[eventData.id] = eventData;

const signalDetections = {};
signalDetectionsData.forEach(signalDetection => {
  signalDetections[signalDetection.id] = signalDetection;
});

const operationalTimePeriodConfiguration: ConfigurationTypes.OperationalTimePeriodConfiguration = {
  operationalPeriodStart: 100,
  operationalPeriodEnd: 200
};

jest.mock('../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time'
  );
  return {
    ...actual,
    getEventsWithDetectionsAndSegmentsByTime: () => async () =>
      new Promise(resolve => {
        resolve(0);
      })
  };
});

jest.mock(
  '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetOperationalTimePeriodConfigurationQuery: jest.fn(() => ({
        operationalTimePeriodConfiguration
      })),
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: processingAnalystConfigurationData
      }))
    };
  }
);

jest.mock('../../../../src/ts/app/api/workflow/workflow-api-slice', () => {
  const actual = jest.requireActual('../../../../src/ts/app/api/workflow/workflow-api-slice');
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

jest.mock('../../../../src/ts/app/api/event-manager/event-manager-api-slice', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/api/event-manager/event-manager-api-slice'
  );
  return {
    ...actual,
    // Prevents async operations from hanging when the test finishes
    useUpdateEventStatusMutation: jest.fn(() => [jest.fn()])
  };
});

jest.mock('../../../../src/ts/app/hooks/event-manager-hooks', () => {
  const actual = jest.requireActual('../../../../src/ts/app/hooks/event-manager-hooks');
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

describe('event undo redo middleware', () => {
  let store: ReduxStoreType;

  beforeEach(() => {
    store = getStore();

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

    act(() => {
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
    expect(eventUndoRedoMiddleware).toBeDefined();
  });

  it('can handle an event undo/redo request', async () => {
    const useSelectHistoryResult = renderHook(() => useAppSelector(selectHistory), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => useSelectHistoryResult.result.current.stack).toHaveLength(0);
    });

    const useSelectHistoryPositionResult = renderHook(
      () => useAppSelector(selectUndoRedoPositions),
      {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      }
    );

    act(() => {
      expect(useSelectHistoryPositionResult.result.current).toMatchInlineSnapshot(`
        [
          -1,
          0,
        ]
      `);
    });

    const useSelectEventHistoryPositionResult = renderHook(
      () => useAppSelector(selectEventUndoRedoPositions),
      {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      }
    );

    act(() => {
      expect(useSelectEventHistoryPositionResult.result.current).toMatchInlineSnapshot(`
        [
          -1,
          0,
        ]
      `);
    });

    const useSelectEventsResult = renderHook(() => useAppSelector(s => s.data.events), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(Object.values(useSelectEventsResult.result.current)).toEqual([eventData]);
    });

    const useSelectSignalDetectionsResult = renderHook(
      () => useAppSelector(s => s.data.signalDetections),
      {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      }
    );

    act(() => {
      expect(Object.values(useSelectSignalDetectionsResult.result.current)).toEqual(
        signalDetectionsData
      );
    });

    const useUpdateSignalDetectionPhaseResult = renderHook(() => useUpdateSignalDetectionPhase(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    // UPDATE SD PHASE

    act(() => {
      expect(async () =>
        useUpdateSignalDetectionPhaseResult.result.current(
          signalDetectionsData.map(s => s.id),
          'P5KPdf'
        )
      ).not.toThrow();
    });

    await act(async () => useSelectHistoryResult.waitForNextUpdate());

    const signalDetectionDataAfterChange: SignalDetection[] = [];
    act(() => {
      signalDetectionDataAfterChange.push(
        ...cloneDeep(Object.values(store.getState().data.signalDetections))
      );
      signalDetectionsData.forEach(originalSignalDetection => {
        const signalDetection = store.getState().data.signalDetections[originalSignalDetection.id];

        const originalHypothesis = getCurrentHypothesis(
          originalSignalDetection.signalDetectionHypotheses
        );
        const originalPhase = findPhaseFeatureMeasurementValue(
          originalHypothesis.featureMeasurements
        );

        const hypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
        const phase = findPhaseFeatureMeasurementValue(hypothesis.featureMeasurements);

        expect(originalHypothesis).not.toEqual(hypothesis);
        expect(originalPhase.value).not.toEqual(phase.value);
        expect(phase.value).toEqual('P5KPdf');
        expect(store.getState().history.signalDetections[originalSignalDetection.id]).toBeDefined();
        expect(
          store.getState().history.signalDetections[originalSignalDetection.id].stack
        ).toHaveLength(1);
      });
    });

    // UNDO ACTION

    const useEventUndoResult = renderHook(() => useEventUndo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => useEventUndoResult.result.current(eventData.id, 1)).not.toThrow();
    });

    await act(async () => useSelectSignalDetectionsResult.waitForNextUpdate());

    act(() => {
      signalDetectionsData.forEach((originalSignalDetection, indx) => {
        const event = store.getState().data.events[eventData.id];
        const eventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
          event,
          store.getState().app.workflow.openIntervalName
        );

        const signalDetection = store.getState().data.signalDetections[originalSignalDetection.id];

        const originalHypothesis = getCurrentHypothesis(
          originalSignalDetection.signalDetectionHypotheses
        );
        const originalPhase = findPhaseFeatureMeasurementValue(
          originalHypothesis.featureMeasurements
        );

        const hypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
        const phase = findPhaseFeatureMeasurementValue(hypothesis.featureMeasurements);

        // only the first SD was associated to the event; so it should only revert back
        expect(isEqual(originalHypothesis, hypothesis)).toEqual(indx === 0);

        const expectedPhase = includes(
          eventHypothesis?.associatedSignalDetectionHypotheses.map(a => a.id.signalDetectionId),
          signalDetection.id
        )
          ? originalPhase.value
          : 'P5KPdf';

        expect(phase.value).toEqual(expectedPhase);

        expect(store.getState().history.signalDetections[originalSignalDetection.id]).toBeDefined();
        expect(
          store.getState().history.signalDetections[originalSignalDetection.id].stack
        ).toHaveLength(1);
      });
    });

    // REDO ACTION

    const useEventRedoResult = renderHook(() => useEventRedo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      expect(() => useEventRedoResult.result.current(eventData.id, 1)).not.toThrow();
    });

    await act(async () => useSelectSignalDetectionsResult.waitForNextUpdate());

    act(() => {
      signalDetectionsData.forEach(originalSignalDetection => {
        const signalDetection = store.getState().data.signalDetections[originalSignalDetection.id];

        const originalHypothesis = getCurrentHypothesis(
          originalSignalDetection.signalDetectionHypotheses
        );
        const originalPhase = findPhaseFeatureMeasurementValue(
          originalHypothesis.featureMeasurements
        );

        const hypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
        const phase = findPhaseFeatureMeasurementValue(hypothesis.featureMeasurements);

        expect(originalHypothesis).not.toEqual(hypothesis);
        expect(originalPhase.value).not.toEqual(phase.value);
        expect(phase.value).toEqual('P5KPdf');
        expect(store.getState().history.signalDetections[originalSignalDetection.id]).toBeDefined();
        expect(
          store.getState().history.signalDetections[originalSignalDetection.id].stack
        ).toHaveLength(1);

        const theSd = signalDetectionDataAfterChange.find(
          sd => sd.id === originalSignalDetection.id
        );
        expect(theSd ? getCurrentHypothesis(theSd.signalDetectionHypotheses) : undefined).toEqual(
          hypothesis
        );
      });
    });
  });
});
