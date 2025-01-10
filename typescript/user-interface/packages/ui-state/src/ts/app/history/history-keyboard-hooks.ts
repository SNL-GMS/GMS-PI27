import type { HotkeyConfig, UseHotkeysReturnValue } from '@blueprintjs/core';
import { useHotkeys } from '@blueprintjs/core';
import type { HotkeyConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import * as React from 'react';

import { selectOpenEventId } from '../api/data/selectors';
import { buildHotkeyConfigArray } from '../api/processing-configuration/processing-config-util';
import { useKeyboardShortcutConfigurations } from '../hooks/processing-analyst-configuration-hooks';
import { useAppSelector } from '../hooks/react-redux-hooks';
import { useEventRedo, useEventUndo, useHistoryMode, useRedo, useUndo } from './history-hooks';

/**
 * @returns provides a callback of handling onKeyUp events that will disable event mode
 */
export const useHistoryEventModeOnKeyUp = (): ((e: KeyboardEvent) => void) => {
  const [, setHistoryMode] = useHistoryMode();
  return React.useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'AltLeft') {
        setHistoryMode('global');
      }
    },
    [setHistoryMode]
  );
};

/**
 * @returns provides a callback of handling onKeyDown events that will enable event mode
 */
export const useHistoryEventModeOnKeyDown = (): ((e: KeyboardEvent) => void) => {
  const [, setHistoryMode] = useHistoryMode();
  const historyEventModeOnKeyDown = useHistoryEventModeOnKeyUp();

  // ensure that the mode is switched back on key up
  React.useEffect(() => {
    document.removeEventListener('keyup', historyEventModeOnKeyDown);
    document.addEventListener('keyup', historyEventModeOnKeyDown);
    return () => {
      document.removeEventListener('keyup', historyEventModeOnKeyDown);
    };
  }, [historyEventModeOnKeyDown]);

  return React.useCallback(() => {
    setHistoryMode('event');
  }, [setHistoryMode]);
};

/**
 * @returns provides a callback of handling onKeyDown events that will undo actions in the history
 */
export const useUndoOnKeyDown = (): ((e: KeyboardEvent) => void) => {
  const undo = useUndo();
  return React.useCallback(() => {
    undo();
  }, [undo]);
};

/**
 * @returns provides a callback of handling onKeyDown events that will redo actions in the history
 */
export const useRedoOnKeyDown = (): ((e: KeyboardEvent) => void) => {
  const redo = useRedo();
  return React.useCallback(() => {
    redo();
  }, [redo]);
};

/**
 * @returns provides a callback of handling onKeyDown events that will undo event actions in the history
 */
export const useEventUndoOnKeyDown = (): ((e: KeyboardEvent) => void) => {
  const eventUndo = useEventUndo();
  const openEventId = useAppSelector(selectOpenEventId);
  return React.useCallback(() => {
    eventUndo(openEventId);
  }, [eventUndo, openEventId]);
};

/**
 * @returns provides a callback of handling onKeyDown events that will redo event actions in the history
 */
export const useEventRedoOnKeyDown = (): ((e: KeyboardEvent) => void) => {
  const eventRedo = useEventRedo();
  const openEventId = useAppSelector(selectOpenEventId);
  return React.useCallback(() => {
    eventRedo(openEventId);
  }, [eventRedo, openEventId]);
};

/**
 * @returns the {@link KeyboardShortcutConfig} for provided key
 */
export const useHistoryKeyboardShortcutConfig = (
  key: 'historyEventMode' | 'undo' | 'redo' | 'eventUndo' | 'eventRedo'
): HotkeyConfiguration | undefined => {
  const keyboardShortcutConfig = useKeyboardShortcutConfigurations();
  return keyboardShortcutConfig && keyboardShortcutConfig.hotkeys
    ? keyboardShortcutConfig.hotkeys[key]
    : undefined;
};

/**
 * @returns the {@link HotkeyConfig} for toggling event history mode
 */
export const useHistoryEventModeHotkeyConfig = (): HotkeyConfig[] => {
  const config = useHistoryKeyboardShortcutConfig('historyEventMode');
  const historyEventModeOnKeyDown = useHistoryEventModeOnKeyDown();
  const historyEventModeOnKeyUp = useHistoryEventModeOnKeyUp();
  return React.useMemo(
    () =>
      buildHotkeyConfigArray(
        config,
        historyEventModeOnKeyDown,
        historyEventModeOnKeyUp,
        false,
        true
      ),
    [config, historyEventModeOnKeyDown, historyEventModeOnKeyUp]
  );
};

/**
 * @returns the {@link HotkeyConfig} for undo
 */
export const useUndoHotkeyConfig = (): HotkeyConfig[] => {
  const config = useHistoryKeyboardShortcutConfig('undo');
  const undoOnKeyDown = useUndoOnKeyDown();
  return React.useMemo(
    () => buildHotkeyConfigArray(config, undoOnKeyDown, undefined, false, true),
    [config, undoOnKeyDown]
  );
};

/**
 * @returns the {@link HotkeyConfig} for redo
 */
export const useRedoHotkeyConfig = (): HotkeyConfig[] => {
  const config = useHistoryKeyboardShortcutConfig('redo');
  const redoOnKeyDown = useRedoOnKeyDown();
  return React.useMemo(
    () => buildHotkeyConfigArray(config, redoOnKeyDown, undefined, false, true),
    [config, redoOnKeyDown]
  );
};

/**
 * @returns the {@link HotkeyConfig} for event undo
 */
export const useEventUndoHotkeyConfig = (): HotkeyConfig[] => {
  const config = useHistoryKeyboardShortcutConfig('eventUndo');
  const eventUndoOnKeyDown = useEventUndoOnKeyDown();
  return React.useMemo(
    () => buildHotkeyConfigArray(config, eventUndoOnKeyDown, undefined, false, true),
    [config, eventUndoOnKeyDown]
  );
};

/**
 * @returns the {@link HotkeyConfig} for event redo
 */
export const useEventRedoHotkeyConfig = (): HotkeyConfig[] => {
  const config = useHistoryKeyboardShortcutConfig('eventRedo');
  const eventRedoOnKeyDown = useEventRedoOnKeyDown();
  return React.useMemo(
    () => buildHotkeyConfigArray(config, eventRedoOnKeyDown, undefined, false, true),
    [config, eventRedoOnKeyDown]
  );
};

/**
 * @returns the {@link HotkeyConfig[]} for undo/redo
 */
export const useUndoRedoHotkeyConfig = (): HotkeyConfig[] => {
  const undoHotkeyConfig = useUndoHotkeyConfig();
  const redoHotkeyConfig = useRedoHotkeyConfig();
  return React.useMemo(() => {
    const config: HotkeyConfig[] = [];
    if (undoHotkeyConfig) {
      config.push(...undoHotkeyConfig);
    }

    if (redoHotkeyConfig) {
      config.push(...redoHotkeyConfig);
    }
    return config;
  }, [undoHotkeyConfig, redoHotkeyConfig]);
};

/**
 * @returns the {@link HotkeyConfig[]} for event undo/redo
 */
export const useEventUndoRedoHotkeyConfig = (): HotkeyConfig[] => {
  const eventUndoHotkeyConfig = useEventUndoHotkeyConfig();
  const eventRedoHotkeyConfig = useEventRedoHotkeyConfig();
  return React.useMemo(() => {
    const config: HotkeyConfig[] = [];
    if (eventUndoHotkeyConfig) {
      config.push(...eventUndoHotkeyConfig);
    }

    if (eventRedoHotkeyConfig) {
      config.push(...eventRedoHotkeyConfig);
    }
    return config;
  }, [eventUndoHotkeyConfig, eventRedoHotkeyConfig]);
};

/**
 * @returns the {@link HotkeyConfig[]} for history actions
 */
export const useHistoryHotkeyConfig = (): HotkeyConfig[] => {
  const historyEventModeHotkeyConfig = useHistoryEventModeHotkeyConfig();
  const undoRedoHotkeyConfig = useUndoRedoHotkeyConfig();
  const eventUndoRedoHotkeyConfig = useEventUndoRedoHotkeyConfig();
  return React.useMemo(() => {
    return [
      ...historyEventModeHotkeyConfig,
      ...undoRedoHotkeyConfig,
      ...eventUndoRedoHotkeyConfig
    ].filter(c => c != null);
  }, [historyEventModeHotkeyConfig, undoRedoHotkeyConfig, eventUndoRedoHotkeyConfig]);
};

/**
 * Sets up and configures the hotkeys for history.
 * Includes: undo, redo, event undo, and event redo
 *
 * @returns the {@link UseHotkeysReturnValue} for undo/redo
 */
export const useHistoryHotKeys = (): UseHotkeysReturnValue => {
  return useHotkeys(useHistoryHotkeyConfig());
};
