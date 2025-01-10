import { combineReducers } from '@reduxjs/toolkit';
import reduceReducers from 'reduce-reducers';

import {
  eventManagerApiSlice,
  processingConfigurationApiSlice,
  processingStationApiSlice,
  signalEnhancementConfigurationApiSlice,
  stationDefinitionSlice,
  systemEventGatewayApiSlice,
  userManagerApiSlice,
  workflowApiSlice
} from './api';
import { dataSlice } from './api/data/data-slice';
import { undoRedoReducer } from './history';
import { historySlice } from './history/history-slice';
import { loaderReducer } from './loader/loader-reducer';
import { reducer as appReducer } from './state/reducer';

const reducers = combineReducers({
  // application api (queries)
  [systemEventGatewayApiSlice.reducerPath]: systemEventGatewayApiSlice.reducer,
  [eventManagerApiSlice.reducerPath]: eventManagerApiSlice.reducer,
  [processingConfigurationApiSlice.reducerPath]: processingConfigurationApiSlice.reducer,
  [processingStationApiSlice.reducerPath]: processingStationApiSlice.reducer,
  [signalEnhancementConfigurationApiSlice.reducerPath]:
    signalEnhancementConfigurationApiSlice.reducer,
  [stationDefinitionSlice.reducerPath]: stationDefinitionSlice.reducer,
  [userManagerApiSlice.reducerPath]: userManagerApiSlice.reducer,
  [workflowApiSlice.reducerPath]: workflowApiSlice.reducer,
  // undo/redo stack and history
  [historySlice.name]: historySlice.reducer,
  // data state
  [dataSlice.name]: dataSlice.reducer,
  // application state
  app: appReducer
});

export const reducer: typeof reducers = reduceReducers(reducers, loaderReducer, undoRedoReducer);
