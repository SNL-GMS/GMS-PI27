import { analystActions } from '../state';
import { reduxDevToolsGlobalConfig } from './config';
import type { DevToolEnvConfig } from './types';
import { buildQueryActionList } from './util';

function isDenied(s: DevToolEnvConfig) {
  return (
    !reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING.enabled && !s.enabled
  );
}

/**
 * Creates a deny list based on the DEV_TOOLS environment variables. Denied actions do not appear in the
 * redux dev tools.
 *
 * Actions are not denied by default.
 *
 * API actions are denied if `GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING === 'false'`. Individual actions may
 * be overridden by setting that individual DEV_TOOLS environment variable to `true` for that api slice.
 *
 * Because the webpack plugin that injects our environment variables does a simple find/replace
 * for `process.env.ENV_VAR_NAME`, it is not possible to reference these variables by indexing into process.env.
 * For example, DOES NOT WORK: `process.env['ENV_VAR_NAME'] // always undefined`
 *
 * NOTE: This is run when creating the store.
 */
export function buildDenyList() {
  let denyList = buildQueryActionList(isDenied);
  if (process.env.GMS_DEV_TRACK_LOADING_ACTIONS !== 'true') {
    denyList.push(analystActions.trackPendingRequests.type);
    denyList.push(analystActions.trackCompletedRequests.type);
  }
  denyList = denyList.filter(val => val !== 'actionCreator');
  return denyList;
}
