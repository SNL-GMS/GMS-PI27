import type { AppState } from '@gms/ui-state';

export interface GmsExport {
  versionInfo: string;
  reduxStore: AppState;
  waveformStore: Record<string, Float64Array>;
}
