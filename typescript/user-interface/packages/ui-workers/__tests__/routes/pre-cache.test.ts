import type { RouteHandlerCallbackOptions } from 'workbox-core/types';

import { withPreCache } from '../../src/ts/routes/pre-cache';

describe('Pre Cache', () => {
  it('is defined', () => {
    expect(withPreCache).toBeDefined();
  });

  it('responds normally if the pre-cache header is not set', async () => {
    const bodyText = '{"test":"OK"}';
    const options: RouteHandlerCallbackOptions = {
      url: new URL('http://test.com/test'),
      event: {} as ExtendableEvent,
      request: new Request('test', {
        method: 'POST',
        headers: new Headers(),
        body: 'OK'
      })
    };
    const handler = jest.fn(
      async (): Promise<Response> =>
        new Promise(resolve => {
          resolve(new Response(bodyText));
        })
    );
    const response = await withPreCache(handler)(options);
    expect(await response.text()).toBe(bodyText);
  });

  it('processes the pre-cache entry if the pre-cache header is set', async () => {
    const bodyText = '{"test":"OK"}';
    const options: RouteHandlerCallbackOptions = {
      url: new URL('http://test.com/test'),
      event: {} as ExtendableEvent,
      request: new Request('test', {
        method: 'POST',
        headers: new Headers({ 'pre-cache': '1' }),
        body: 'OK'
      })
    };
    const handler = jest.fn(
      async (): Promise<Response> =>
        new Promise(resolve => {
          resolve(new Response(bodyText));
        })
    );
    await withPreCache(handler)(options);

    // eslint-disable-next-line no-promise-executor-return
    await new Promise(r => setTimeout(r, 100));

    expect(handler).toHaveBeenCalled(); // Open is called to put the value in the cache
  });

  it('will not attempt duplicate pre-cache requests', async () => {
    const bodyText = '{"test":"OK"}';
    const options: RouteHandlerCallbackOptions = {
      url: new URL('http://test.com/test'),
      event: {} as ExtendableEvent,
      request: new Request('test', {
        method: 'POST',
        headers: new Headers({ 'pre-cache': '1' }),
        body: 'OK'
      })
    };
    const handler = jest.fn(
      async (): Promise<Response> =>
        new Promise(resolve => {
          resolve(new Response(bodyText));
        })
    );
    const cacheMatchSpy = jest.spyOn(caches, 'match').mockImplementation(async () => {
      return Promise.resolve(new Response(bodyText));
    });
    const response = await withPreCache(handler)(options);

    expect(cacheMatchSpy).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(response.status).toBe(204);
  });
});
