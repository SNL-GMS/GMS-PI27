import type { $CombinedState } from '@reduxjs/toolkit';

import type { DataState } from '../api';
import {
  dataSlice,
  eventManagerApiSlice,
  processingConfigurationApiSlice,
  processingStationApiSlice,
  signalEnhancementConfigurationApiSlice,
  stationDefinitionSlice,
  systemEventGatewayApiSlice,
  userManagerApiSlice,
  workflowApiSlice
} from '../api';
import { historySlice } from '../history';
import type { AppState } from '../store';
import type { DevToolEnvConfig } from './types';

function getBooleanFromConfig(env: string | undefined): boolean | undefined {
  if (env === 'true') {
    return true;
  }
  if (env === 'false') {
    return false;
  }
  return undefined;
}

/**
 * ! Make sure to add any new env vars to the webpack.config.ts file so that they are picked up and injected
 *
 * Define environment variables that have special, global effects
 * * Default values are set here
 */
export const reduxDevToolsGlobalConfig: Record<string, DevToolEnvConfig> = {
  // If true, this enables all queries and the data slice
  GMS_DEV_TOOLS_ENABLE_QUERIES: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_QUERIES',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_QUERIES) ?? false // * Default value
  },

  // If false, this adds query actions to the deny list if they are not specifically enabled
  GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING) ?? true // * Default value
  },

  // If true, enables the redux logger
  GMS_ENABLE_REDUX_LOGGER: {
    envVar: 'GMS_ENABLE_REDUX_LOGGER',
    enabled: getBooleanFromConfig(process.env.GMS_ENABLE_REDUX_LOGGER) ?? false
  },

  // If true, enables the redux stack trace feature in the dev tools
  GMS_ENABLE_REDUX_TRACE: {
    envVar: 'GMS_ENABLE_REDUX_TRACE',
    enabled: getBooleanFromConfig(process.env.GMS_ENABLE_REDUX_TRACE) ?? false
  },

  // If true, enables redux immutability checks
  GMS_ENABLE_REDUX_IMMUTABLE_CHECK: {
    envVar: 'GMS_ENABLE_REDUX_IMMUTABLE_CHECK',
    enabled: getBooleanFromConfig(process.env.GMS_ENABLE_REDUX_IMMUTABLE_CHECK) ?? false
  },

  // If true, enables redux serialization check
  GMS_ENABLE_REDUX_SERIALIZABLE_CHECK: {
    envVar: 'GMS_ENABLE_REDUX_SERIALIZABLE_CHECK',
    enabled: getBooleanFromConfig(process.env.GMS_ENABLE_REDUX_SERIALIZABLE_CHECK) ?? false
  },

  // if true, disables redux state sync. Note, this may break behavior, and is for development purposes only
  GMS_DISABLE_REDUX_STATE_SYNC: {
    envVar: 'GMS_DISABLE_REDUX_STATE_SYNC',
    enabled: getBooleanFromConfig(process.env.GMS_DISABLE_REDUX_STATE_SYNC) ?? false
  },

  // Totally disables the dev tools
  GMS_DISABLE_REDUX_DEV_TOOLS: {
    envVar: 'GMS_DISABLE_REDUX_DEV_TOOLS',
    enabled: getBooleanFromConfig(process.env.GMS_DISABLE_REDUX_DEV_TOOLS) ?? false
  }
};

/**
 * ! Make sure to add any new env vars to the webpack.config.ts file so that they are picked up and injected
 *
 * If adding a new slice to the redux store, make sure to add an environment variable to control whether it
 * is shown in the dev tools
 *
 * Configuration for each slice. If enabled, the slice will be shown and its actions will be logged.
 * * Default values are set here
 */
export const reduxDevToolsSliceConfig: Record<
  keyof Omit<AppState, typeof $CombinedState>,
  DevToolEnvConfig
> = {
  [systemEventGatewayApiSlice.reducerPath]: {
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_SYSTEM_EVENT_GATEWAY_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    envVar: 'GMS_DEV_TOOLS_ENABLE_SYSTEM_EVENT_GATEWAY_API'
  },
  [eventManagerApiSlice.reducerPath]: {
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_EVENT_MANAGER_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    envVar: 'GMS_DEV_TOOLS_ENABLE_EVENT_MANAGER_API',
    sanitizationMessage: `Set GMS_DEV_TOOLS_ENABLE_EVENT_MANAGER_API=true or GMS_DEV_TOOLS_ENABLE_QUERIES=true to show`
  },
  [processingConfigurationApiSlice.reducerPath]: {
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_PROCESSING_CONFIGURATION_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    envVar: 'GMS_DEV_TOOLS_ENABLE_PROCESSING_CONFIGURATION_API',
    sanitizationMessage: `Set GMS_DEV_TOOLS_ENABLE_PROCESSING_CONFIGURATION_API=true or GMS_DEV_TOOLS_ENABLE_QUERIES=true to show`
  },
  [processingStationApiSlice.reducerPath]: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_PROCESSING_STATION_API',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_PROCESSING_STATION_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    sanitizationMessage: `Set GMS_DEV_TOOLS_ENABLE_QUERIES=true or GMS_DEV_TOOLS_ENABLE_PROCESSING_STATION_API=true to show`
  },
  [signalEnhancementConfigurationApiSlice.reducerPath]: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_SIGNAL_ENHANCEMENT_CONFIGURATION_API',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_SIGNAL_ENHANCEMENT_CONFIGURATION_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    sanitizationMessage: `Set GMS_DEV_TOOLS_ENABLE_QUERIES=true or GMS_DEV_TOOLS_ENABLE_SIGNAL_ENHANCEMENT_CONFIGURATION_API=true to show`
  },
  [stationDefinitionSlice.reducerPath]: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_STATION_DEFINITION_API',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_STATION_DEFINITION_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    sanitizationMessage: `Set GMS_DEV_TOOLS_ENABLE_QUERIES=true or GMS_DEV_TOOLS_ENABLE_STATION_DEFINITION_API=true to show`
  },
  [userManagerApiSlice.reducerPath]: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_USER_MANAGER_API',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_USER_MANAGER_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    sanitizationMessage:
      'Set GMS_DEV_TOOLS_ENABLE_QUERIES=true or GMS_DEV_TOOLS_ENABLE_USER_MANAGER_API=true to show'
  },
  [workflowApiSlice.reducerPath]: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_WORKFLOW_API',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_WORKFLOW_API) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false, // * Default value
    sanitizationMessage: `Set GMS_DEV_TOOLS_ENABLE_QUERIES=true or GMS_DEV_TOOLS_ENABLE_WORKFLOW_API=true to show`
  },
  [historySlice.name]: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_HISTORY',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_HISTORY) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      false // * Default value
  },
  [dataSlice.name]: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA) ||
      reduxDevToolsGlobalConfig.GMS_DEV_TOOLS_ENABLE_QUERIES.enabled ||
      true, // * Default value
    sanitizationMessage: `Set GMS_DEV_TOOLS_ENABLE_QUERIES=true or GMS_DEV_TOOLS_ENABLE_DATA=true to show`
  },
  app: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_APP',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_APP) ?? true // * Default value
  }
};

/**
 * If adding a new section to the `data` section of the store, make sure to add an environment variable to control
 * whether it is shown in the dev tools
 *
 * Configuration for each piece of the data slice. If enabled, that section will be shown and its actions will be logged.
 * * Default values are set here
 */
export const reduxDevToolsDataConfig: Record<keyof DataState, DevToolEnvConfig> = {
  associationConflict: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_ASSOCIATION_CONFLICT',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_ASSOCIATION_CONFLICT) ?? false // * Default value
  },
  beamformingTemplates: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_BEAMFORMING_TEMPLATES',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_BEAMFORMING_TEMPLATES) ?? false // * Default value
  },
  rotationTemplates: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_ROTATION_TEMPLATES',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_ROTATION_TEMPLATES) ?? false // * Default value
  },
  channels: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_CHANNELS',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_CHANNELS) ?? false // * Default value
  },
  defaultFilterDefinitionsMap: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_DEFAULT_FILTER_DEFINITIONS_MAP',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_DEFAULT_FILTER_DEFINITIONS_MAP) ??
      false // * Default value
  },
  events: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_EVENTS',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_EVENTS) ?? false // * Default value
  },
  eventBeams: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_EVENT_BEAMS',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_EVENT_BEAMS) ?? false // * Default value
  },
  filterDefinitions: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS) ?? false // * Default value
  },
  filterDefinitionsForSignalDetections: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS',
    enabled:
      getBooleanFromConfig(
        process.env.GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS
      ) ?? false // * Default value
  },
  fkChannelSegments: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_FK_CHANNEL_SEGMENTS',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_FK_CHANNEL_SEGMENTS) ?? false // * Default value
  },
  fkFrequencyThumbnails: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_FK_FREQUENCY_THUMBNAILS',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_FK_FREQUENCY_THUMBNAILS) ?? false // * Default value
  },
  fkReviewablePhases: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_FK_REVIEWABLE_PHASES',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_FK_REVIEWABLE_PHASES) ?? false // * Default value
  },
  fkSpectraTemplates: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_FK_SPECTRA_TEMPLATES',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_FK_SPECTRA_TEMPLATES) ?? false // * Default value
  },
  predictFeaturesForEventLocation: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_PREDICT_FEATURES_FOR_EVENT_LOCATION',
    enabled:
      getBooleanFromConfig(
        process.env.GMS_DEV_TOOLS_ENABLE_DATA_PREDICT_FEATURES_FOR_EVENT_LOCATION
      ) ?? false // * Default value
  },
  processingMaskDefinitionsByChannels: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_PROCESSING_MASK_DEFINITIONS',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_PROCESSING_MASK_DEFINITIONS) ??
      false // * Default value
  },
  qcSegments: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_QC_SEGMENTS',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_QC_SEGMENTS) ?? false // * Default value
  },
  queries: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_QUERIES',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_QUERIES) ?? false // * Default value
  },
  signalDetections: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_SIGNAL_DETECTIONS',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_SIGNAL_DETECTIONS) ?? false // * Default value
  },
  uiChannelSegments: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_DATA_UI_CHANNEL_SEGMENTS',
    enabled:
      getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_DATA_UI_CHANNEL_SEGMENTS) ?? false // * Default value
  },
  filterDefinitionsForUsage: {
    envVar: 'GMS_DEV_TOOLS_ENABLE_FILTER_DEFINITIONS_MAP',
    enabled: getBooleanFromConfig(process.env.GMS_DEV_TOOLS_ENABLE_FILTER_DEFINITIONS_MAP) ?? false
  }
};

export interface DevToolsConfig {
  reduxDevToolsGlobalConfig: typeof reduxDevToolsGlobalConfig;
  reduxDevToolsSliceConfig: typeof reduxDevToolsSliceConfig;
  reduxDevToolsDataConfig: typeof reduxDevToolsDataConfig;
}

export function updateReduxDevToolsConfig(newConfig: DevToolsConfig) {
  if (!newConfig) {
    return;
  }
  Object.entries(newConfig).forEach(
    ([, configCategory]: [string, Record<string, DevToolEnvConfig>]) => {
      Object.entries(configCategory).forEach(([configKey, config]) => {
        if (Object.prototype.hasOwnProperty.call(reduxDevToolsGlobalConfig, configKey)) {
          reduxDevToolsGlobalConfig[configKey] = config;
        } else if (Object.prototype.hasOwnProperty.call(reduxDevToolsSliceConfig, configKey)) {
          reduxDevToolsSliceConfig[configKey] = config;
        } else if (Object.prototype.hasOwnProperty.call(reduxDevToolsDataConfig, configKey)) {
          reduxDevToolsDataConfig[configKey] = config;
        }
      });
    }
  );
}
