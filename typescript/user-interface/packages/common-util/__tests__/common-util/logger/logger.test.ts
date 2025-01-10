import { ConsoleLogger } from '../../../src/ts/common-util/logger/console-logger';
import { DEFAULT_LOG_LEVEL, Logger } from '../../../src/ts/common-util/logger/logger';
import { LogLevel } from '../../../src/ts/common-util/logger/types';

describe('logger', () => {
  test('exists', () => {
    expect(Logger).toBeDefined();
    expect(DEFAULT_LOG_LEVEL).toBeDefined();
  });

  test('initialization', () => {
    const logger = Logger.create('test', process.env.test);
    expect(logger.getConfiguredLoggers().size).toEqual(1);

    logger.addConfiguredLogger(ConsoleLogger.Instance());
    expect(logger.getConfiguredLoggers().size).toEqual(2);

    logger.setConfiguredLoggers([]);
    expect(logger.getConfiguredLoggers().size).toEqual(0);

    logger.setConfiguredLoggers([ConsoleLogger.Instance()]);
    expect(logger.getConfiguredLoggers().size).toEqual(1);
  });

  test('logger invalid', () => {
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    const spyInfo = jest.spyOn(console, 'info').mockImplementation();
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    const spyError = jest.spyOn(console, 'error').mockImplementation();

    let logger = Logger.create('test', undefined);
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(0);
    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(1);
    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(1);
    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(1);

    logger = Logger.create('test', '');
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(0);
    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(2);
    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(2);
    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(2);

    logger = Logger.create('test', 'bad');
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(0);
    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(2);
    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(2);
    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(2);

    logger = Logger.create('test', 'debug');
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(1);
    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(3);
    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(3);
    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(3);

    logger = Logger.create('test', 'DEBUG');
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(2);
    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(4);
    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(4);
    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(4);

    spyDebug.mockRestore();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger disabled', () => {
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    const spyInfo = jest.spyOn(console, 'info').mockImplementation();
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    const spyError = jest.spyOn(console, 'error').mockImplementation();

    const logger = Logger.create('test', LogLevel.OFF);
    logger.debug('debug string', 'optional params');
    expect(spyDebug).not.toHaveBeenCalled();
    logger.info('info string', 'optional params');
    expect(spyInfo).not.toHaveBeenCalled();
    logger.warn('warn string', 'optional params');
    expect(spyWarn).not.toHaveBeenCalled();
    logger.error('error string', 'optional params');
    expect(spyError).not.toHaveBeenCalled();

    spyDebug.mockRestore();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger enabled default', () => {
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    const spyInfo = jest.spyOn(console, 'info').mockImplementation();
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    const spyError = jest.spyOn(console, 'error').mockImplementation();

    const logger = Logger.create('test', process.env.test);
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(0);
    logger.debug('debug string', 'optional params');
    expect(spyDebug).toHaveBeenCalledTimes(0);

    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(1);
    logger.info('info string', 'optional params');
    expect(spyInfo).toHaveBeenCalledTimes(2);

    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(1);
    logger.warn('warn string', 'optional params');
    expect(spyWarn).toHaveBeenCalledTimes(2);

    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(1);
    logger.error('error string', 'optional params');
    expect(spyError).toHaveBeenCalledTimes(2);

    spyDebug.mockRestore();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger enabled debug', () => {
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    const spyInfo = jest.spyOn(console, 'info').mockImplementation();
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    const spyError = jest.spyOn(console, 'error').mockImplementation();

    const logger = Logger.create('test', LogLevel.DEBUG);
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(1);
    logger.debug('debug string', 'optional params');
    expect(spyDebug).toHaveBeenCalledTimes(2);

    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(1);
    logger.info('info string', 'optional params');
    expect(spyInfo).toHaveBeenCalledTimes(2);

    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(1);
    logger.warn('warn string', 'optional params');
    expect(spyWarn).toHaveBeenCalledTimes(2);

    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(1);
    logger.error('error string', 'optional params');
    expect(spyError).toHaveBeenCalledTimes(2);

    spyDebug.mockRestore();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger enabled info', () => {
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    const spyInfo = jest.spyOn(console, 'info').mockImplementation();
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    const spyError = jest.spyOn(console, 'error').mockImplementation();

    const logger = Logger.create('test', LogLevel.INFO);
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(0);
    logger.debug('debug string', 'optional params');
    expect(spyDebug).toHaveBeenCalledTimes(0);

    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(1);
    logger.info('info string', 'optional params');
    expect(spyInfo).toHaveBeenCalledTimes(2);

    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(1);
    logger.warn('warn string', 'optional params');
    expect(spyWarn).toHaveBeenCalledTimes(2);

    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(1);
    logger.error('error string', 'optional params');
    expect(spyError).toHaveBeenCalledTimes(2);

    spyDebug.mockRestore();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger enabled warn', () => {
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    const spyInfo = jest.spyOn(console, 'info').mockImplementation();
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    const spyError = jest.spyOn(console, 'error').mockImplementation();

    const logger = Logger.create('test', LogLevel.WARN);
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(0);
    logger.debug('debug string', 'optional params');
    expect(spyDebug).toHaveBeenCalledTimes(0);

    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(0);
    logger.info('info string', 'optional params');
    expect(spyInfo).toHaveBeenCalledTimes(0);

    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(1);
    logger.warn('warn string', 'optional params');
    expect(spyWarn).toHaveBeenCalledTimes(2);

    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(1);
    logger.error('error string', 'optional params');
    expect(spyError).toHaveBeenCalledTimes(2);

    spyDebug.mockRestore();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger enabled error', () => {
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    const spyInfo = jest.spyOn(console, 'info').mockImplementation();
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    const spyError = jest.spyOn(console, 'error').mockImplementation();

    const logger = Logger.create('test', LogLevel.ERROR);
    logger.debug('debug string');
    expect(spyDebug).toHaveBeenCalledTimes(0);
    logger.debug('debug string', 'optional params');
    expect(spyDebug).toHaveBeenCalledTimes(0);

    logger.info('info string');
    expect(spyInfo).toHaveBeenCalledTimes(0);
    logger.info('info string', 'optional params');
    expect(spyInfo).toHaveBeenCalledTimes(0);

    logger.warn('warn string');
    expect(spyWarn).toHaveBeenCalledTimes(0);
    logger.warn('warn string', 'optional params');
    expect(spyWarn).toHaveBeenCalledTimes(0);

    logger.error('error string');
    expect(spyError).toHaveBeenCalledTimes(1);
    logger.error('error string', []);
    expect(spyError).toHaveBeenCalledTimes(2);

    spyDebug.mockRestore();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger time funcs', () => {
    const spyTime = jest.spyOn(console, 'time').mockImplementation();
    const spyTimeEnd = jest.spyOn(console, 'timeEnd').mockImplementation();

    const logger = Logger.create('test', process.env.test);
    logger.time('string');
    logger.timeEnd('string');

    expect(spyTime).toHaveBeenCalledTimes(1);
    expect(spyTimeEnd).toHaveBeenCalledTimes(1);

    spyTime.mockRestore();
    spyTimeEnd.mockRestore();
  });
});
