import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for importing the entire waveform store
 *
 * @returns a promise which resolves when the import is complete
 */
export const importWaveformStore = async (
  waveformStore: Record<string, Float64Array>
): Promise<void> => {
  return waveformWorkerRpc.rpc(WorkerOperations.IMPORT_WAVEFORM_STORE, { waveformStore });
};
