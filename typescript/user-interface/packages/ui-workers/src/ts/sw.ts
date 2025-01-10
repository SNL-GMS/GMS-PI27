import { IS_NODE_ENV_PRODUCTION } from '@gms/common-util';
import { registerRoute } from 'workbox-routing';

import {
  cancelOnIntervalClose,
  clientConnectedMessage,
  listenersActiveMessage,
  skipWaitingMessage,
  toggleWorkboxLogs
} from './messages';
import {
  cssAssetRoute,
  imageAssetRoute,
  jsAssetRoute,
  msgPackTransformerRoute,
  typeTransformerRoute
} from './routes';
import { cancelTokenRecord } from './routes/cancel-token';
import { CACHE_CSS_ASSETS } from './routes/css-assets';
import { CACHE_IMAGE_ASSETS } from './routes/image-assets';
import { CACHE_JS_ASSETS } from './routes/js-assets';
import { CACHES_PRE_CACHE, clearPreCache } from './routes/pre-cache';
import { logger } from './sw-logger';

// TODO Add code caching when webpack hot reloading plays nice
const SHOULD_CACHE_CODE = process.env.GMS_CACHE_CODE_SW ?? false;
const SKIP_WAITING_ON_REFRESH = true;

/**
 * Controls how many clients (tabs) should be considered the minimum required to automatically update
 * the service worker on refresh.
 * Set to 1 to only take control if the user has only one tab open to the app.
 * Set to Infinity to take control if the user refreshes any tab.
 */
const MIN_CLIENTS_TO_SKIP_WAITING_ON_REFRESH = 1;

// so we can use the correct type for self
declare const self: ServiceWorkerGlobalScope;

const clearCaches = Promise.all([
  caches?.delete(CACHE_IMAGE_ASSETS),
  caches?.delete(CACHE_CSS_ASSETS),
  caches?.delete(CACHE_JS_ASSETS),
  caches?.delete(CACHES_PRE_CACHE)
]).catch(error => {
  logger.error('Unable to clear caches', error);
});

export const messageClientsThatSwIsReady = async () => {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      logger.info('messageClient', listenersActiveMessage);
      client?.postMessage(listenersActiveMessage);
    });
  } catch (error) {
    logger.error('Error in service worker', error);
  }
};

/**
 * The fetch handler. Exported to
 * If the user refreshes and we have no more than {@link MIN_CLIENTS_TO_SKIP_WAITING_ON_REFRESH} tabs open, this will
 * activate the service worker.
 *
 * See {@link https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68}
 */
export function handleFetch(event: FetchEvent) {
  logger.debug('handleFetch', event.request.url);
  try {
    event.respondWith(
      (async () => {
        if (
          IS_NODE_ENV_PRODUCTION &&
          event.request.mode === 'navigate' &&
          event.request.method === 'GET' &&
          self.registration.waiting &&
          (await self.clients.matchAll()).length <= MIN_CLIENTS_TO_SKIP_WAITING_ON_REFRESH
        ) {
          self.registration.waiting.postMessage(skipWaitingMessage);
          return new Response('', { headers: { Refresh: '0' } });
        }
        try {
          const result =
            (await caches.match(event.request)) ||
            fetch(event.request).catch(error => {
              logger.error('Unable to fetch', error);
              throw error;
            });
          return result;
        } catch (error) {
          logger.error(error);
          return Promise.reject(error);
        }
      })()
    );
  } catch (error) {
    logger.error('Error in service worker', error);
  }
}

/**
 * Exported for testing purposes. This is the event handler for the 'activate' event
 * Clears all caches and notifies clients that we are ready.
 */
export function handleActivate(event: ExtendableEvent) {
  logger.debug('handleActivate');
  try {
    // TODO clear waveform cache once we move the waveform worker into this package. Until then, it causes a circular dependency.
    event.waitUntil(
      Promise.all([clearCaches, self.clients.claim(), messageClientsThatSwIsReady]).catch()
    );
  } catch (error) {
    logger.error('Error in service worker', error);
  }
}

export async function handleMessage(event: ExtendableMessageEvent) {
  logger.debug('handleMessage', event.data);
  try {
    if (typeof event.data !== 'string') {
      return;
    }
    // this seems to log messages to chrome extensions, too...
    logger.debug('postMessage to sw', event.data);
    if (event.data === clientConnectedMessage) {
      logger.info('New client connected to service worker', event);
      // Alert the newly connected client(s) that we are here and intercepting requests
      event?.source?.postMessage(listenersActiveMessage);
    }
    if (event.data === skipWaitingMessage) {
      await self.skipWaiting();
    }
    if (event.data === toggleWorkboxLogs) {
      // We don't control the variable name, this comes from workbox
      // eslint-disable-next-line no-underscore-dangle
      self.__WB_DISABLE_DEV_LOGS = !self.__WB_DISABLE_DEV_LOGS;
    }

    if (event.data === cancelOnIntervalClose) {
      clearPreCache();
      cancelTokenRecord.CANCEL_ON_INTERVAL_CLOSE.abort('Canceling old interval request');
      cancelTokenRecord.CANCEL_ON_INTERVAL_CLOSE = new AbortController();
    }
  } catch (error) {
    logger.error('Error in service worker', error);
  }
}

/**
 * Registers the service worker events, including routing. This must be run in a service worker, and may
 * have unexpected effects in other contexts, such as the main thread.
 */
export function registerSwEvents() {
  try {
    // We don't control the variable name, this comes from workbox
    // eslint-disable-next-line no-underscore-dangle
    self.__WB_DISABLE_DEV_LOGS = !process.env.GMS_ENABLE_SW_LOGS;

    if (SHOULD_CACHE_CODE) {
      registerRoute(cssAssetRoute);
      registerRoute(jsAssetRoute);
    }
    registerRoute(imageAssetRoute);
    registerRoute(typeTransformerRoute);
    registerRoute(msgPackTransformerRoute);

    if (SKIP_WAITING_ON_REFRESH) {
      self.addEventListener('fetch', handleFetch);
    }

    self.addEventListener('activate', handleActivate);

    self.addEventListener('install', () => {
      logger.info('handleInstall');
    });

    self.addEventListener('message', handleMessage);
  } catch (error) {
    logger.error('Error in service worker', error);
  }
}

// Don't set up the service worker events on the main thread
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  registerSwEvents();
} else {
  logger.debug('Cannot run service worker on the main thread');
}
