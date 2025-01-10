import type {
  RouteHandlerCallback,
  RouteHandlerCallbackOptions,
  RouteMatchCallback
} from 'workbox-core/types';

import type { IgnoreList } from '../ignore-list';
import { shouldIgnore } from '../ignore-list';
import { transformRequest } from '../query';
import { deserializeTypeTransformer } from '../query/axios/axios-transformers';
import { logger } from '../sw-logger';

const defaultTransformIgnoreList: IgnoreList = ['hot-update.json'];

export const testTypeTransformer: RouteMatchCallback = ({ request }): boolean => {
  return (
    !shouldIgnore(request, defaultTransformIgnoreList) &&
    request.headers.get('accept') !== 'application/msgpack' &&
    request.headers.get('accept') === 'application/json'
  );
};

export const handleTypeTransformer: RouteHandlerCallback = async ({
  request
}: RouteHandlerCallbackOptions) => {
  const url = new URL(request.url).pathname ?? request.url;
  const urlString = url ? `: (${url})` : ``;
  try {
    const req = await transformRequest(request);
    const response = await fetch(req);
    if (response.ok) {
      const data = await response.json();
      const transformed = deserializeTypeTransformer(data);
      return new Response(JSON.stringify(transformed));
    }
    if (request?.signal?.aborted) {
      return Promise.resolve(new Response(null, { status: 409, statusText: 'canceled' }));
    }
    logger.error(
      `Failed response (type transform)${urlString}. ${response.status} ${response.statusText}`,
      request,
      response
    );
    // Axios will still treat as an error if status is not a 2XX
    return Promise.resolve(response);
  } catch (e) {
    if (request?.signal?.aborted) {
      return Promise.resolve(new Response(null, { status: 409, statusText: 'canceled' }));
    }
    logger.error(`Failed request (type transform)${urlString}.`, request, e);
    return Promise.reject(e);
  }
};
