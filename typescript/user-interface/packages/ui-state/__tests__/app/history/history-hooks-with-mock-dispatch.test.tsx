/* eslint-disable @typescript-eslint/no-magic-numbers */
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import {
  useEventRedo,
  useEventUndo,
  useHistoryUndoRedo,
  useRedo,
  useUndo,
  useUndoRedoPosition
} from '../../../src/ts/app/history';
import type { ReduxStoreType } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';

const mockDispatch = jest.fn();

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  return {
    ...actual,
    useAppDispatch: () => mockDispatch
  };
});

describe('history hooks', () => {
  let store: ReduxStoreType;

  beforeEach(() => {
    store = getStore();
  });

  it('exists', () => {
    expect(useUndo).toBeDefined();
    expect(useRedo).toBeDefined();
    expect(useEventUndo).toBeDefined();
    expect(useEventRedo).toBeDefined();
    expect(useHistoryUndoRedo).toBeDefined();
  });

  it('useUndo', () => {
    const { result } = renderHook(() => useUndo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      result.current(2);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: 2,
      type: 'history/undo'
    });
  });

  it('useRedo', () => {
    const { result } = renderHook(() => useRedo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      result.current(3);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: 3,
      type: 'history/redo'
    });
  });

  it('useEventUndo', () => {
    const { result } = renderHook(() => useEventUndo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      result.current('my-id', 2);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        decrement: 2,
        eventId: 'my-id'
      },
      type: 'history/eventUndo'
    });
  });

  it('useEventRedo', () => {
    const { result } = renderHook(() => useEventRedo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      result.current('my-id', 3);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        increment: 3,
        eventId: 'my-id'
      },
      type: 'history/eventRedo'
    });
  });

  it('useHistoryUndoRedo', () => {
    const resultUseHistoryUndoRedoPosition = renderHook(() => useUndoRedoPosition(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    expect(resultUseHistoryUndoRedoPosition.result.current[0]).toEqual(-1);
    expect(resultUseHistoryUndoRedoPosition.result.current[1]).toEqual(0);
    expect(resultUseHistoryUndoRedoPosition.result.current[2]).toBeFalsy();
    expect(resultUseHistoryUndoRedoPosition.result.current[3]).toBeFalsy();
    const resultUseHistoryUndoRedo = renderHook(() => useHistoryUndoRedo(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    expect(resultUseHistoryUndoRedo.result.current[0]).toBeDefined();
    expect(resultUseHistoryUndoRedo.result.current[1]).toBeDefined();
    expect(resultUseHistoryUndoRedo.result.current[2]).toBeDefined();
    expect(resultUseHistoryUndoRedo.result.current[3]).toBeDefined();
    expect(resultUseHistoryUndoRedo.result.current[4]).toBeFalsy();
    expect(resultUseHistoryUndoRedo.result.current[5]).toEqual(-1);
    expect(resultUseHistoryUndoRedo.result.current[6]).toEqual(0);
    expect(resultUseHistoryUndoRedo.result.current[7]).toBeFalsy();
    expect(resultUseHistoryUndoRedo.result.current[8]).toBeFalsy();
  });
});
