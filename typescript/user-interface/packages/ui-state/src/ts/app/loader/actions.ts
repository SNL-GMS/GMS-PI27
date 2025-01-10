import type { Action } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { AppState } from '../store';

/** The load store action unique identifier */
export const loadStoreAction = 'loader/loadStore' as const;

/**
 * Action used to load and store application state.
 */
export const loadStore = createAction<AppState, typeof loadStoreAction>(loadStoreAction);

/**
 * Returns true if the action is of type {@link loadStore}.
 */
export const isLoadStoreAction = (action: Action): action is ReturnType<typeof loadStore> =>
  action.type === loadStoreAction;
