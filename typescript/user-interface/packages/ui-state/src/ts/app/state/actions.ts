import { createAction } from '@reduxjs/toolkit';

import type { State } from './reducer';

/**
 * Action used to reset the application state.
 */
export const resetAppState = createAction<State, 'reset/appState'>('reset/appState');
