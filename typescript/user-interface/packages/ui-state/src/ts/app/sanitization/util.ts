import {
  eventManagerApiSlice,
  processingConfigurationApiSlice,
  processingStationApiSlice,
  signalEnhancementConfigurationApiSlice,
  stationDefinitionSlice,
  systemEventGatewayApiSlice,
  userManagerApiSlice,
  workflowApiSlice
} from '../api';
import {
  reduxDevToolsDataConfig,
  reduxDevToolsGlobalConfig,
  reduxDevToolsSliceConfig
} from './config';
import type { DevToolEnvConfig } from './types';

type QuerySlice = Record<string, unknown> & {
  endpoints: Record<string, EndpointSimplified>;
  reducerPath: string;
};

type EndpointSimplified = Record<string, any> & {
  name: string;
};

/** Returns a list of actions that belong to an endpoint */
export const getEndpointNames = (querySlice: QuerySlice) => {
  return Object.values(querySlice.endpoints)
    .map(endpoint => `${querySlice.reducerPath}/${endpoint.name}`)
    .concat([
      `${querySlice.reducerPath}/executeQuery/fulfilled`,
      `${querySlice.reducerPath}/executeQuery/pending`,
      `${querySlice.reducerPath}/queries/queryResultPatched`,
      `${querySlice.reducerPath}/internalSubscriptions/subscriptionsUpdated`,
      `${querySlice.reducerPath}/queries/queryResultPatched`
    ]);
};

/**
 * ! If adding any new env vars to control which actions are in the list, make sure to set that var in the webpack.config file
 *
 * Crete a list of query actions that match some test
 *
 * @param test a function to determine if the action belongs in the list
 * @returns a list of query action strings (as used in redux)
 */
export function buildQueryActionList(test: (s: DevToolEnvConfig) => boolean): string[] {
  if (process.env.GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING === 'true') {
    return [];
  }
  let queryActionList: string[] = [];
  if (test(reduxDevToolsSliceConfig.systemEventGatewayApi)) {
    queryActionList = queryActionList.concat(getEndpointNames(systemEventGatewayApiSlice));
  }
  if (test(reduxDevToolsSliceConfig.eventManagerApi)) {
    queryActionList = queryActionList.concat(getEndpointNames(eventManagerApiSlice));
  }
  if (test(reduxDevToolsSliceConfig.processingConfigurationApi)) {
    queryActionList = queryActionList.concat(getEndpointNames(processingConfigurationApiSlice));
  }
  if (test(reduxDevToolsSliceConfig.processingStationApi)) {
    queryActionList = queryActionList.concat(getEndpointNames(processingStationApiSlice));
  }
  if (test(reduxDevToolsSliceConfig.signalEnhancementConfigurationApi)) {
    queryActionList = queryActionList.concat(
      getEndpointNames(signalEnhancementConfigurationApiSlice)
    );
  }
  if (test(reduxDevToolsSliceConfig.stationDefinitionApi)) {
    queryActionList = queryActionList.concat(getEndpointNames(stationDefinitionSlice));
  }
  if (test(reduxDevToolsSliceConfig.userManagerApi)) {
    queryActionList = queryActionList.concat(getEndpointNames(userManagerApiSlice));
  }
  if (test(reduxDevToolsSliceConfig.workflowApi)) {
    queryActionList = queryActionList.concat(getEndpointNames(workflowApiSlice));
  }
  return queryActionList;
}

/**
 * Returns a string that shows the dev tools configuration environment variables used by the UI
 */
export const getDevToolsConfigLogs = () => {
  return Object.entries({
    ...reduxDevToolsGlobalConfig,
    ...reduxDevToolsSliceConfig,
    ...reduxDevToolsDataConfig
  }).reduce((logStr, [, config]) => {
    return `${logStr}${config.envVar}: ${config.enabled} \n`;
  }, '');
};
