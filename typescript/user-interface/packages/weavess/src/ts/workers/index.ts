import { WeavessUtil } from '@gms/weavess-core';
import { RpcProvider } from 'worker-rpc';

import { createRecordSectionPositionBuffer } from './create-record-section-line';
import { WorkerOperations } from './operations';

export const rpcProvider = new RpcProvider((message, transfer: any) =>
  postMessage(message, transfer)
);

export const onmessage = e => rpcProvider.dispatch(e.data);

rpcProvider.registerRpcHandler(
  WorkerOperations.CREATE_POSITION_BUFFER,
  WeavessUtil.createPositionBufferForDataBySampleRate
);

rpcProvider.registerRpcHandler(
  WorkerOperations.CREATE_RECORD_SECTION_POSITION_BUFFER,
  createRecordSectionPositionBuffer
);
