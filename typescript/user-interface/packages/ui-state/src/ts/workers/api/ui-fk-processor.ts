import type { ChannelSegmentTypes, FkTypes } from '@gms/common-model';
import type { AxiosRequestConfig } from 'axios';

import type { ComputeFkSpectraArgs } from '../../app';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for computing a FK Spectra
 *
 * @param requestConfig the request config
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns a promise for a newly compute FK
 */
export const computeFkApi = async (
  args: ComputeFkSpectraArgs
): Promise<ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra>> => {
  return waveformWorkerRpc.rpc(WorkerOperations.COMPUTE_FK_SPECTRA, args);
};

/**
 * @returns the Peak FkAttributes of the FkSpectrum which has the largest peakFstat value
 */
export const getPeakFkAttributesApi = async (
  fkSpectra: FkTypes.FkSpectraCOI
): Promise<FkTypes.FkAttributes> => {
  return waveformWorkerRpc.rpc(WorkerOperations.GET_PEAK_FK_ATTRIBUTES, fkSpectra);
};

/**
 * Legacy Worker API for computing a FK Spectra
 *
 * @deprecated
 *
 * @param requestConfig the request config
 *
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns a promise for a newly compute FK
 */
export const computeLegacyFkSpectraApi = async (
  args: AxiosRequestConfig<FkTypes.ComputeFkInput>
): Promise<ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra>> => {
  return waveformWorkerRpc.rpc(WorkerOperations.COMPUTE_LEGACY_FK_SPECTRA, args);
};
