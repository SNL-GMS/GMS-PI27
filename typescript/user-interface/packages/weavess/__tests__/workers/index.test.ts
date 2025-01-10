import { rpcProvider } from '../../src/ts/workers';

describe('Weavess Workers', () => {
  it('Weavess workers to be defined', () => {
    expect(rpcProvider).toBeDefined();
    const WeavessWorker = new Worker(new URL('../../workers', import.meta.url));
    expect(WeavessWorker).toBeDefined();
  });
});
