import { decode } from 'msgpack-lite';
import type {
  RouteHandlerCallback,
  RouteHandlerCallbackOptions,
  RouteMatchCallback
} from 'workbox-core/types';

import type { IgnoreList } from '../ignore-list';
import { shouldIgnore } from '../ignore-list';
import { deserializeTypeTransformer, transformRequest } from '../query';
import { logger } from '../sw-logger';

const defaultTransformIgnoreList: IgnoreList = [];

export const unmsgpack = (val: Uint8Array) => {
  if (val?.length > 0) {
    return decode(val);
  }
  return undefined;
};

export const testMsgPackTransformer: RouteMatchCallback = ({ request }): boolean => {
  return (
    !shouldIgnore(request, defaultTransformIgnoreList) &&
    request.headers.get('accept') === 'application/msgpack'
  );
};

export const handleMsgPackTransformer: RouteHandlerCallback = async ({
  request
}: RouteHandlerCallbackOptions) => {
  const url = new URL(request.url).pathname ?? request.url;
  const urlString = url ? `: (${url})` : ``;
  try {
    const req = await transformRequest(request);
    const response = await fetch(req);
    const decoded = unmsgpack(new Uint8Array(await response.clone().arrayBuffer()));
    if (response.ok) {
      // Also run deserialize type transformer, since the route handler for that will not match message pack encoded results
      const typeTransformed = deserializeTypeTransformer(decoded);
      const newBody = JSON.stringify(typeTransformed);
      return Promise.resolve(new Response(newBody));
    }
    if (request?.signal?.aborted) {
      return Promise.resolve(new Response(null, { status: 409, statusText: 'canceled' }));
    }

    logger.error(
      `Failed response (msgpack transform)${urlString}. ${response.status} ${response.statusText}`,
      {
        request,
        response,
        decoded
      }
    );
    // Axios will still treat as an error if status is not a 2XX
    return Promise.resolve(response);
  } catch (e) {
    if (request?.signal?.aborted) {
      return Promise.resolve(new Response(null, { status: 409, statusText: 'canceled' }));
    }
    logger.error(`Failed request (msgpack transform)${urlString}.`, request, e);
    return Promise.reject(e);
  }
};
