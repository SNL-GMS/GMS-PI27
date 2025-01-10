import { Logger, OrderedPriorityQueue } from '@gms/common-util';
import type { RouteHandlerCallback, RouteHandlerCallbackOptions } from 'workbox-core/types';

export const CACHES_PRE_CACHE = 'pre-cache';
export const PRE_CACHE_HEADER = 'pre-cache';

const STATUS_CODE_200 = 200;

const logger = Logger.create('GMS_LOG_PRE_CACHE', process.env.GMS_LOG_PRE_CACHE);
const queue = new OrderedPriorityQueue({ concurrency: 16 });
const HEX_BASE = 16;

/**
 * Create a hash of a given string input.
 *
 * @param message the string message to hash
 * @returns a hash string
 */
export async function digestMessageSHA256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  return hashArray.map(b => b.toString(HEX_BASE).padStart(2, '0')).join(''); // convert bytes to hex string
}

/**
 * Clears out the pre cache of all requests which have not been initiated
 */
export const clearPreCache = () => {
  queue.clear();
};

/**
 * Add the result to the cache.
 *
 * @param key a unique identifier (hash) for the request based on its response body
 * @param result the result (promise) of the request
 */
export const addPreCache = async (key: string, result: Response) => {
  logger.debug(`ADD ${key}. Queue length: ${queue.size} requests`);
  try {
    const cache = await caches.open(PRE_CACHE_HEADER);
    await cache.put(key, result.clone());
  } catch (error) {
    logger.error('There was a problem adding the result to the pre-cache');
  }
};

/**
 * Remove the result from the cache.
 *
 * @param key a unique identifier (hash) for the request based on its response body
 * @param result the result (promise) of the request
 */
export const removePreCache = async (key: string) => {
  logger.debug(`REMOVE ${key}`);
  try {
    await caches.delete(key);
  } catch (error) {
    logger.error('There was a problem deleting the result from the pre-cache');
  }
};

/**
 * Get the pre-cache request value by url and key.
 *
 * @param key a unique identifier (hash) for the request based on its response body
 * @returns the result (promise) of the request
 */
export const getPreCache = async (key: string): Promise<Response | undefined> => {
  try {
    if (queue.has(key)) {
      const result = await queue.now(key);
      // We can just return from here, we don't need to add this to the cache
      return result as Response;
    }
    return await caches.match(key);
  } catch (error) {
    logger.error('There was a problem retrieving the result from the pre-cache');
    return Promise.resolve(undefined);
  }
};

/**
 * Adds pre cache operations to the route.
 */
export const withPreCache = (handler: RouteHandlerCallback): RouteHandlerCallback => {
  return async (options: RouteHandlerCallbackOptions) => {
    const clonedRequest = options.request.clone();
    const key = await digestMessageSHA256(await clonedRequest.text());
    const existingResponse = await getPreCache(key);

    // Is this a pre-cache request?
    if (clonedRequest.headers.has(PRE_CACHE_HEADER)) {
      // If this pre-cache attempt has not been attempted previously
      if (!queue.has(key) && !existingResponse) {
        queue
          .add(
            async () => {
              const result = await handler(options);

              if (result.status === STATUS_CODE_200) {
                // request was successful; add pre-cache entry
                await addPreCache(key, result);
              } else {
                // If does not complete successfully; remove the pre-cache entry so the request can be attempted normally
                await removePreCache(key);
              }
            },
            { priority: Number(clonedRequest.headers.get(PRE_CACHE_HEADER)) }
          )
          .catch(async e => {
            // If there is an error remove the pre-cache entry so the request can be attempted normally
            await removePreCache(key);
            logger.error(e);
          });

        return new Response(null, {
          status: 200,
          statusText: `Pre-cache request ${key} added`
        });
      }

      return new Response(null, {
        status: 204,
        statusText: 'Previously attempted pre-cache request'
      });
    }

    if (existingResponse) {
      logger.debug(`HIT ${key}`);
      // Don't await the removal op so we don't slow things down
      removePreCache(key).catch(logger.error);
      return existingResponse;
    }

    return handler(options);
  };
};
