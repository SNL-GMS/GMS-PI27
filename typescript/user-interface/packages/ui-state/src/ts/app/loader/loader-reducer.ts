import type { Action } from '@reduxjs/toolkit';

import { isLoadStoreAction } from './actions';

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
export function loaderReducer(state, action: Action) {
  if (isLoadStoreAction(action)) {
    if (action.payload) {
      return action.payload;
    }
  }
  return state;
}
