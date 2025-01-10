import type { Action } from 'redux';

import {
  reduxDevToolsDataConfig,
  reduxDevToolsGlobalConfig,
  reduxDevToolsSliceConfig
} from './config';
import type { DevToolEnvConfig } from './types';
import { buildQueryActionList } from './util';

/**
 * ! This is run frequently! However, it is only ever run in development mode. Still, it should be made as fast as possible.
 * This is run on every action.
 *
 * Takes the redux store and overwrites fields that are sanitized by default, allowing developers to control what is stored in the dev tools.
 *
 * @param state The Redux state. Using the any type lets developers overwrite the slice with something that doesn't
 * match the type expected. This is safe to do in this case because it is only used by the dev tools. This has
 * no effect on the actual data stored in redux, only on what is shown in the dev tools.
 */
export const sanitizeState = (state: any) => {
  const sanitizedState = { ...state, data: { ...state.data } };

  Object.entries(reduxDevToolsSliceConfig).forEach(([sliceName, config]) => {
    if (!config.enabled) {
      sanitizedState[sliceName] = {
        sanitized: config.sanitizationMessage ?? `Set ${config.envVar}=true to show`
      };
    }
  });
  if (reduxDevToolsSliceConfig.data.enabled) {
    Object.entries(reduxDevToolsDataConfig).forEach(([dataName, config]) => {
      if (!config.enabled) {
        sanitizedState.data[dataName] = {
          sanitized: config.sanitizationMessage ?? `Set ${config.envVar}=true to show`
        };
      }
    });
  }
  return sanitizedState;
};

const isActionSanitizedForSlice = (sliceEnv: DevToolEnvConfig) => {
  return !sliceEnv?.enabled;
};

/**
 * ! This is run frequently! However, it is only ever run in development mode. Still, it should be made as fast as possible.
 *
 * Higher order function that takes in a list of action string (as represented in the redux dev tools)
 * and builds a sanitizer function to sanitize those actions.
 *
 * Sanitized actions will have a payload set to a string, indicating that they have been sanitized.
 * NOTE: This will not affect the actual redux store, just hte dev tools representation of the actions.
 *
 * @param actionsToSanitize a list of actions that should be sanitized.
 * @returns a function that takes a redux action and overwrites the payload if it is set to be sanitized,
 * allowing developers to control what is stored in the dev tools.
 */
export function buildActionSanitizer<A extends Action<any>>() {
  // if we are disabling action tracking (ie, it is on the deny list), then don't waste time trying to sanitize it
  if (!reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING.enabled) {
    return action => action; // don't sanitize anything
  }

  const actionsToSanitize = buildQueryActionList(isActionSanitizedForSlice);
  const sanitizationRecord = {};
  actionsToSanitize.forEach(actionToSanitize => {
    sanitizationRecord[actionToSanitize] = true;
  });
  return (action: A) => {
    if (sanitizationRecord[action.type]) {
      return {
        ...action,
        meta: undefined,
        payload:
          'Sanitized. Enable the appropriate env var to see this action. See the API slices in the Redux DevTools State section for configured env vars'
      };
    }
    return action;
  };
}
