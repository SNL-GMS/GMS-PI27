import * as React from 'react';

import { selectOpenEventId } from '../api/data/selectors';
import { useAppDispatch, useAppSelector } from '../hooks/react-redux-hooks';
import {
  selectEventUndoRedoPositions,
  selectHistoryMode,
  selectHistorySize,
  selectUndoRedoPositions
} from './history-selectors';
import type { HistoryMode } from './history-slice';
import { historyActions } from './history-slice';
import { historyEventRedoAction, historyEventRedoByIdAction } from './reducers/event-redo';
import { historyEventUndoAction, historyEventUndoByIdAction } from './reducers/event-undo';
import { historyRedoAction, historyRedoByIdAction } from './reducers/redo';
import { historyUndoAction, historyUndoByIdAction } from './reducers/undo';

/**
 * @returns provides the history mode, a callback that can be used to toggle the history mode, and
 * a boolean flag that indicates if event mode is enabled or not
 */
export const useHistoryMode = (): [HistoryMode, (mode?: HistoryMode) => void, boolean] => {
  const dispatch = useAppDispatch();
  const openEventId = useAppSelector(selectOpenEventId);
  const historyMode = useAppSelector(selectHistoryMode);
  const setHistoryMode = React.useCallback(
    (mode?: HistoryMode) => {
      dispatch(historyActions.setHistoryMode(mode as never));
    },
    [dispatch]
  );
  const isEventMode = React.useMemo(
    () => historyMode === 'event' && !!openEventId,
    [historyMode, openEventId]
  );
  return [historyMode, setHistoryMode, isEventMode];
};

/**
 * @returns returns the undo and redo positions
 */
export const useUndoRedoPosition = (): [number, number, boolean, boolean] => {
  const historySize = useAppSelector(selectHistorySize);
  const [undoPosition, redoPosition] = useAppSelector(selectUndoRedoPositions);

  return React.useMemo(() => {
    const canUndo = undoPosition > -1;
    const canRedo = redoPosition < historySize;
    return [undoPosition, redoPosition, canUndo, canRedo];
  }, [redoPosition, undoPosition, historySize]);
};

/**
 * @returns returns the event undo and redo positions
 */
const useEventUndoRedoPosition = (): [number, number, boolean, boolean] => {
  const [, , isEventMode] = useHistoryMode();
  const historySize = useAppSelector(selectHistorySize);
  const [eventUndoPosition, eventRedoPosition] = useAppSelector(selectEventUndoRedoPositions);
  return React.useMemo(() => {
    if (isEventMode) {
      const canUndo = eventUndoPosition > -1;
      const canRedo = eventRedoPosition < historySize;
      return [eventUndoPosition, eventRedoPosition, canUndo, canRedo];
    }
    return [-1, historySize, false, false];
  }, [isEventMode, eventUndoPosition, eventRedoPosition, historySize]);
};

/**
 * @returns provides a callback that can be used to undo actions on the history
 */
export const useUndo = (): ((decrement?: number) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (decrement = 1) => {
      dispatch(historyUndoAction(decrement));
    },
    [dispatch]
  );
};

/**
 * @returns provides a callback that can be used to undo actions on the history by id
 */
export const useUndoById = (): ((id: string) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (id: string) => {
      dispatch(historyUndoByIdAction(id));
    },
    [dispatch]
  );
};

/**
 * @returns provides a callback that can be used to redo actions on the history
 */
export const useRedo = (): ((increment?: number) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (increment = 1) => {
      dispatch(historyRedoAction(increment));
    },
    [dispatch]
  );
};

/**
 * @returns provides a callback that can be used to redo actions on the history by id
 */
export const useRedoById = (): ((id: string) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (id: string) => {
      dispatch(historyRedoByIdAction(id));
    },
    [dispatch]
  );
};

/**
 * @returns provides a callback that can be used to undo event actions on the history
 */
export const useEventUndo = (): ((eventId: string, decrement?: number) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (eventId: string, decrement = 1) => {
      if (eventId) {
        dispatch(historyEventUndoAction({ eventId, decrement }));
      }
    },
    [dispatch]
  );
};

/**
 * @returns provides a callback that can be used to undo event actions on the history by id
 */
export const useEventUndoById = (): ((eventId: string, id: string) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (eventId: string, id: string) => {
      dispatch(historyEventUndoByIdAction({ eventId, id }));
    },
    [dispatch]
  );
};

/**
 * @returns provides a callback that can be used to redo event actions on the history
 */
export const useEventRedo = (): ((eventId: string, increment?: number) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (eventId: string, increment = 1) => {
      if (eventId) {
        dispatch(historyEventRedoAction({ eventId, increment }));
      }
    },
    [dispatch]
  );
};

/**
 * @returns provides a callback that can be used to redo event actions on the history by id
 */
export const useEventRedoById = (): ((eventId: string, id: string) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (eventId: string, id: string) => {
      dispatch(historyEventRedoByIdAction({ eventId, id }));
    },
    [dispatch]
  );
};

/**
 * @returns returns the undo and redo positions based on the current history mode and state
 */
const useHistoryUndoRedoPosition = (): [number, number, boolean, boolean] => {
  const [, , isEventMode] = useHistoryMode();
  const undoRedoPosition = useUndoRedoPosition();
  const eventUndoRedoPosition = useEventUndoRedoPosition();
  return React.useMemo(() => {
    if (isEventMode) {
      return eventUndoRedoPosition;
    }
    return undoRedoPosition;
  }, [eventUndoRedoPosition, isEventMode, undoRedoPosition]);
};

/**
 * @returns the history undo/redo and the callbacks for the undo/redo functions based on the current history mode and state
 */
export const useHistoryUndoRedo = (): [
  (decrement?: number) => void,
  (id: string) => void,
  (decrement?: number) => void,
  (id: string) => void,
  boolean,
  number,
  number,
  boolean,
  boolean
] => {
  const [, , isEventMode] = useHistoryMode();
  const openEventId = useAppSelector(selectOpenEventId);
  const undo = useUndo();
  const undoById = useUndoById();
  const redo = useRedo();
  const redoById = useRedoById();
  const eventUndo = useEventUndo();
  const eventUndoById = useEventUndoById();
  const eventRedo = useEventRedo();
  const eventRedoById = useEventRedoById();
  const [undoPosition, redoPosition, canUndo, canRedo] = useHistoryUndoRedoPosition();

  const theUndo = React.useCallback(
    (decrement = 1) => {
      if (canUndo) {
        if (isEventMode) {
          eventUndo(openEventId, decrement);
        } else {
          undo(decrement);
        }
      }
    },
    [isEventMode, canUndo, eventUndo, openEventId, undo]
  );

  const theUndoById = React.useCallback(
    (id: string) => {
      if (canUndo) {
        if (isEventMode) {
          eventUndoById(openEventId, id);
        } else {
          undoById(id);
        }
      }
    },
    [canUndo, isEventMode, eventUndoById, openEventId, undoById]
  );

  const theRedo = React.useCallback(
    (increment = 1) => {
      if (canRedo) {
        if (isEventMode) {
          eventRedo(openEventId, increment);
        } else {
          redo(increment);
        }
      }
    },
    [canRedo, isEventMode, eventRedo, openEventId, redo]
  );

  const theRedoById = React.useCallback(
    (id: string) => {
      if (canRedo) {
        if (isEventMode) {
          eventRedoById(openEventId, id);
        } else {
          redoById(id);
        }
      }
    },
    [canRedo, isEventMode, eventRedoById, openEventId, redoById]
  );

  return [
    theUndo,
    theUndoById,
    theRedo,
    theRedoById,
    isEventMode,
    undoPosition,
    redoPosition,
    canUndo,
    canRedo
  ];
};
