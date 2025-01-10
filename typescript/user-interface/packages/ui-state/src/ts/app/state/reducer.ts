import type { CombinedState } from '@reduxjs/toolkit';
import { combineReducers, createReducer } from '@reduxjs/toolkit';
import type { ReducerWithInitialState } from '@reduxjs/toolkit/dist/createReducer';

import { createReplaceEntityReducer } from '../api/create-replace-entity-reducer';
import {
  analystInitialState,
  analystSlice,
  commonInitialState,
  commonSlice,
  waveformInitialState,
  waveformSlice,
  workflowInitialState,
  workflowSlice
} from '.';
import { resetAppState } from './actions';
import type { AnalystState } from './analyst/types';
import type { CommonState } from './common/types';
import type { EventsState } from './events';
import { eventsInitialState, eventsSlice } from './events';
import type { FksState } from './fks';
import { fksInitialState, fksSlice } from './fks';
import type { MapState } from './map';
import { mapInitialState, mapSlice } from './map';
import type { SignalDetectionsState } from './signal-detections';
import { signalDetectionsInitialState, signalDetectionsSlice } from './signal-detections';
import {
  stationPropertiesConfigurationInitialState,
  stationPropertiesConfigurationSlice
} from './station-properties-configuration';
import type { StationPropertiesConfigurationState } from './station-properties-configuration/types';
import type { UserSessionState } from './user-session/types';
import { userSessionInitialState, userSessionSlice } from './user-session/user-session-slice';
import type { WaveformState } from './waveform/types';
import type { WorkflowState } from './workflow/types';

// combine all reducers
const reducers = combineReducers<{
  analyst: AnalystState;
  stationPropertiesConfiguration: StationPropertiesConfigurationState;
  common: CommonState;
  events: EventsState;
  fks: FksState;
  map: MapState;
  signalDetections: SignalDetectionsState;
  userSession: UserSessionState;
  waveform: WaveformState;
  workflow: WorkflowState;
}>({
  [analystSlice.name]: analystSlice.reducer,
  [stationPropertiesConfigurationSlice.name]: stationPropertiesConfigurationSlice.reducer,
  [commonSlice.name]: commonSlice.reducer,
  [eventsSlice.name]: eventsSlice.reducer,
  [fksSlice.name]: fksSlice.reducer,
  [mapSlice.name]: mapSlice.reducer,
  [signalDetectionsSlice.name]: signalDetectionsSlice.reducer,
  [userSessionSlice.name]: userSessionSlice.reducer,
  [waveformSlice.name]: waveformSlice.reducer,
  [workflowSlice.name]: workflowSlice.reducer
});

// Infer the `State` type from the reducer itself
export type State = ReturnType<typeof reducers>;

/**
 * The app initial state
 */
export const initialState: State = {
  [analystSlice.name]: analystInitialState,
  [stationPropertiesConfigurationSlice.name]: stationPropertiesConfigurationInitialState,
  [commonSlice.name]: commonInitialState,
  [eventsSlice.name]: eventsInitialState,
  [fksSlice.name]: fksInitialState,
  [mapSlice.name]: mapInitialState,
  [signalDetectionsSlice.name]: signalDetectionsInitialState,
  [userSessionSlice.name]: userSessionInitialState,
  [waveformSlice.name]: waveformInitialState,
  [workflowSlice.name]: workflowInitialState
};

/**
 * The application state reducer
 *
 * Type inference here was causing errors (it was attempting to export types from third party packages).
 * This caused build errors, which is likely an issue with RTK, immer, or typescript itself. Explicitly
 * typing it here seems to make typescript happy.
 */
export const reducer: ReducerWithInitialState<CombinedState<State>> = createReducer(
  initialState,
  builder => {
    builder
      .addCase(resetAppState, createReplaceEntityReducer(initialState))
      .addDefaultCase(reducers);
  }
);
