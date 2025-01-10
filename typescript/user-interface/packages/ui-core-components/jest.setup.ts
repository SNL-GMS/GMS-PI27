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

const globalAny: any = global;

globalAny.window = window;

class Worker {
  public url: string;

  public onmessage: (message: Record<string, unknown>, transfer?: Transferable[]) => void;

  public constructor(stringUrl: string) {
    this.url = stringUrl;
    this.onmessage = () => {
      // do nothing
    };
  }

  public postMessage(message: Record<string, unknown>, transfer?: Transferable[]) {
    this.onmessage(message, transfer);
  }
}
globalAny.window.Worker = Worker;
