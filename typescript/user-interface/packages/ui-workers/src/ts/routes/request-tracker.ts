import { uuid4 } from '@gms/common-util';
import type { RouteHandlerCallback, RouteHandlerCallbackOptions } from 'workbox-core/types';

import type { RequestTrackerMessage } from '../ui-workers';
import { isSuccessfulStatusCode, ServiceWorkerMessages } from '../ui-workers';
import { PRE_CACHE_HEADER } from './pre-cache';

declare const self: ServiceWorkerGlobalScope;

export const withRequestTracker = (handler: RouteHandlerCallback): RouteHandlerCallback => {
  return async (options: RouteHandlerCallbackOptions) => {
    const clients = await self.clients.matchAll();
    let win = clients.find(c => c.type === 'window');
    // Do not notify if this is a pre cache request
    if (options.request.headers.has(PRE_CACHE_HEADER)) win = undefined;

    const id = uuid4();
    const requestInitiatedMessage: RequestTrackerMessage = {
      id,
      message: ServiceWorkerMessages.requestInitiated,
      url: options.url.toString(),
      actionType: 'REQUEST'
    };
    win?.postMessage(requestInitiatedMessage);
    try {
      const result = await handler(options);
      const requestCompletedMessage: RequestTrackerMessage = {
        id,
        message: ServiceWorkerMessages.requestCompleted,
        url: options.url.toString(),
        status: result.status,
        error: !isSuccessfulStatusCode(result.status) ? result.statusText : undefined,
        actionType: 'REQUEST'
      };
      win?.postMessage(requestCompletedMessage);
      return result;
    } catch (error) {
      const unexpectedFailureMessage: RequestTrackerMessage = {
        id,
        message: ServiceWorkerMessages.requestCompleted,
        url: options.url.toString(),
        error: `Unexpected Error: ${error?.message ?? JSON.stringify(error)}}`,
        actionType: 'REQUEST'
      };
      win?.postMessage(unexpectedFailureMessage);
      throw error;
    }
  };
};
