import { Route } from 'workbox-routing';

import { withCancelToken } from './cancel-token';
import { handleCssAsset, testCssAsset } from './css-assets';
import { handleImageAsset, testImageAsset } from './image-assets';
import { handleJsAsset, testJsAsset } from './js-assets';
import { handleMsgPackTransformer, testMsgPackTransformer } from './msgpack-transformer';
import { withPreCache } from './pre-cache';
import { withRequestTracker } from './request-tracker';
import { handleTypeTransformer, testTypeTransformer } from './type-transformer';

/**
 * the route to intercept and set the caching strategy for images
 */
export const imageAssetRoute = new Route(testImageAsset, handleImageAsset);

/**
 * the route to intercept and set the caching strategy for js files
 */
export const jsAssetRoute = new Route(testJsAsset, handleJsAsset);

/**
 * the route to intercept and set the caching strategy for css files
 */
export const cssAssetRoute = new Route(testCssAsset, handleCssAsset);

/**
 * the route to intercept and set the caching strategy for backend services that just
 * get the default axios transformers
 */
export const typeTransformerRoute = new Route(
  testTypeTransformer,
  withCancelToken(withRequestTracker(withPreCache(handleTypeTransformer))),
  'POST'
);

/**
 * the route to intercept and set the caching strategy for requests that are msgpack encoded
 */
export const msgPackTransformerRoute = new Route(
  testMsgPackTransformer,
  withCancelToken(withRequestTracker(withPreCache(handleMsgPackTransformer))),
  'POST'
);
