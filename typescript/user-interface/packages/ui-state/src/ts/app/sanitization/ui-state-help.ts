import { IS_NODE_ENV_PRODUCTION } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';

import type { DevToolsConfig } from './config';
import {
  reduxDevToolsDataConfig,
  reduxDevToolsGlobalConfig,
  reduxDevToolsSliceConfig,
  updateReduxDevToolsConfig
} from './config';
import type { DevToolEnvConfig } from './types';
import { getDevToolsConfigLogs } from './util';

const logger = UILogger.create('GMS_LOG_REDUX_STORE', process.env.GMS_LOG_REDUX_STORE || 'info');

const SESSION_STORAGE_ID = 'redux-dev-env-config';

function writeConfigToSessionStorage(config: DevToolsConfig) {
  if (!IS_NODE_ENV_PRODUCTION) {
    sessionStorage.setItem(SESSION_STORAGE_ID, JSON.stringify(config));
  }
}

function readConfigFromSessionStorage() {
  const value = sessionStorage.getItem(SESSION_STORAGE_ID);
  if (value) {
    return JSON.parse(value);
  }
  return undefined;
}

const unsupportedEnvVars = ['NODE_ENV'];

function isUnsupportedSupportedEnvVar(envVar: string) {
  return unsupportedEnvVars.includes(envVar);
}

function setReduxDevToolsConfig(envVar: string, isEnabled: boolean) {
  if (typeof envVar !== 'string') {
    throw new Error(
      'Invalid value for envVar. setReduxDevToolsConfig requires a string environment variable, and a boolean value.'
    );
  }
  if (typeof isEnabled !== 'boolean') {
    throw new Error(
      'Invalid value for isEnabled. setReduxDevToolsConfig requires a string environment variable, and a boolean value.'
    );
  }
  if (isUnsupportedSupportedEnvVar(envVar)) {
    throw new Error(`${envVar} cannot be set using setReduxDevToolsConfig.`);
  }
  const currentConfig: DevToolsConfig = readConfigFromSessionStorage() || {
    reduxDevToolsDataConfig,
    reduxDevToolsGlobalConfig,
    reduxDevToolsSliceConfig
  };

  let success = false;
  Object.entries(currentConfig).forEach(
    ([configCategoryKey, configCategory]: [string, Record<string, DevToolEnvConfig>]) => {
      Object.entries(configCategory).forEach(([configKey, config]) => {
        if (configKey === envVar || config.envVar === envVar) {
          currentConfig[configCategoryKey][configKey].enabled = isEnabled;
          success = true;
        }
      });
    }
  );
  try {
    if (success) {
      writeConfigToSessionStorage(currentConfig);
      logger.info(
        `Config ${envVar} set to ${isEnabled}. Refresh the page to see changes in the redux dev tools.`
      );
    } else {
      throw new Error(`Something went wrong saving ${envVar}`);
    }
  } catch (e) {
    logger.error('Cannot write config value to session storage:', e);
  }
}

const printReduxDevToolsEnvVars = () => {
  logger.info(getDevToolsConfigLogs());
};

export const uiStateHelp = {
  please: () => `
  setReduxDevToolsConfig (envVar, isEnabled)
    envVar is an environment variable to set. isEnabled is a boolean value. These values will last for your session.
    Refreshing the page will reset any values set in this way.

  printReduxDevToolsEnvVars ()
    prints the environment variables that control the Redux DevTools, along with their current values. 
    These values may be changed using setReduxDevToolsConfig.
  `,
  getHelpFunctions: () => ({
    setReduxDevToolsConfig,
    printReduxDevToolsEnvVars
  })
};

if (!IS_NODE_ENV_PRODUCTION) {
  try {
    // actually update the config
    updateReduxDevToolsConfig(readConfigFromSessionStorage());
  } catch (e) {
    logger.error('Cannot load redux dev tools config from session storage', e);
  }
}
