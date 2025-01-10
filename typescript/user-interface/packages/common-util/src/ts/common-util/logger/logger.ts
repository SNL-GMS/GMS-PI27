import Immutable from 'immutable';

import { IS_NODE_ENV_PRODUCTION } from '../environment-util';
import { ConsoleLogger } from './console-logger';
import type { ILogger, LogSettings } from './types';
import { LogLevel, LogOrder } from './types';

/**
 * The default log level.
 * ? If NODE ENV is production set to WARN; otherwise set to INFO
 */
export const DEFAULT_LOG_LEVEL = IS_NODE_ENV_PRODUCTION ? LogLevel.WARN : LogLevel.INFO;

/**
 * The global log level env override
 * ! if this is set it will override all log levels
 */
// ! destructuring here causes an issue with webpack and causes the env is always be undefined
// eslint-disable-next-line prefer-destructuring
export const GMS_LOG_LEVEL = process.env.GMS_LOG_LEVEL;

/**
 * A  logger that provides settings for enabling and disabling logs.
 */
export class Logger implements ILogger {
  /** the unique logger id */
  private readonly id: string;

  /** the log settings */
  private readonly settings: LogSettings;

  /** the logger instances */
  private instances: Immutable.List<ILogger>;

  /**
   * Create a logger instance
   *
   * @param id (optional) the unique id
   * @param level (optional) the unique id
   */
  public static readonly create = (id: string, level: LogLevel | string | undefined): Logger => {
    return new Logger(id, level);
  };

  /**
   * Logger constructor
   *
   * @param id the unique id
   * @param level  the unique id
   */
  private constructor(id: string, level: LogLevel | string | undefined) {
    this.id = id;

    // if the global log level is set then use it as an override; otherwise,
    // use the passed in level if defined; else use DEFAULT_LOG_LEVEL
    const theLevel = GMS_LOG_LEVEL || level?.toLowerCase() || DEFAULT_LOG_LEVEL;

    const order = LogOrder[theLevel.toLocaleUpperCase()];
    this.settings = {
      shouldLogDebug: order >= LogOrder.DEBUG,
      shouldLogInfo: order >= LogOrder.INFO,
      shouldLogWarn: order >= LogOrder.WARN,
      shouldLogError: order >= LogOrder.ERROR
    };
    this.instances = Immutable.List([ConsoleLogger.Instance()]);
  }

  /**
   * Logs a console message with the provided console function
   *
   * @param logFuncs the log functions
   * @param shouldLog true if to log; false otherwise
   * @param message the message
   * @param optionalParams the optional parameters
   */
  private readonly log = (
    logFuncs: Immutable.List<(message: string, ...optionalParameters: unknown[]) => void>,
    message?: string,
    shouldLog = false,
    ...optionalParams: unknown[]
  ) => {
    if (shouldLog) {
      logFuncs.forEach(logFunc => {
        if (optionalParams == null || optionalParams.length === 0) {
          logFunc(`${this.id} ${message}`);
        } else {
          logFunc(`${this.id} ${message}`, { ...optionalParams });
        }
      });
    }
  };

  /**
   * Returns the configured loggers.
   */
  public readonly getConfiguredLoggers = (): Immutable.List<ILogger> => {
    return this.instances;
  };

  /**
   * Sets the configured loggers.
   * ! replaces any previous configured loggers
   */
  public readonly setConfiguredLoggers = (instances: ILogger[]): this => {
    this.instances = Immutable.List(instances);
    return this;
  };

  /**
   * Adds a additional configured logger/
   */
  public readonly addConfiguredLogger = (instance: ILogger): this => {
    this.instances = this.instances.push(instance);
    return this;
  };

  /**
   * The `logger.debug()` function.
   *
   * @param message the message
   * @param optionalParams the optional parameters
   */
  public readonly debug = (message: string, ...optionalParams: unknown[]): void => {
    this.log(
      this.instances.map(instance => instance.debug.bind(this)),
      message,
      this.settings.shouldLogDebug,
      ...optionalParams
    );
  };

  /**
   * The `logger.info()` function.
   *
   * @param message the message
   * @param optionalParams the optional parameters
   */
  public readonly info = (message: string, ...optionalParams: unknown[]): void => {
    this.log(
      this.instances.map(instance => instance.info.bind(this)),
      message,
      this.settings.shouldLogInfo,
      ...optionalParams
    );
  };

  /**
   * The `logger.time()` function.
   *
   * @param label the unique label
   */
  public readonly time = (label: string): void => {
    ConsoleLogger.Instance().time(`${this.id} ${label}`);
  };

  /**
   * The `logger.timeEnd()` function.
   *
   * @param label the unique label
   */
  public readonly timeEnd = (label: string): void => {
    ConsoleLogger.Instance().timeEnd(`${this.id} ${label}`);
  };

  /**
   * The `logger.warn()` function.
   *
   * @param message the message
   * @param optionalParams the optional parameters
   */
  public readonly warn = (message: string, ...optionalParams: unknown[]): void => {
    this.log(
      this.instances.map(instance => instance.warn.bind(this)),
      message,
      this.settings.shouldLogWarn,
      ...optionalParams
    );
  };

  /**
   * The `logger.error()` function.
   *
   * @param message the message
   * @param optionalParams the optional parameters
   */
  public readonly error = (message: string, ...optionalParams: unknown[]): void => {
    this.log(
      this.instances.map(instance => instance.error.bind(this)),
      message,
      this.settings.shouldLogError,
      ...optionalParams
    );
  };
}
