import { digestMessageSHA256 } from '../../src/ts/ui-util';

const text =
  'An obscure body in the S-K System, your majesty. The inhabitants refer to it as the planet Earth.';

describe('Crypto Util', () => {
  it('can give sha256 hashes as hex strings', async () => {
    expect(await digestMessageSHA256(text)).toBe(
      '6efd383745a964768989b9df420811abc6e5873f874fc22a76fe9258e020c2e1'
    );
  });
});
