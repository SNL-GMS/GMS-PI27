/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
import crypto from 'crypto';
import * as util from 'util';

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: async (algorithm: AlgorithmIdentifier, msg: Uint8Array) =>
        (crypto.webcrypto as any).subtle.digest(algorithm, msg) as Promise<any>
    }
  }
});

Object.defineProperty(global, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(global, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});

import type { GlobalWithFetchMock } from 'jest-fetch-mock';

const customGlobal: GlobalWithFetchMock = (global as unknown) as GlobalWithFetchMock;
// eslint-disable-next-line @typescript-eslint/no-require-imports
customGlobal.fetch = require('jest-fetch-mock');

customGlobal.fetchMock = customGlobal.fetch;

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jest-canvas-mock');

const globalAny: any = global;

// eslint-disable-next-line @typescript-eslint/no-require-imports
globalAny.fetch = require('jest-fetch-mock');

globalAny.TextEncoder = util.TextEncoder;
globalAny.caches = {
  delete: jest.fn(),
  match: jest.fn(),
  open: jest.fn(() => ({ put: jest.fn() }))
};
globalAny.window = window;

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
require('jest-fetch-mock').enableMocks();

class Worker {
  public url: string;

  public onmessage: (message: unknown, transfer?: Transferable[]) => void;

  public constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  public postMessage(message: unknown, transfer?: Transferable[]) {
    setTimeout(() => {
      this.onmessage({ data: `${message} COMPLETE` }, transfer);
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    }, 50);
  }
}
globalAny.window.Worker = Worker;

/**
 * Mock workbox dependencies because jest cannot properly transform workbox into a module.
 * See {@link https://github.com/GoogleChrome/workbox/issues/2897} for more details as to why
 * this is the case.
 */
jest.mock('workbox-routing', () => {
  return {
    registerRoute: jest.fn(),
    Route: jest.fn()
  };
});
jest.mock('workbox-strategies', () => {
  return {
    CacheFirst: jest.fn()
  };
});
jest.mock('workbox-core', () => {
  return {
    clientsClaim: jest.fn(),
    RouteHandler: jest.fn(),
    RouteMatchCallback: jest.fn()
  };
});
