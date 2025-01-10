import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for exporting the entire waveform store
 *
 * @returns Promise of the full waveform store
 */
export const exportWaveformStore = async (): Promise<Record<string, Float64Array>> =>
  waveformWorkerRpc.rpc(WorkerOperations.EXPORT_WAVEFORM_STORE);
