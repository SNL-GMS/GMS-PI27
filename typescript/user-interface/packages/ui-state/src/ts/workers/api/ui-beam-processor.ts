import { WorkerOperations } from '../waveform-worker/operations/operations';
import type {
  MaskAndBeamWaveformResult,
  MaskAndBeamWaveformWorkerProps
} from '../waveform-worker/types';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * Mask and beam waveform operation.  Builds the parameters for the {@link maskAndBeamWaveforms} operation to call the WASM code for event beaming
 *
 * @param props of type {@link MaskAndBeamWaveformWorkerProps}
 */
export const maskAndBeamWaveforms = async (
  props: MaskAndBeamWaveformWorkerProps
): Promise<MaskAndBeamWaveformResult> =>
  waveformWorkerRpc.rpc(WorkerOperations.MASK_AND_BEAM_WAVEFORMS, props);
