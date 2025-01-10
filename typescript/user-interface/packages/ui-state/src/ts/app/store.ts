import { IS_NODE_ENV_PRODUCTION, NODE_ENV } from '@gms/common-util';
import { getElectron, getElectronEnhancer, UILogger } from '@gms/ui-util';
import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import type { Config } from 'redux-state-sync';
import {
  createStateSyncMiddleware,
  initStateWithPrevTab,
  withReduxStateSync
} from 'redux-state-sync';

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
import { eventConflictMiddleware } from './api/data/event/event-conflict-middleware';
import { populateChannelSegmentsByChannelMiddleware } from './api/middleware/channel-segments-by-channel-middleware';
import { populateEventsWithDetectionsAndSegmentsByTimeMiddleware } from './api/middleware/events-detections-segments-by-time-population-middleware';
import { populateFilterDefinitionsForSignalDetectionsMiddleware } from './api/middleware/filter-definitions-for-signal-detections-population-middleware';
import { populateProcessingMaskDefinitionsMiddleware } from './api/middleware/processing-mask-definitions-population-middleware';
import { populateSignalDetectionsWithSegmentsByStationTimeMiddleware } from './api/middleware/signal-detections-with-segments-by-station-time-middleware';
import {
  eventRemovedMiddleware,
  eventUndoRedoMiddleware,
  historyAddAction,
  historyMiddleware,
  signalDetectionRemovedMiddleware,
  undoRedoMiddleware
} from './history';
import { waveformRemovedMiddleware } from './history/middleware/waveform-removed-middleware';
import { reducer } from './reducer';
import { reduxDevToolsGlobalConfig } from './sanitization';
import { buildDenyList } from './sanitization/deny-list';
import { buildActionSanitizer, sanitizeState } from './sanitization/sanitizers';
import { getDevToolsConfigLogs } from './sanitization/util';
import { userSessionActions } from './state';
import {
  establishWsConnection,
  registerConnectionStatusCallback
} from './subscription/subscription';

const logger = UILogger.create('GMS_LOG_REDUX_STORE', process.env.GMS_LOG_REDUX_STORE || 'info');

const reduxStateSyncConfig: Config = {
  blacklist: [
    // do not sync the history add to prevent duplicates since the middleware is running in all windows
    historyAddAction.type
  ]
};

const buildStore = () => {
  const DISABLE_REDUX_STATE_SYNC = reduxDevToolsGlobalConfig.GMS_DISABLE_REDUX_STATE_SYNC.enabled;

  logger.info(
    `Configuring Redux store with the following properties: \n` +
      `NODE_ENV:${NODE_ENV}\n${getDevToolsConfigLogs()} `
  );

  const store = configureStore({
    reducer: !DISABLE_REDUX_STATE_SYNC ? withReduxStateSync(reducer) : reducer,
    devTools:
      !IS_NODE_ENV_PRODUCTION && !reduxDevToolsGlobalConfig.GMS_DISABLE_REDUX_DEV_TOOLS.enabled
        ? {
            trace: reduxDevToolsGlobalConfig.GMS_ENABLE_REDUX_TRACE.enabled,
            actionsDenylist: buildDenyList(),
            actionSanitizer: buildActionSanitizer<any>(),
            stateSanitizer: sanitizeState
          }
        : false,
    middleware: getDefaultMiddleware => {
      const middlewares = getDefaultMiddleware({
        thunk: true,
        immutableCheck: reduxDevToolsGlobalConfig.GMS_ENABLE_REDUX_IMMUTABLE_CHECK.enabled,
        serializableCheck: reduxDevToolsGlobalConfig.GMS_ENABLE_REDUX_SERIALIZABLE_CHECK.enabled
      })
        // add the listener middleware to the store
        // NOTE: since this can receive actions with functions inside it should go before the serialize check middleware
        // ! the order of the middleware matters and is important!
        .prepend(undoRedoMiddleware.middleware)
        .prepend(eventUndoRedoMiddleware.middleware)
        .prepend(historyMiddleware.middleware)
        .prepend(eventRemovedMiddleware.middleware)
        .prepend(signalDetectionRemovedMiddleware.middleware)
        .prepend(waveformRemovedMiddleware.middleware)
        .prepend(eventConflictMiddleware.middleware)
        .prepend(populateEventsWithDetectionsAndSegmentsByTimeMiddleware.middleware)
        .prepend(populateProcessingMaskDefinitionsMiddleware.middleware)
        .prepend(populateSignalDetectionsWithSegmentsByStationTimeMiddleware.middleware)
        .prepend(populateChannelSegmentsByChannelMiddleware.middleware)
        .prepend(populateFilterDefinitionsForSignalDetectionsMiddleware.middleware)
        // ! custom middlewares must be prepended before this line
        .concat(systemEventGatewayApiSlice.middleware)
        .concat(eventManagerApiSlice.middleware)
        .concat(processingConfigurationApiSlice.middleware)
        .concat(processingStationApiSlice.middleware)
        .concat(signalEnhancementConfigurationApiSlice.middleware)
        .concat(stationDefinitionSlice.middleware)
        .concat(userManagerApiSlice.middleware)
        .concat(workflowApiSlice.middleware);

      if (!DISABLE_REDUX_STATE_SYNC) {
        middlewares.push(createStateSyncMiddleware(reduxStateSyncConfig));
      }

      // ! the logger should always be the last middleware added
      // enable the Redux logger only if `GMS_ENABLE_REDUX_LOGGER` is set to true
      if (reduxDevToolsGlobalConfig.GMS_ENABLE_REDUX_LOGGER.enabled) {
        const reduxLogger = createLogger({
          collapsed: true,
          duration: true,
          timestamp: false,
          level: 'info',
          logger: console,
          logErrors: true,
          diff: false
        });
        middlewares.push(reduxLogger);
      }
      return middlewares;
    },
    enhancers:
      getElectron() && getElectronEnhancer()
        ? [
            // must be placed after the enhancers which dispatch
            // their own actions such as redux-thunk or redux-saga
            getElectronEnhancer()({
              dispatchProxy: a => store.dispatch(a)
            })
          ]
        : []
  });

  // initialize state using any previous state from other tabs
  if (!DISABLE_REDUX_STATE_SYNC) {
    initStateWithPrevTab(store);
  }

  // store is created connect to System Event gateway and set callback to set connection status
  establishWsConnection();
  const updateConnectionStatus = (connected: boolean): void => {
    if (store) {
      store.dispatch(userSessionActions.setConnected(connected));
    }
  };
  registerConnectionStatusCallback(updateConnectionStatus, store.getState().app.userSession);

  return store;
};

export type ReduxStoreType = ReturnType<typeof buildStore>;

export interface GMSWindow extends Window {
  ReduxStore: ReduxStoreType | undefined;
}

const getGmsStore = (): ReturnType<typeof buildStore> => {
  const gmsWindow = window as unknown as GMSWindow;
  // ! ensure that only one Redux store instance is created
  if (gmsWindow.ReduxStore == null) {
    gmsWindow.ReduxStore = buildStore();
  }
  return gmsWindow.ReduxStore;
};

/**
 * Creates the Redux application store, which is stored on the window object in order to avoid any chance for
 * multiple stores to be created (if multiple copies of the module are included in the bundle, for example).
 *
 * @returns the Redux store for the application
 */
export const getStore = (): ReduxStoreType => getGmsStore();

/**
 * Returns the dispatch function of the Redux store/
 *
 * @returns the Redux dispatch function
 */
export const getDispatch = () => getGmsStore().dispatch;

/**
 * The application state.
 * Infer the `AppState` types from the store itself
 */
export type AppState = ReturnType<typeof reducer>;

/**
 * The keys of the application state.
 */
export type AppStateKeys = keyof AppState;

/**
 * The application dispatched (typed).
 * Infer the `AppDispatch` types from the store itself
 */
export type AppDispatch = ReturnType<typeof getDispatch>;
