import {
  eventData,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { AnalysisMode } from '@gms/common-model/lib/workflow/types';
import type { AppState, ReduxStoreType } from '@gms/ui-state';
import {
  addEvents,
  addSignalDetections,
  analystActions,
  getStore,
  setAppAuthenticationStatus,
  workflowSlice
} from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { HistoryStack, useHistory } from '~analyst-ui/components/history/history-stack';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    ),
    useHistoryKeyboardShortcutConfig: jest.fn(
      (key: string) => processingAnalystConfigurationData.keyboardShortcuts.hotkeys[key]
    ),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      state.history = {
        mode: 'global',
        stack: [
          {
            id: 'h1',
            historyId: `1`,
            label: 'label 1',
            description: 'desc 1',
            patches: [],
            inversePatches: [],
            status: 'applied',
            time: 1,
            type: 'data/updateArrivalTimeSignalDetection',
            conflictStatus: 'none',
            isDeletion: false,
            isRejection: false
          },
          {
            id: 'h2',
            historyId: `2`,
            label: 'label 2',
            description: 'desc 2',
            patches: [],
            inversePatches: [],
            status: 'applied',
            time: 1,
            type: 'data/associateSignalDetectionsToEvent',
            conflictStatus: 'none',
            isDeletion: false,
            isRejection: false
          }
        ],
        events: {
          e1: {
            stack: [
              {
                id: 'e1',
                historyId: `1`,
                label: 'label 1',
                description: 'desc 1',
                patches: [],
                inversePatches: [],
                status: 'applied',
                time: 1,
                type: 'data/updateArrivalTimeSignalDetection',
                conflictStatus: 'resolved conflict',
                associatedIds: {
                  events: { e1: true },
                  signalDetections: { s1: true }
                },
                isDeletion: false,
                isRejection: false
              }
            ]
          },
          e2: {
            stack: [
              {
                id: 'e2',
                historyId: `2`,
                label: 'label 2',
                description: 'desc 2',
                patches: [],
                inversePatches: [],
                status: 'applied',
                time: 1,
                type: 'data/associateSignalDetectionsToEvent',
                conflictStatus: 'created conflict',
                associatedIds: {
                  events: { e2: true },
                  signalDetections: { s2: true, s3: true }
                },
                isDeletion: false,
                isRejection: false
              }
            ]
          }
        },
        signalDetections: {
          s1: {
            stack: [
              {
                id: 's1',
                historyId: `1`,
                label: 'label 1',
                description: 'desc 1',
                patches: [],
                inversePatches: [],
                status: 'applied',
                time: 1,
                type: 'data/updateArrivalTimeSignalDetection',
                conflictStatus: 'none',
                associatedIds: {
                  events: { e1: true },
                  signalDetections: { s1: true }
                },
                isDeletion: false,
                isRejection: false
              }
            ]
          },
          s2: {
            stack: [
              {
                id: 's2',
                historyId: `2`,
                label: 'label 2',
                description: 'desc 2',
                patches: [],
                inversePatches: [],
                status: 'applied',
                time: 1,
                type: 'data/associateSignalDetectionsToEvent',
                conflictStatus: 'created conflict',
                associatedIds: {
                  events: { e2: true },
                  signalDetections: { s2: true }
                },
                isDeletion: false,
                isRejection: false
              }
            ]
          },
          s3: {
            stack: [
              {
                id: 's2',
                historyId: `2`,
                label: 'label 2',
                description: 'desc 2',
                patches: [],
                inversePatches: [],
                status: 'applied',
                time: 1,
                type: 'data/associateSignalDetectionsToEvent',
                conflictStatus: 'created conflict',
                associatedIds: {
                  events: { e2: true },
                  signalDetections: { s3: true }
                },
                isDeletion: true,
                isRejection: true
              }
            ]
          }
        }
      };
      return stateFunc(state);
    })
  };
});

describe('history stack', () => {
  let store: ReduxStoreType;

  beforeEach(() => {
    store = getStore();

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
  it('exists', () => {
    expect(HistoryStack).toBeDefined();
    expect(useHistory).toBeDefined();
  });

  it('can get correct history', () => {
    const useHistoryResult = renderHook(() => useHistory(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(useHistoryResult.result).toMatchSnapshot();
  });

  it('can render history stack', () => {
    const { container } = render(
      <Provider store={store}>
        <HistoryStack />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
