import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import { useAppSelector } from '../../../src/ts/app';
import {
  selectEventRedoPosition,
  selectEventUndoPosition,
  selectEventUndoRedoPositions,
  selectHistory,
  selectRedoPosition,
  selectUndoPosition,
  selectUndoRedoPositions
} from '../../../src/ts/app/history';
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
  it('exists', () => {
    expect(selectHistory).toBeDefined();

    expect(selectUndoPosition).toBeDefined();
    expect(selectRedoPosition).toBeDefined();
    expect(selectUndoRedoPositions).toBeDefined();

    expect(selectEventUndoPosition).toBeDefined();
    expect(selectEventRedoPosition).toBeDefined();
    expect(selectEventUndoRedoPositions).toBeDefined();
  });

  it('can get position for global undo/redo stack when no history exists', () => {
    const store = getStore();

    const result1 = renderHook(() => useAppSelector(selectUndoPosition), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result1.result.current).toMatchInlineSnapshot(`-1`);

    const result2 = renderHook(() => useAppSelector(selectRedoPosition), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result2.result.current).toMatchInlineSnapshot(`0`);

    const result3 = renderHook(() => useAppSelector(selectUndoRedoPositions), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result3.result.current).toMatchInlineSnapshot(`
      [
        -1,
        0,
      ]
    `);
  });

  it('can get position for event undo/redo stack when no history exists', () => {
    const store = getStore();

    const result1 = renderHook(() => useAppSelector(selectEventUndoPosition), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result1.result.current).toMatchInlineSnapshot(`-1`);

    const result2 = renderHook(() => useAppSelector(selectEventRedoPosition), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result2.result.current).toMatchInlineSnapshot(`0`);

    const result3 = renderHook(() => useAppSelector(selectEventUndoRedoPositions), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result3.result.current).toMatchInlineSnapshot(`
      [
        -1,
        0,
      ]
    `);
  });
});
