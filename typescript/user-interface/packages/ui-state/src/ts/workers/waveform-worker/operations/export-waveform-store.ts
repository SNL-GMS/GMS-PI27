import { WaveformStore } from '../worker-store/waveform-store';

export const exportWaveformStore = async (): Promise<Record<string, Float64Array>> => {
  return WaveformStore.exportStore();
};
