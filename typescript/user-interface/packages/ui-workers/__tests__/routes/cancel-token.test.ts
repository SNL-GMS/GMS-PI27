import type { RouteHandlerCallbackOptions } from 'workbox-core';

import { CancelTokens } from '../../src/ts/request-cancel-tokens';
import { withCancelToken } from '../../src/ts/routes/cancel-token';

describe('withCancelToken', () => {
  it('is defined', () => {
    expect(withCancelToken).toBeDefined();
  });

  it('does not effect a request without a Cancel-Token header', async () => {
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

    await withCancelToken(handler)(options);

    expect(options.request.signal).toBeNull();
  });

  it('does not effect a request without a matching Cancel-Token header', async () => {
    const bodyText = '{"test":"OK"}';
    const options: RouteHandlerCallbackOptions = {
      url: new URL('http://test.com/test'),
      event: {} as ExtendableEvent,
      request: new Request('test', {
        method: 'POST',
        headers: new Headers({
          'Cancel-Token': 'FAIL'
        }),
        body: 'OK'
      })
    };
    const handler = jest.fn(
      async (): Promise<Response> =>
        new Promise(resolve => {
          resolve(new Response(bodyText));
        })
    );

    await withCancelToken(handler)(options);

    expect(options.request.signal).toBeNull();
  });

  it('will attach an abort controller to a request with a Cancel-Token header', async () => {
    const bodyText = '{"test":"OK"}';
    const options: RouteHandlerCallbackOptions = {
      url: new URL('http://test.com/test'),
      event: {} as ExtendableEvent,
      request: new Request('test', {
        method: 'POST',
        headers: new Headers({
          'Cancel-Token': CancelTokens.CANCEL_ON_INTERVAL_CLOSE
        }),
        body: 'OK'
      })
    };
    const handler = jest.fn(
      async (): Promise<Response> =>
        new Promise(resolve => {
          resolve(new Response(bodyText));
        })
    );

    await withCancelToken(handler)(options);

    expect(options.request.signal).toBeDefined();
    expect(options.request.signal.aborted).toBe(false);
  });
});
