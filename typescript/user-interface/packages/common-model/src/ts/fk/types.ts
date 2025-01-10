import type { Timeseries } from '../channel-segment/types';
import type { DoubleValue } from '../common/types';
import type {
  ChannelSegmentTypes,
  ChannelTypes,
  FacetedTypes,
  FilterTypes,
  StationTypes,
  WaveformTypes
} from '../common-model';
import type { EntityReference } from '../faceted';

export enum FkUnits {
  FSTAT = 'FSTAT',
  POWER = 'POWER'
}

export interface AzimuthSlownessValues {
  azimuth: number;
  slowness: number;
}

export interface FkMeasuredValues {
  signalDetectionId: string;
  measuredValues: AzimuthSlownessValues;
}
// ***************************************
// Model
// ***************************************
/**
 * Fk meta data from the COI
 */
export interface FkMetadata {
  readonly phaseType: string;
  readonly slowDeltaX: number;
  readonly slowDeltaY: number;
  readonly slowStartX: number;
  readonly slowStartY: number;
}

export interface FstatData {
  readonly azimuthWf: WaveformTypes.Waveform;
  readonly slownessWf: WaveformTypes.Waveform;
  readonly fstatWf: WaveformTypes.Waveform;
}

/**
 * Fk power spectra COI representation
 */
export interface FkPowerSpectraCOI extends Timeseries {
  readonly metadata: FkMetadata;
  readonly values: FkPowerSpectrum[];
  readonly stepSize: number;
  readonly windowLead: number;
  readonly windowLength: number;
  readonly lowFrequency: number;
  readonly highFrequency: number;
}

/**
 * Fk power spectra UI representation
 */
export interface FkPowerSpectra extends FkPowerSpectraCOI {
  // Needed for UI processing added when query returns FkPowerSpectraCOI
  readonly fstatData: FstatData;
  readonly configuration: FkSpectraTemplate;
  readonly reviewed: boolean;
}
export interface FkPowerSpectrum {
  readonly power: number[][];
  readonly fstat: number[][];
  readonly quality: number;
  readonly attributes: OldFkAttributes[];
}

export interface AzimuthSlowness {
  readonly azimuth: number;
  readonly slowness: number;
  readonly azimuthUncertainty: number;
  readonly slownessUncertainty: number;
  readonly extrapolated: boolean;
}
export interface OldFkAttributes extends AzimuthSlowness {
  readonly peakFStat: number;
  readonly xSlow: number;
  readonly ySlow: number;
}

/**
 * FkFrequencyThumbnail preview Fk at a preset FkFrequencyRange
 */
export interface FkFrequencyThumbnail {
  readonly frequencyBand: FkFrequencyRange;
  readonly fkSpectra: FkSpectra;
}

/**
 * Collection of thumbnails by signal detection id
 */
export interface FkFrequencyThumbnailBySDId {
  readonly signalDetectionId: string;
  readonly fkFrequencyThumbnails: FkFrequencyThumbnail[];
}

/**
 * Tracks whether a channel is used to calculate fk
 */

export interface ContributingChannelsConfiguration {
  readonly id: string;
  readonly enabled: boolean;
  readonly name: string;
}

export interface ComputeFkInput {
  readonly startTime: number;
  readonly sampleRate: number;
  readonly sampleCount: number;
  readonly channels: EntityReference<'name'>[];
  readonly windowLead: string;
  readonly windowLength: string;
  readonly lowFrequency: number;
  readonly highFrequency: number;
  readonly useChannelVerticalOffset: boolean;
  readonly phaseType: string;
  readonly normalizeWaveforms: boolean;
  // Optional fields
  readonly slowStartX?: number;
  readonly slowStartY?: number;
  readonly slowDeltaX?: number;
  readonly slowDeltaY?: number;
  readonly slowCountX?: number;
  readonly slowCountY?: number;
}

/**
 * Build FkInput for backend with configuration values to restore
 * with FkSpectra returned in fk configuration
 */

export interface FkInputWithConfiguration {
  readonly fkComputeInput: ComputeFkInput;
  readonly configuration: FkSpectraTemplate;
  readonly signalDetectionId: string;
  readonly isThumbnailRequest: boolean;
}

// ------------------- New FK Definitions Post Pivot ------------------
/** Describes both a FKSpectraWindow and FkSpectrumWindow */
export interface FkWindow {
  duration: number;
  lead: number;
}
export interface FkSpectraMetadata {
  readonly fkSpectrumWindow: FkWindow;
  readonly slownessGrid: SlownessGrid;
  readonly phase: string;
}
/**
 * Fk spectra COI representation
 */
export interface FkSpectraCOI extends Timeseries {
  readonly fkSpectraMetadata?: FkSpectraMetadata;
  readonly samples: FkSpectrum[];
  readonly peakFkAttributes?: FkAttributes; // TODO take away optional
}
/**
 * Fk spectra with UI representation
 */
export interface FkSpectra extends FkSpectraCOI {
  // Needed for UI processing added when query returns FkPowerSpectraCOI
  readonly configuration: FkSpectraTemplate;
  readonly reviewed: boolean;
  readonly fstatData: FstatData;
}

export interface FkSpectrum {
  readonly power: number[][];
  readonly fstat: number[][];
  readonly fkQual?: number;
  readonly fkAttributes?: FkAttributes[];
}
export interface FkAttributes {
  readonly peakFStat: number;
  readonly receiverToSourceAzimuth: DoubleValue;
  readonly slowness: DoubleValue;
}

/**
 * FK Spectra Template Definition Components
 */
export interface SlownessGrid {
  maxSlowness: number;
  numPoints: number;
}
export interface FkWaveformSampleRate {
  waveformSampleRateHz: number;
  waveformSampleRateToleranceHz: number;
}
export interface FkFrequencyRange {
  lowFrequencyHz: number;
  highFrequencyHz: number;
}
export interface FkFrequencyRangeWithPrefilter extends FkFrequencyRange {
  previewPreFilterDefinition:
    | FilterTypes.FilterDefinition
    | FilterTypes.LinearFilterDefinition
    | FilterTypes.CascadeFilterDefinition
    | FilterTypes.PhaseMatchFilterDefinition
    | FilterTypes.AutoRegressiveFilterDefinition;
}
export enum FkUncertaintyOption {
  EMPIRICAL = 'EMPIRICAL',
  EXPONENTIAL_SIGNAL_COHERENCE = 'EXPONENTIAL_SIGNAL_COHERENCE',
  OBSERVED_SIGNAL_COHERENCE = 'OBSERVED_SIGNAL_COHERENCE',
  PERFECT_SIGNAL_COHERENCE = 'PERFECT_SIGNAL_COHERENCE'
}
export enum TaperFunction {
  BLACKMAN = 'BLACKMAN',
  COSINE = 'COSINE',
  HAMMING = 'HAMMING',
  HANNING = 'HANNING',
  PARZEN = 'PARZEN',
  WELCH = 'WELCH'
}

export interface ProcessingMasksByChannel {
  channel: ChannelTypes.Channel;
  processingMasks: ChannelSegmentTypes.ProcessingMask[];
}

export interface FkSpectraParameters {
  phase: string;
  preFilter: FilterTypes.FilterDefinition | undefined;
  slownessGrid: SlownessGrid;
  fkSpectrumWindow: FkWindow;
  fkFrequencyRange: FkFrequencyRange;
  waveformSampleRate: FkWaveformSampleRate;
  spectrumStepDuration: number;
  orientationAngleToleranceDeg: number;
  minimumWaveformsForSpectra: number;
  normalizeWaveforms: boolean;
  twoDimensional: boolean;
  fftTaperFunction: TaperFunction;
  fkUncertaintyOption: FkUncertaintyOption;
  fftTaperPercent: number;
}
export interface FkSpectraDefinition {
  orientationAngles: ChannelTypes.OrientationAngles;
  fkParameters: FkSpectraParameters;
}
export interface FkSpectraTemplate {
  inputChannels: FacetedTypes.EntityReference<'name', ChannelTypes.Channel>[];
  fkSpectraParameters: FkSpectraParameters;
  fkSpectraWindow: FkWindow;
  station: FacetedTypes.VersionReference<'name', StationTypes.Station>;
  phaseType: string;
}

export type FkSpectraTemplatesByStationByPhase = Record<
  string /* station name */,
  Record<string /* phase type */, FkSpectraTemplate>
>;

export type FkReviewablePhasesByStation = Record<string, string[]>;

export type FkReviewablePhasesByActivityNameByStation = Record<string, FkReviewablePhasesByStation>;
