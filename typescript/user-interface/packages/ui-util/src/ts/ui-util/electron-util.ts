import { isWindowDefined } from '@gms/common-util';

import { UILogger } from './logger';

declare let require: any;

const logger = UILogger.create('GMS_LOG_ELECTRON_UTIL', process.env.GMS_LOG_ELECTRON_UTIL);

/**
 * Returns true if running in Electron Main Process; false otherwise.
 */
export const isElectronMainProcess = (): boolean => {
  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!(process.versions as any).electron
  ) {
    return true;
  }
  return false;
};

/**
 * Returns true if running in Electron Renderer Process; false otherwise.
 */
export const isElectronRendererProcess = (): boolean => {
  // Renderer process
  if (
    isWindowDefined() &&
    typeof (window as any).process === 'object' &&
    (window as any).process.type === 'renderer'
  ) {
    return true;
  }
  return false;
};

/**
 * Returns true if running in Electron; false otherwise.
 */
export const isElectron = (): boolean => {
  // Renderer process
  if (isElectronRendererProcess()) {
    logger.debug(`Running in electron main process`);
    return true;
  }

  // Main process
  if (isElectronMainProcess()) {
    logger.debug(`Running in electron renderer process`);
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    logger.debug(`Running in electron in node integration`);
    return true;
  }

  logger.debug(`Not running in electron`);
  return false;
};

/**
 * Returns the electron instance; undefined if not running in electron.
 */
export const getElectron = (): any => {
  try {
    if (isElectron()) {
      try {
        logger.info(`Running in electron, attempting to 'require electron'`);
        const electron = require('electron');
        if (typeof electron !== 'undefined') {
          return electron;
        }
      } catch (error) {
        logger.error(`Failed to require electron: ${error}`);
      }
    }
  } catch {
    /* no-op */
  }
  return undefined;
};

/**
 * Returns the electron enhancer instance; undefined if not running in electron.
 */
export const getElectronEnhancer = (): any => {
  try {
    if (isElectron()) {
      logger.debug(`Running in electron, attempting to 'require redux-electron-store''`);
      // This requires that we remove all dependencies that expect the window from the Redux store
      const { electronEnhancer } = require('redux-electron-store');
      if (typeof electronEnhancer !== 'undefined') {
        return electronEnhancer;
      }
    }
  } catch (error) {
    logger.error(`Failed to require electron enhancer: ${error}`);
  }
  return undefined;
};

/**
 * Reloads all of the windows for electron (main process and renderer processes)
 */
export const reload = (): void => {
  const electron = getElectron();
  if (electron) {
    const BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
    const windows = BrowserWindow.getAllWindows();
    if (windows) {
      windows.forEach(win => win.reload());
    }
  } else {
    // fail safe; not running in electron just reload the existing window
    window.location.reload();
  }
};
