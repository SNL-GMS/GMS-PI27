import { WaveformStore } from '../worker-store/waveform-store';

export interface ImportWaveformStoreParams {
  waveformStore: Record<string, Float64Array>;
}

export const importWaveformStore = async ({
  waveformStore
}: ImportWaveformStoreParams): Promise<void> => {
  return WaveformStore.importStore(waveformStore);
};
