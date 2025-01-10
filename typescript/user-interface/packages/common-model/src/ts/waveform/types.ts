import { type Timeseries } from '../channel-segment/types';
import type { Either } from '../type-util/type-util';

export type Waveform = Timeseries &
  Either<
    { samples: Float64Array },
    {
      /** Claim check ID. Used to fetch and perform operations on this waveform sample data. */
      _uiClaimCheckId: string;
    }
  >;

/**
 * The legacy waveform filter type. This has been replaced by the COI filter type.
 *
 * @deprecated
 */
export interface WaveformFilter {
  id: string;
  name: string;
  description: string;
  filterType: string; // FIR_HAMMING
  filterPassBandType: string; // BAND_PASS, HIGH_PASS
  lowFrequencyHz: number;
  highFrequencyHz: number;
  order: number;
  filterSource: string; // SYSTEM
  filterCausality: string; // CAUSAL
  zeroPhase: boolean;
  sampleRate: number;
  sampleRateTolerance: number;
  validForSampleRate: boolean;
  sosDenominatorCoefficients?: number[];
  sosNumeratorCoefficients?: number[];
  groupDelaySecs: number;
}

export const DEFAULT_SAMPLE_RATE = 1;

export const UNFILTERED = 'Unfiltered';

export const UNFILTERED_FILTER: Partial<WaveformFilter> = {
  id: UNFILTERED,
  name: UNFILTERED,
  sampleRate: undefined
};

// Enum to clarify pan button interactions
export enum PanType {
  Left,
  Right
}

// Enum to clarify load interactions
export enum LoadType {
  Earlier,
  Later
}
