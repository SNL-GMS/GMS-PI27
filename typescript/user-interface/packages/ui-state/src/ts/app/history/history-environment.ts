import { IS_NODE_ENV_DEVELOPMENT } from '@gms/common-util';

/** returns the environment variable string that is used for history logging and debugging */
export const GMS_HISTORY = 'GMS_HISTORY' as const;

/** returns environment variable setting for the history logging and debugging  */
export const ENV_GMS_HISTORY = process.env[GMS_HISTORY];

/** returns true if the history environment setting is set to debug mode */
export const IS_HISTORY_DEBUG =
  (ENV_GMS_HISTORY !== undefined && ENV_GMS_HISTORY.toLowerCase() === 'debug') ||
  IS_NODE_ENV_DEVELOPMENT;
