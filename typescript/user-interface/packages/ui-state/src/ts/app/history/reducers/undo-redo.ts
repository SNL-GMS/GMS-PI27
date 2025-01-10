import type { Action } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import { applyPatches, type Patch } from 'immer';

/** The undo/redo action unique identifier */
export const undoRedoAction = 'undoRedo' as const;

/**
 * Action used to undo/redo part of the application state.
 */
export const undoRedo = createAction<Patch[], typeof undoRedoAction>(undoRedoAction);

/**
 * Returns true if the action is of type {@link undoRedo}.
 */
export const isUndoRedoAction = (action: Action): action is ReturnType<typeof undoRedo> =>
  action.type === undoRedoAction;

/**
 * Redux reducer that accepts the action {@link undoRedo} and applies the {@link Patch}s
 * to the current state.
 *
 * !Performs the undo/redo action on the state store.
 *
 * @param state the current state
 * @param action the action {@link PayloadAction} with a payload of type {@link Patch[]}
 * @returns
 */
export function undoRedoReducer(state, action: Action) {
  if (isUndoRedoAction(action)) {
    if (action.payload.length > 0) {
      return applyPatches(state, action.payload);
    }
  }
  return state;
}
