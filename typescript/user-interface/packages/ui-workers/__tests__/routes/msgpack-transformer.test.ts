import { encode } from 'msgpack-lite';
import type { RouteMatchCallbackOptions } from 'workbox-core';

import {
  handleMsgPackTransformer,
  testMsgPackTransformer,
  unmsgpack
} from '../../src/ts/routes/msgpack-transformer';
import { logger } from '../../src/ts/sw-logger';

// so we can mock fetch later on
const globalAny = global as any;
globalAny.fetch = jest
  .fn()
  .mockReturnValue(Promise.resolve(new Response(encode(JSON.stringify({ duration: 'PT1M' })))));

describe('Msgpack Transformer', () => {
  describe('unmsgpack', () => {
    it('returns the decoded value if given msgpacked data', () => {
      expect(unmsgpack(encode('foo'))).toBe('foo');
    });
  });
  describe('testMsgPackTransformer', () => {
    it('exists', () => {
      expect(testMsgPackTransformer).toBeDefined();
    });
    it('returns true if request has header accept: application/msgpack', () => {
      const headers = new Headers();
      headers.set('accept', 'application/msgpack');
      expect(
        testMsgPackTransformer({
          request: {
            url: 'https://example.com',
            headers
          } as Request
        } as RouteMatchCallbackOptions)
      ).toBe(true);
    });
  });
  describe('handleMsgPackTransformer', () => {
    it('exists', () => {
      expect(handleMsgPackTransformer).toBeDefined();
    });
    it('transforms responses that contain durations', async () => {
      const mockRequest = new Request('https://example.com/deserialize', {
        method: 'POST',
        body: JSON.stringify({ foo: true })
      });
      const transformed: Response = await (handleMsgPackTransformer as any)({
        request: mockRequest
      });
      expect(await transformed.json()).toMatchInlineSnapshot(`"{"duration":"PT1M"}"`);
    });

    it('resolve with error if the response is not ok', async () => {
      const mockRequest = new Request('https://example.com/deserialize', {
        method: 'POST',
        body: JSON.stringify({ foo: true })
      });
      globalAny.fetch = jest
        .fn()
        .mockReturnValue(
          Promise.resolve(
            new Response(encode(JSON.stringify({ duration: 'PT1M' })), { status: 500 })
          )
        );
      const msgPackTransformerPromise = (handleMsgPackTransformer as any)({ request: mockRequest });
      await expect(msgPackTransformerPromise).resolves.toMatchInlineSnapshot(`
        Response {
          "size": 0,
          "timeout": 0,
          Symbol(Body internals): {
            "body": {
              "data": [
                179,
                123,
                34,
                100,
                117,
                114,
                97,
                116,
                105,
                111,
                110,
                34,
                58,
                34,
                80,
                84,
                49,
                77,
                34,
                125,
              ],
              "type": "Buffer",
            },
            "disturbed": false,
            "error": null,
          },
          Symbol(Response internals): {
            "counter": undefined,
            "headers": Headers {
              Symbol(map): {},
            },
            "status": 500,
            "statusText": "Internal Server Error",
            "url": undefined,
          },
        }
      `);
    });
    it('rejects and logs an error if the handler throws', async () => {
      const mockRequest = new Request('https://example.com/deserialize');
      globalAny.fetch = jest.fn().mockImplementation(() => {
        throw new Error('Test that it throws');
      });
      const loggerSpy = jest.spyOn(logger, 'error');
      await expect(() =>
        (handleMsgPackTransformer as any)({ request: mockRequest })
      ).rejects.toMatchInlineSnapshot(`[Error: Test that it throws]`);
      expect(loggerSpy.mock.calls[0][0].toString()).toMatch(
        'Failed request (msgpack transform): (/deserialize).'
      );
    });
  });
});
