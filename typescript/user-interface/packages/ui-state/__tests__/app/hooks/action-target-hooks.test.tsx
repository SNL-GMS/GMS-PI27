import {
  eventData,
  openIntervalName,
  signalDetectionsData,
  user
} from '@gms/common-model/__tests__/__data__';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';

import type { AppState } from '../../../src/ts/ui-state';
import {
  getStore,
  useAppDispatch,
  useSetActionType,
  useSetEventActionTargets,
  useSetSignalDetectionActionTargets
} from '../../../src/ts/ui-state';
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
      const state: AppState = appState;
      state.app.userSession.authenticationStatus.userName = user;
      state.app.workflow.openIntervalName = openIntervalName;
      state.app.workflow.openActivityNames = ['AL1 Event Review'];
      state.app.analyst.openEventId = eventData.id;
      state.app.workflow.timeRange = { startTimeSecs: 1669150800, endTimeSecs: 1669154400 };
      state.app.analyst.selectedSdIds = [signalDetectionsData[1].id];
      return stateFunc(state);
    })
  };
});

describe('Action Target Hooks', () => {
  test('all hooks are defined', () => {
    expect(useSetActionType).toBeDefined();
    expect(useSetEventActionTargets).toBeDefined();
    expect(useSetSignalDetectionActionTargets).toBeDefined();
  });
  test('useSetActionType', () => {
    const store = getStore();
    const mockDispatch = useAppDispatch();
    (mockDispatch as unknown as any).mock.calls = [];

    const { result } = renderHook(useSetActionType, {
      wrapper: getTestReduxWrapper(store)
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    act(() => {
      result.current('associate');
    });

    expect((mockDispatch as unknown as any).mock.calls).toEqual([
      [
        {
          payload: 'associate',
          type: 'analyst/setActionType'
        }
      ]
    ]);
  });
  test('useSetSignalDetectionActionTargets', () => {
    const store = getStore();
    const mockDispatch = useAppDispatch();
    (mockDispatch as unknown as any).mock.calls = [];

    const { result } = renderHook(useSetSignalDetectionActionTargets, {
      wrapper: getTestReduxWrapper(store)
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    act(() => {
      result.current(['sdId1']);
    });

    expect((mockDispatch as unknown as any).mock.calls).toEqual([
      [
        {
          payload: ['sdId1'],
          type: 'analyst/setActionTargetSignalDetectionIds'
        }
      ]
    ]);
  });
});
