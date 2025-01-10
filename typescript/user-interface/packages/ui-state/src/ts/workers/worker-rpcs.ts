import { RpcProvider } from 'worker-rpc';

// To debug the worker use chrome://inspect/#workers
export const waveformWorker = new SharedWorker(
  new URL('./waveform-worker/index.ts', import.meta.url) /* webpackChunkName: 'waveform-worker' */,
  'waveform-worker'
);

// TODO remove RpcProvider as it is no longer needed for worker compatibility with webpack
export const waveformWorkerRpc = new RpcProvider((message, transfer) => {
  waveformWorker.port.postMessage(message, transfer as unknown as any);
});
waveformWorker.port.onmessage = e => {
  waveformWorkerRpc.dispatch(e.data);
};
