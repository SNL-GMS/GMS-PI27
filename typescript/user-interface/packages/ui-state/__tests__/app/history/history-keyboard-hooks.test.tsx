import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { analystActions } from '../../../src/ts/app';
import {
  useEventRedoHotkeyConfig,
  useEventRedoOnKeyDown,
  useEventUndoHotkeyConfig,
  useEventUndoOnKeyDown,
  useEventUndoRedoHotkeyConfig,
  useHistoryHotkeyConfig,
  useHistoryHotKeys,
  useRedoHotkeyConfig,
  useRedoOnKeyDown,
  useUndoHotkeyConfig,
  useUndoOnKeyDown,
  useUndoRedoHotkeyConfig
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

jest.mock('../../../src/ts/app/hooks/processing-analyst-configuration-hooks', () => {
  const actual = jest.requireActual(
    '@gms/ui-state/src/ts/app/hooks/processing-analyst-configuration-hooks'
  );

  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    )
  };
});

describe('history hooks', () => {
  beforeAll(() => {
    mockDispatch.mockClear();
  });

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('exists', () => {
    expect(useUndoOnKeyDown).toBeDefined();
    expect(useRedoOnKeyDown).toBeDefined();
    expect(useEventUndoOnKeyDown).toBeDefined();
    expect(useEventRedoOnKeyDown).toBeDefined();

    expect(useUndoHotkeyConfig).toBeDefined();
    expect(useRedoHotkeyConfig).toBeDefined();
    expect(useEventUndoHotkeyConfig).toBeDefined();
    expect(useEventRedoHotkeyConfig).toBeDefined();

    expect(useUndoRedoHotkeyConfig).toBeDefined();
    expect(useEventUndoRedoHotkeyConfig).toBeDefined();

    expect(useHistoryHotkeyConfig).toBeDefined();
    expect(useHistoryHotKeys).toBeDefined();
  });

  describe('callbacks', () => {
    beforeAll(() => {
      mockDispatch.mockClear();
    });

    beforeEach(() => {
      mockDispatch.mockClear();
    });

    it('useUndoOnKeyDown', async () => {
      const store = getStore();

      const { result } = renderHook(() => useUndoOnKeyDown(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });

      await act(() => {
        result.current({} as any);
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        payload: 1,
        type: 'history/undo'
      });
    });

    it('useRedoOnKeyDown', async () => {
      const store = getStore();

      const { result } = renderHook(() => useRedoOnKeyDown(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });

      await act(() => {
        result.current({} as any);
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        payload: 1,
        type: 'history/redo'
      });
    });

    it('useEventUndoOnKeyDown', async () => {
      const store = getStore();

      const { result } = renderHook(() => useEventUndoOnKeyDown(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });

      await act(() => {
        store.dispatch(analystActions.setOpenEventId(''));
      });

      await act(() => {
        result.current({} as any);
      });
      expect(mockDispatch).not.toHaveBeenCalled();

      await act(() => {
        store.dispatch(analystActions.setOpenEventId('my-id'));
      });

      await act(() => {
        result.current({} as any);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        payload: {
          decrement: 1,
          eventId: 'my-id'
        },
        type: 'history/eventUndo'
      });
    });

    it('useEventRedoOnKeyDown', async () => {
      const store = getStore();

      const { result } = renderHook(() => useEventRedoOnKeyDown(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });

      await act(() => {
        store.dispatch(analystActions.setOpenEventId(''));
      });

      await act(() => {
        result.current({} as any);
      });

      expect(mockDispatch).not.toHaveBeenCalled();

      await act(() => {
        store.dispatch(analystActions.setOpenEventId('my-id2'));
      });

      await act(() => {
        result.current({} as any);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        payload: {
          increment: 1,
          eventId: 'my-id2'
        },
        type: 'history/eventRedo'
      });
    });
  });

  describe('configs', () => {
    it('useUndoHotkeyConfig', () => {
      const store = getStore();

      const { result } = renderHook(() => useUndoHotkeyConfig(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "combo": "mod+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Undo previous action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
        ]
      `);
    });

    it('useRedoHotkeyConfig', () => {
      const store = getStore();

      const { result } = renderHook(() => useRedoHotkeyConfig(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "combo": "shift+mod+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Redo previous undone action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
        ]
      `);
    });

    it('useEventUndoHotkeyConfig', () => {
      const store = getStore();

      const { result } = renderHook(() => useEventUndoHotkeyConfig(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "combo": "alt+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Undo previous event action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
        ]
      `);
    });

    it('useEventRedoHotkeyConfig', () => {
      const store = getStore();

      const { result } = renderHook(() => useEventRedoHotkeyConfig(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "combo": "alt+shift+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Redo previous undone event action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
        ]
      `);
    });
  });

  describe('hotkeys config', () => {
    it('useUndoRedoHotkeyConfig', () => {
      const store = getStore();

      const { result } = renderHook(() => useUndoRedoHotkeyConfig(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "combo": "mod+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Undo previous action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
          {
            "combo": "shift+mod+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Redo previous undone action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
        ]
      `);
    });

    it('useEventUndoRedoHotkeyConfig', () => {
      const store = getStore();

      const { result } = renderHook(() => useEventUndoRedoHotkeyConfig(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "combo": "alt+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Undo previous event action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
          {
            "combo": "alt+shift+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Redo previous undone event action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
        ]
      `);
    });

    it('useHistoryHotkeyConfig', () => {
      const store = getStore();

      const { result } = renderHook(() => useHistoryHotkeyConfig(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "combo": "alt",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Toggle event mode for history undo/redo",
            "onKeyDown": [Function],
            "onKeyUp": [Function],
          },
          {
            "combo": "mod+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Undo previous action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
          {
            "combo": "shift+mod+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Redo previous undone action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
          {
            "combo": "alt+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Undo previous event action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
          {
            "combo": "alt+shift+z",
            "disabled": false,
            "global": true,
            "group": "App",
            "label": "Redo previous undone event action",
            "onKeyDown": [Function],
            "onKeyUp": undefined,
          },
        ]
      `);
    });

    it('useHistoryHotKeys', () => {
      const store = getStore();

      const { result } = renderHook(() => useHistoryHotKeys(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toMatchInlineSnapshot(`
        {
          "handleKeyDown": [Function],
          "handleKeyUp": [Function],
        }
      `);
    });
  });
});
