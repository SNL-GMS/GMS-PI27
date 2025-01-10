import type { RouteMatchCallbackOptions } from 'workbox-core';

import { handleTypeTransformer, testTypeTransformer } from '../../src/ts/routes/type-transformer';
import { logger } from '../../src/ts/sw-logger';

// so we can mock fetch later on
const globalAny = global as any;
globalAny.fetch = jest
  .fn()
  .mockReturnValue(Promise.resolve(new Response(JSON.stringify({ duration: 'PT1M' }))));

describe('Type Transformer', () => {
  describe('testTypeTransformer', () => {
    it('exists', () => {
      expect(testTypeTransformer).toBeDefined();
    });
    it('returns true if request has header accept: application/json', () => {
      const headers = new Headers();
      headers.set('accept', 'application/json');
      expect(
        testTypeTransformer({
          request: {
            url: 'https://example.com',
            headers
          } as Request
        } as RouteMatchCallbackOptions)
      ).toBe(true);
    });
  });
  describe('handleTypeTransformer', () => {
    it('exists', () => {
      expect(handleTypeTransformer).toBeDefined();
    });
    it('transforms responses that contain durations', async () => {
      const mockRequest = new Request('https://example.com/deserialize', {
        method: 'POST',
        body: JSON.stringify({ foo: true })
      });
      const transformed: Response = await (handleTypeTransformer as any)({ request: mockRequest });
      expect(await transformed.json()).toMatchInlineSnapshot(`
        {
          "duration": 60,
        }
      `);
    });

    it('resolves with error if the response is not ok', async () => {
      const mockRequest = new Request('https://example.com/deserialize', {
        method: 'POST',
        body: JSON.stringify({ foo: true })
      });
      globalAny.fetch = jest
        .fn()
        .mockReturnValue(
          Promise.resolve(new Response(JSON.stringify({ duration: 'PT1M' }), { status: 500 }))
        );
      const transformerPromise = (handleTypeTransformer as any)({ request: mockRequest });
      await expect(transformerPromise).resolves.toMatchInlineSnapshot(`
        Response {
          "size": 0,
          "timeout": 0,
          Symbol(Body internals): {
            "body": {
              "data": [
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
              Symbol(map): {
                "Content-Type": [
                  "text/plain;charset=UTF-8",
                ],
              },
            },
            "status": 500,
            "statusText": "Internal Server Error",
            "url": undefined,
          },
        }
      `);
    });
    it('rejects and logs an error if the handler throws', async () => {
      const mockRequest = new Request('https://example.com/deserialize', {
        method: 'POST',
        body: JSON.stringify({ foo: true })
      });
      globalAny.fetch = jest.fn().mockImplementation(() => {
        throw new Error('Test that it throws');
      });
      const loggerSpy = jest.spyOn(logger, 'error');
      await expect(() =>
        (handleTypeTransformer as any)({ request: mockRequest })
      ).rejects.toMatchInlineSnapshot(`[Error: Test that it throws]`);
      expect(loggerSpy.mock.calls[0][0].toString()).toMatchInlineSnapshot(
        `"Failed request (type transform): (/deserialize)."`
      );
    });
  });
});
