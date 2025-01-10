import type { RouteHandlerCallback, RouteHandlerCallbackOptions } from 'workbox-core';

import { CancelTokens } from '../ui-workers';

export const cancelTokenRecord = {
  [CancelTokens.CANCEL_ON_INTERVAL_CLOSE]: new AbortController()
};

const cancelTokens = Object.keys(cancelTokenRecord);

export const withCancelToken = (handler: RouteHandlerCallback): RouteHandlerCallback => {
  return async (options: RouteHandlerCallbackOptions) => {
    const cancelTokenHeaderValue = options.request.headers.get('Cancel-Token');
    if (cancelTokenHeaderValue && cancelTokens.includes(cancelTokenHeaderValue)) {
      // eslint-disable-next-line no-param-reassign
      options.request = new Request(options.request, {
        signal: cancelTokenRecord[cancelTokenHeaderValue].signal
      });
    }

    return handler(options);
  };
};
