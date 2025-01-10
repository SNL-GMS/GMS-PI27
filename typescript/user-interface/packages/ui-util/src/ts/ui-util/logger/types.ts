import { isWindowDefined } from '@gms/common-util';

/** the defined logger types */
export enum LoggerType {
  ALL = 'all',
  CONSOLE = 'console',
  LOG4JAVASCRIPT = 'log4javascript'
}

export const windowIsDefined = isWindowDefined();

/**
 * The configured enabled loggers
 * ? Possible values: `all`, 'console', 'log4javascript'
 */
// ! destructuring here causes an issue with webpack and causes the env is always be undefined
// eslint-disable-next-line prefer-destructuring
export const GMS_UI_LOGGERS = process.env.GMS_UI_LOGGERS;
