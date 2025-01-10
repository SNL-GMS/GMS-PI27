import type {
  ChannelSegment,
  ChannelSegmentDescriptor,
  ChannelSegmentFaceted,
  Timeseries
} from '../channel-segment/types';
import type { DoubleValue, Units } from '../common/types';
import type { EntityReference, Faceted, VersionReference } from '../faceted';
import type { FilterDefinition, FilterDefinitionUsage } from '../filter';
import type { Channel } from '../station-definitions/channel-definitions/channel-definitions';
import type { Station } from '../station-definitions/station-definitions/station-definitions';

export interface WaveformAndFilterDefinition {
  readonly filterDefinitionUsage?: FilterDefinitionUsage;
  readonly filterDefinition?: FilterDefinition;
  readonly waveform: ChannelSegmentFaceted;
}

/**
 * Represents a measurement of a signal detection feature,
 * including arrival time, azimuth, slowness and phase
 */
export interface FeatureMeasurement {
  readonly channel: VersionReference<'name', Channel> | Channel;
  readonly measuredChannelSegment?: {
    readonly id: ChannelSegmentDescriptor;
  };
  readonly measurementValue: FeatureMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType;
  /** Signal to Noise Ratio as a DoubleValue */
  readonly snr?: DoubleValue;
  /** Only defined in ArrivalTime FM when derived from filter def */
  readonly analysisWaveform?: WaveformAndFilterDefinition;
}

export interface AmplitudeFeatureMeasurement extends FeatureMeasurement {
  readonly measuredValue: AmplitudeMeasurementValue;
  readonly featureMeasurementType: AmplitudeFeatureMeasurementType;
}

export interface ArrivalTimeFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: ArrivalTimeMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME;
}

export interface DurationFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: DurationMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.SIGNAL_DURATION;
}

export interface PhaseTypeFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: PhaseTypeMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.PHASE;
}

export interface LongPeriodFirstMotionFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: FirstMotionMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.LONG_PERIOD_FIRST_MOTION;
}

export interface ShortPeriodFirstMotionFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: FirstMotionMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.SHORT_PERIOD_FIRST_MOTION;
}

export interface AzimuthFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: NumericMeasurementValue;
  readonly featureMeasurementType:
    | FeatureMeasurementType.RECEIVER_TO_SOURCE_AZIMUTH
    | FeatureMeasurementType.SOURCE_TO_RECEIVER_AZIMUTH;
}

export interface SlownessFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: NumericMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.SLOWNESS;
}

export interface RectilinearityFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: NumericMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.RECTILINEARITY;
}

export interface EmergenceAngleFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: NumericMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.EMERGENCE_ANGLE;
}

export interface SnrFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: NumericMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.SNR;
}

export interface MagnitudeCorrectionFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: NumericMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.MAGNITUDE_CORRECTION;
}

export interface SourceToReceiverDistanceFeatureMeasurement extends FeatureMeasurement {
  readonly measurementValue: NumericMeasurementValue;
  readonly featureMeasurementType: FeatureMeasurementType.SOURCE_TO_RECEIVER_DISTANCE;
}

/**
 * Represents Feature Measurement Value (fields are dependent on type of FM)
 */
export type FeatureMeasurementValue =
  | AmplitudeMeasurementValue
  | ArrivalTimeMeasurementValue
  | DurationMeasurementValue
  | NumericMeasurementValue
  | EnumeratedMeasurementValue;

/**
 * Generic value object which are the foundational building blocks to
 * the FeatureMeasurementValue definition
 */
export type ValueType = DoubleValue | DurationValue | InstantValue;

// TODO: remove units
export interface DurationValue {
  readonly value: number;
  readonly standardDeviation?: number;
  readonly units: Units;
}

// TODO: remove units
export interface InstantValue {
  readonly value: number;
  readonly standardDeviation?: number;
  readonly units: Units;
}

/**
 * Represents Feature Measurement Value for a amplitude type.
 */
export interface AmplitudeMeasurementValue {
  readonly amplitude: number;
  readonly period?: number; // from a Java Duration
  readonly measurementTime?: number; // from a Java Instant
  readonly measurementWindowStart?: number; // from a Java Instant
  readonly measurementWindowDuration?: number; // from a Java Duration
  readonly clipped?: boolean;
  readonly units: Units;
}

/**
 * Represents Feature Measurement Value for Arrival Time FM Type.
 */
export interface ArrivalTimeMeasurementValue {
  readonly arrivalTime: InstantValue;
  readonly travelTime?: DurationValue;
}

/**
 * Represents Feature Measurement Value for Duration FM Type
 */
export interface DurationMeasurementValue {
  readonly startTime: InstantValue;
  readonly duration: DurationValue;
}

/**
 * Represents Feature Measurement Value for a numeric type.
 */
export interface NumericMeasurementValue {
  readonly measuredValue: DoubleValue;
  readonly referenceTime?: number; // from a Java Instant string
}

/**
 * Represents Feature Measurement Value for enumerated types
 */
export interface EnumeratedMeasurementValue {
  readonly value: FirstMotionType | string;
  readonly confidence?: number;
  readonly referenceTime?: number;
}

/**
 * Represents Feature Measurement Value for a phase type.
 */
export interface PhaseTypeMeasurementValue extends EnumeratedMeasurementValue {
  readonly value: string;
}

/**
 * Represents Feature Measurement Value for first motion types
 */
export interface FirstMotionMeasurementValue extends EnumeratedMeasurementValue {
  readonly value: FirstMotionType;
}

/**
 * Enumeration of feature measurement type names
 */
export enum FeatureMeasurementType {
  ARRIVAL_TIME = 'ARRIVAL_TIME',
  EMERGENCE_ANGLE = 'EMERGENCE_ANGLE',
  SOURCE_TO_RECEIVER_AZIMUTH = 'SOURCE_TO_RECEIVER_AZIMUTH',
  RECEIVER_TO_SOURCE_AZIMUTH = 'RECEIVER_TO_SOURCE_AZIMUTH',
  SLOWNESS = 'SLOWNESS',
  SIGNAL_DURATION = 'SIGNAL_DURATION',
  PHASE = 'PHASE',
  AMPLITUDE_A5_OVER_2 = 'AMPLITUDE_A5_OVER_2',
  AMPLITUDE_ANL_OVER_2 = 'AMPLITUDE_ANL_OVER_2',
  AMPLITUDE_ALR_OVER_2 = 'AMPLITUDE_ALR_OVER_2',
  AMPLITUDE_A5_OVER_2_OR = 'AMPLITUDE_A5_OVER_2_OR',
  AMPLITUDE_ANP_OVER_2 = 'AMPLITUDE_ANP_OVER_2',
  AMPLITUDE_FKSNR = 'AMPLITUDE_FKSNR',
  AMPLITUDE_LRM0 = 'AMPLITUDE_LRM0',
  AMPLITUDE_NOI_LRM0 = 'AMPLITUDE_noiLRM0',
  AMPLITUDE_RMSAMP = 'AMPLITUDE_RMSAMP',
  AMPLITUDE_SBSNR = 'AMPLITUDE_SBSNR',
  PERIOD = 'PERIOD',
  RECTILINEARITY = 'RECTILINEARITY',
  SNR = 'SNR',
  LONG_PERIOD_FIRST_MOTION = 'LONG_PERIOD_FIRST_MOTION',
  SHORT_PERIOD_FIRST_MOTION = 'SHORT_PERIOD_FIRST_MOTION',
  SOURCE_TO_RECEIVER_DISTANCE = 'SOURCE_TO_RECEIVER_DISTANCE',
  MAGNITUDE_CORRECTION = 'MAGNITUDE_CORRECTION'
}

// TODO: Resolve redundant enum
export enum AmplitudeType {
  AMPLITUDE_A5_OVER_2 = 'AMPLITUDE_A5_OVER_2',
  AMPLITUDE_A5_OVER_2_OR = 'AMPLITUDE_A5_OVER_2_OR',
  AMPLITUDE_ALR_OVER_2 = 'AMPLITUDE_ALR_OVER_2',
  AMPLITUDEh_ALR_OVER_2 = 'AMPLITUDEh_ALR_OVER_2',
  AMPLITUDE_ANL_OVER_2 = 'AMPLITUDE_ANL_OVER_2',
  AMPLITUDE_SBSNR = 'AMPLITUDE_SBSNR',
  AMPLITUDE_FKSNR = 'AMPLITUDE_FKSNR'
}

export enum FirstMotionType {
  COMPRESSION = 'COMPRESSION',
  DILATION = 'DILATION',
  INDETERMINATE = 'INDETERMINATE'
}

/**
 * Type filter for amplitude feature measurements
 */
type AmplitudeFeatureMeasurementType =
  (typeof FeatureMeasurementType)[keyof typeof FeatureMeasurementType & `AMPLITUDE_${string}`];

/**
 * Signal detection hypothesis id interface
 */
export interface SignalDetectionHypothesisId {
  readonly id: string;
  readonly signalDetectionId: string;
}

/**
 * Faceted Signal Detection Hypothesis
 */
export interface SignalDetectionHypothesisFaceted {
  readonly id: SignalDetectionHypothesisId;
}

/**
 * Signal detection hypothesis interface used in Signal detection
 */
export interface SignalDetectionHypothesis extends Faceted<SignalDetectionHypothesisFaceted> {
  readonly monitoringOrganization: string;
  readonly deleted: boolean;
  readonly station: VersionReference<'name', Station> | Station; // Based on COI this might be a full station (but is not needed in ui)
  readonly featureMeasurements: FeatureMeasurement[];
  readonly parentSignalDetectionHypothesis?: SignalDetectionHypothesisFaceted | null;
}

/**
 * Represents a Signal detection
 */
export interface SignalDetection {
  readonly id: string;
  readonly monitoringOrganization: string;
  readonly station: EntityReference<'name', Station>;
  readonly signalDetectionHypotheses: SignalDetectionHypothesis[];
  /** the current FK channel segment descriptor id */
  readonly _uiFkChannelSegmentDescriptorId?: ChannelSegmentDescriptor;
  /** the current FK beam channel segment descriptor id */
  readonly _uiFkBeamChannelSegmentDescriptorId?: ChannelSegmentDescriptor;
  /** indicates if a signal detection has unsaved changes: the number represents the last time it was changed (epoch seconds) */
  readonly _uiHasUnsavedChanges?: number;
  /** indicates if a signal detection has unsaved association changes: the number represents the last time it was changed (epoch seconds) */
  readonly _uiHasUnsavedEventSdhAssociation?: number;
}

export type SignalDetectionIdString = SignalDetection['id'];

export interface SignalDetectionsWithChannelSegments {
  readonly signalDetections: SignalDetection[];
  readonly channelSegments: ChannelSegment<Timeseries>[];
}

/**
 * Basic info for a hypothesis
 */
export interface ConflictingSdHypData {
  readonly eventId: string;
  readonly phase: string;
  readonly arrivalTime: number;
  readonly stationName?: string;
  readonly eventTime?: number;
}

/**
 * Signal Detection Status either deleted or
 * association status to event
 */
export enum SignalDetectionStatus {
  OPEN_ASSOCIATED = 'Open',
  COMPLETE_ASSOCIATED = 'Completed',
  OTHER_ASSOCIATED = 'Other',
  UNASSOCIATED = 'Unassociated',
  DELETED = 'Deleted'
}

export interface SignalDetectionAssociationStatus {
  readonly signalDetectionId: string;
  readonly associationStatus: SignalDetectionStatus;
}
