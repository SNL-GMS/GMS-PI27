/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
import * as util from 'util';

Object.defineProperty(window, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});
Object.defineProperty(global, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(global, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});

/* Jest Setup Configuration */
import crypto from 'crypto';
/* Jest Setup Configuration */

/**
 * This is needed to pass the pipeline, currently.
 */
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: async (algorithm: AlgorithmIdentifier, msg: Uint8Array) =>
        (crypto.webcrypto as any).subtle.digest(algorithm, msg) as Promise<any>
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jest-canvas-mock');
