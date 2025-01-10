import type { ChannelSegmentTypes } from '../common-model';
import type { AzimuthSlownessValues } from '../fk';
import type {
  AmplitudeMeasurementValue,
  ArrivalTimeFeatureMeasurement,
  ArrivalTimeMeasurementValue,
  AzimuthFeatureMeasurement,
  EmergenceAngleFeatureMeasurement,
  FeatureMeasurement,
  FirstMotionMeasurementValue,
  LongPeriodFirstMotionFeatureMeasurement,
  NumericMeasurementValue,
  PhaseTypeFeatureMeasurement,
  PhaseTypeMeasurementValue,
  RectilinearityFeatureMeasurement,
  ShortPeriodFirstMotionFeatureMeasurement,
  SignalDetection,
  SignalDetectionHypothesis,
  SlownessFeatureMeasurement,
  WaveformAndFilterDefinition
} from './types';
import { FeatureMeasurementType } from './types';

/**
 * Type guard for {@link ArrivalTimeFeatureMeasurement}
 */
export function isArrivalTimeFeatureMeasurement(
  object: unknown
): object is ArrivalTimeFeatureMeasurement {
  if (!object) return false;
  return (
    (object as ArrivalTimeFeatureMeasurement).featureMeasurementType ===
    FeatureMeasurementType.ARRIVAL_TIME
  );
}

/**
 * Checks if Signal detection ArrivalTimeMeasurementValue
 *
 * @param object FeatureMeasurementValue
 * @returns boolean
 */
export function isArrivalTimeMeasurementValue(object: any): object is ArrivalTimeMeasurementValue {
  return object && object.arrivalTime !== undefined;
}

/**
 * Type guard for {@link AzimuthFeatureMeasurement} with feature measurement type RECEIVER_TO_SOURCE_AZIMUTH
 */
export function isReceiverToSourceAzimuthFeatureMeasurement(
  object: unknown
): object is AzimuthFeatureMeasurement {
  if (!object) return false;
  return (
    (object as AzimuthFeatureMeasurement).featureMeasurementType ===
    FeatureMeasurementType.RECEIVER_TO_SOURCE_AZIMUTH
  );
}

/**
 * Type guard for {@link AzimuthFeatureMeasurement}
 */
export function isAzimuthFeatureMeasurement(object: unknown): object is AzimuthFeatureMeasurement {
  if (!object) return false;
  return (
    (object as AzimuthFeatureMeasurement).featureMeasurementType ===
      FeatureMeasurementType.RECEIVER_TO_SOURCE_AZIMUTH ||
    (object as AzimuthFeatureMeasurement).featureMeasurementType ===
      FeatureMeasurementType.SOURCE_TO_RECEIVER_AZIMUTH
  );
}

/**
 * Type guard for {@link SlownessFeatureMeasurement}
 */
export function isSlownessFeatureMeasurement(
  object: unknown
): object is SlownessFeatureMeasurement {
  if (!object) return false;
  return (
    (object as SlownessFeatureMeasurement).featureMeasurementType ===
    FeatureMeasurementType.SLOWNESS
  );
}

/**
 * Type guard for {@link PhaseTypeFeatureMeasurement}
 */
export function isPhaseTypeFeatureMeasurement(
  object: unknown
): object is PhaseTypeFeatureMeasurement {
  if (!object) return false;
  return (
    (object as PhaseTypeFeatureMeasurement).featureMeasurementType === FeatureMeasurementType.PHASE
  );
}

/**
 * Checks if Signal detection PhaseMeasurementValue
 *
 * @param object FeatureMeasurementValue
 * @returns boolean
 */
export function isPhaseMeasurementValue(object: any): object is PhaseTypeMeasurementValue {
  return object.value !== undefined && object.standardDeviation !== undefined;
}

/**
 * Type guard for {@link RectilinearityFeatureMeasurement}
 */
export function isRectilinearityFeatureMeasurement(
  object: unknown
): object is RectilinearityFeatureMeasurement {
  if (!object) return false;
  return (
    (object as RectilinearityFeatureMeasurement).featureMeasurementType ===
    FeatureMeasurementType.RECTILINEARITY
  );
}

/**
 * Type guard for {@link EmergenceAngleFeatureMeasurement}
 */
export function isEmergenceAngleFeatureMeasurement(
  object: unknown
): object is EmergenceAngleFeatureMeasurement {
  if (!object) return false;
  return (
    (object as EmergenceAngleFeatureMeasurement).featureMeasurementType ===
    FeatureMeasurementType.EMERGENCE_ANGLE
  );
}

/**
 * Type guard for {@link LongPeriodFirstMotionFeatureMeasurement}
 */
export function isLongPeriodFirstMotionFeatureMeasurement(
  object: unknown
): object is LongPeriodFirstMotionFeatureMeasurement {
  if (!object) return false;
  return (
    (object as LongPeriodFirstMotionFeatureMeasurement).featureMeasurementType ===
    FeatureMeasurementType.LONG_PERIOD_FIRST_MOTION
  );
}

/**
 * Type guard for {@link ShortPeriodFirstMotionFeatureMeasurement}
 */
export function isShortPeriodFirstMotionFeatureMeasurement(
  object: unknown
): object is ShortPeriodFirstMotionFeatureMeasurement {
  if (!object) return false;
  return (
    (object as ShortPeriodFirstMotionFeatureMeasurement).featureMeasurementType ===
    FeatureMeasurementType.SHORT_PERIOD_FIRST_MOTION
  );
}

/**
 * Checks if Signal detection NumericMeasurementValue
 *
 * @param object FeatureMeasurementValue
 * @returns boolean
 */
export function isNumericMeasurementValue(object: any): object is NumericMeasurementValue {
  return object.measuredValue !== undefined;
}

/**
 * Checks if Signal detection AmplitudeMeasurementValue
 *
 * @param object FeatureMeasurementValue
 * @returns boolean
 */
export function isAmplitudeFeatureMeasurementValue(
  object: any
): object is AmplitudeMeasurementValue {
  return (
    object !== undefined &&
    object.amplitude !== undefined &&
    object.period !== undefined &&
    object.measurementTime !== undefined &&
    object.measurementWindowDuration !== undefined &&
    object.measurementWindowStart !== undefined &&
    object.clipped !== undefined
  );
}

/**
 * Get the current Hypothesis from the set of Hypotheses. This will be the last entry in the set if there is one
 * Returns undefined on empty arrays
 *
 * @param hypotheses the set of Hypotheses.
 * @return the current Hypothesis
 */
export function getCurrentHypothesis(
  hypotheses: SignalDetectionHypothesis[]
): SignalDetectionHypothesis {
  return hypotheses[hypotheses.length - 1];
}

/**
 * Searches Feature Measurements for the desired Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 * @param featureMeasurementType Enum of desired Feature Measurement desired
 *
 * @returns FeatureMeasurement or undefined if not found
 */
export function findFeatureMeasurementByType(
  featureMeasurements: FeatureMeasurement[],
  featureMeasurementType: FeatureMeasurementType
): FeatureMeasurement | undefined {
  if (featureMeasurements && featureMeasurementType) {
    return featureMeasurements.find(fm => fm?.featureMeasurementType === featureMeasurementType);
  }
  return undefined;
}

/**
 * Searches Feature Measurements for the ArrivalTime Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns ArrivalTime FeatureMeasurement or undefined if not found
 */
export function findArrivalTimeFeatureMeasurement(
  featureMeasurements: FeatureMeasurement[]
): ArrivalTimeFeatureMeasurement {
  const arrivalTimeFeatureMeasurement = featureMeasurements?.find<ArrivalTimeFeatureMeasurement>(
    isArrivalTimeFeatureMeasurement
  );

  if (!arrivalTimeFeatureMeasurement) {
    throw new Error(
      `Invalid feature measurement collection, must have an arrival time feature measurement`
    );
  }
  return arrivalTimeFeatureMeasurement;
}

/**
 * Searches a SignalDetection for the ArrivalTime Feature Measurement
 *
 * @param signalDetection to search for ArrivalTime
 *
 * @returns ArrivalTime FeatureMeasurement or undefined if not found
 */
export function findArrivalTimeFeatureMeasurementUsingSignalDetection(
  signalDetection: SignalDetection
): ArrivalTimeFeatureMeasurement {
  const currentHypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
  return findArrivalTimeFeatureMeasurement(currentHypothesis.featureMeasurements);
}

/**
 * Searches Feature Measurements for the ArrivalTime Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns ArrivalTime FeatureMeasurementValue or undefined if not found
 */
export function findArrivalTimeFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): ArrivalTimeMeasurementValue {
  const fm = findArrivalTimeFeatureMeasurement(featureMeasurements);
  return fm.measurementValue;
}

/**
 * Searches Feature Measurements for the ArrivalTime Feature Measurement's Analysis Waveform
 *
 * @param signalDetection
 * @returns returns the arrival time analysis waveform or undefined
 */
export function findArrivalTimeAnalysisWaveform(
  signalDetection: SignalDetection
): WaveformAndFilterDefinition | undefined {
  const arrivalTimeFeatureMeasurement =
    findArrivalTimeFeatureMeasurementUsingSignalDetection(signalDetection);
  return arrivalTimeFeatureMeasurement.analysisWaveform;
}

/**
 * Searches Feature Measurements for the ArrivalTime Feature Measurement's
 * MeasuredChannelSegment. If exists, returns the id
 *
 * @param signalDetection
 * @returns returns the ID of the MeasuredChannelSegment if exists, otherwise undefined
 */
export function findArrivalTimeMeasuredChannelSegmentDescriptor(
  signalDetection: SignalDetection
): ChannelSegmentTypes.ChannelSegmentDescriptor | undefined {
  const arrivalTimeFeatureMeasurement =
    findArrivalTimeFeatureMeasurementUsingSignalDetection(signalDetection);
  return arrivalTimeFeatureMeasurement.measuredChannelSegment?.id;
}

/**
 * Returns the first part of the name of the channel associated with the first feature
 * measurement associated with a channel
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns the first part of the channel name or undefined if not found
 */
export function findFeatureMeasurementChannelNameHelper(
  featureMeasurements: FeatureMeasurement[]
): string | undefined {
  return featureMeasurements && featureMeasurements.length > 0
    ? featureMeasurements.find(fm => fm?.channel?.name != null && fm?.channel?.name.length > 0)
        ?.channel?.name
    : undefined;
}

/**
 * Returns the first part of the name of the channel associated with the arrival time
 * feature measurement if available, otherwise, returns the first part of the name of
 * the channel associated with the first feature measurement associated with a channel
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns the first part of the channel name or undefined if not found
 */
export function findFeatureMeasurementChannelName(
  featureMeasurements: FeatureMeasurement[]
): string | undefined {
  const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurement(featureMeasurements);
  const channelName =
    arrivalTimeFeatureMeasurement?.channel?.name ??
    findFeatureMeasurementChannelNameHelper(featureMeasurements);

  return channelName ? channelName.split('/')[0] : undefined;
}

/**
 * Searches Feature Measurements for the Azimuth Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Azimuth FeatureMeasurement or undefined if not found
 */
export function findAzimuthFeatureMeasurement(
  featureMeasurements: FeatureMeasurement[]
): AzimuthFeatureMeasurement | undefined {
  return featureMeasurements.find<AzimuthFeatureMeasurement>(isAzimuthFeatureMeasurement);
}

/**
 * Searches Feature Measurements for the Receiver to Source Azimuth Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Azimuth FeatureMeasurement or undefined if not found
 */
export function findReceiverToSourceAzimuthFeatureMeasurement(
  featureMeasurements: FeatureMeasurement[]
): AzimuthFeatureMeasurement | undefined {
  return featureMeasurements.find<AzimuthFeatureMeasurement>(
    isReceiverToSourceAzimuthFeatureMeasurement
  );
}

/**
 * Searches Feature Measurements for the Azimuth Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Azimuth FeatureMeasurementValue or undefined if not found
 */
export function findAzimuthFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): NumericMeasurementValue | undefined {
  const fm = findAzimuthFeatureMeasurement(featureMeasurements);
  return fm ? fm.measurementValue : undefined;
}

/**
 * Searches Feature Measurements for the Slowness Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Slowness FeatureMeasurement or undefined if not found
 */
export function findSlownessFeatureMeasurement(
  featureMeasurements: FeatureMeasurement[]
): SlownessFeatureMeasurement | undefined {
  return featureMeasurements.find<SlownessFeatureMeasurement>(isSlownessFeatureMeasurement);
}

/**
 * Searches Feature Measurements for the Slowness Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Slowness FeatureMeasurementValue or undefined if not found
 */
export function findSlownessFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): NumericMeasurementValue | undefined {
  const fm = findSlownessFeatureMeasurement(featureMeasurements);
  return fm ? fm.measurementValue : undefined;
}

/**
 * Searches Feature Measurements for the Amplitude Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 * @param amplitudeName
 * @returns Amplitude FeatureMeasurement or undefined if not found
 */
export function findAmplitudeFeatureMeasurement(
  featureMeasurements: FeatureMeasurement[],
  amplitudeName: FeatureMeasurementType
): FeatureMeasurement | undefined {
  // Search FeatureMeasurements to find which type of Amplitude was supplied
  return featureMeasurements.find(fm => fm.featureMeasurementType === amplitudeName);
}

/**
 * Searches Feature Measurements for the Amplitude Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 * @param amplitudeName
 * @returns Amplitude FeatureMeasurementValue or undefined if not found
 */
export function findAmplitudeFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[],
  amplitudeName: FeatureMeasurementType
): AmplitudeMeasurementValue | undefined {
  const maybeMeasurement = findAmplitudeFeatureMeasurement(featureMeasurements, amplitudeName);
  return isAmplitudeFeatureMeasurementValue(maybeMeasurement?.measurementValue)
    ? maybeMeasurement?.measurementValue
    : undefined;
}

/**
 * Searches Feature Measurements for the Phase Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Phase FeatureMeasurement or undefined if not found
 */
export function findPhaseFeatureMeasurement(
  featureMeasurements: FeatureMeasurement[]
): PhaseTypeFeatureMeasurement {
  const phaseFeatureMeasurement = featureMeasurements?.find<PhaseTypeFeatureMeasurement>(
    isPhaseTypeFeatureMeasurement
  );

  if (!phaseFeatureMeasurement) {
    throw new Error(
      `Invalid feature measurement collection, must have an phase feature measurement`
    );
  }
  return phaseFeatureMeasurement;
}

/**
 * Searches Feature Measurements for the Phase Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 *
 * @returns Phase FeatureMeasurementValue or undefined if not found
 */
export function findPhaseFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): PhaseTypeMeasurementValue {
  const fm = findPhaseFeatureMeasurement(featureMeasurements);
  return fm.measurementValue;
}

/**
 * Searches Feature Measurements for the Rectilinearity Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 *
 * @returns Rectilinearity FeatureMeasurementValue or undefined if not found
 */
export function findRectilinearityFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): NumericMeasurementValue | undefined {
  const fm = featureMeasurements.find<RectilinearityFeatureMeasurement>(
    isRectilinearityFeatureMeasurement
  );
  return fm ? fm.measurementValue : undefined;
}

/**
 * Searches Feature Measurements for the Emergence_Angle Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 *
 * @returns Emergence_Angle FeatureMeasurementValue or undefined if not found
 */
export function findEmergenceAngleFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): NumericMeasurementValue | undefined {
  const fm = featureMeasurements.find<EmergenceAngleFeatureMeasurement>(
    isEmergenceAngleFeatureMeasurement
  );
  return fm ? fm.measurementValue : undefined;
}

/**
 * Searches Feature Measurements for the ShortPeriodFirstMotion Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 *
 * @returns SHORT_PERIOD_FIRST_MOTION FeatureMeasurementValue or undefined if not found
 */
export function findShortPeriodFirstMotionFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): FirstMotionMeasurementValue | undefined {
  const fm = featureMeasurements.find<ShortPeriodFirstMotionFeatureMeasurement>(
    isShortPeriodFirstMotionFeatureMeasurement
  );
  return fm ? fm.measurementValue : undefined;
}

/**
 * Searches Feature Measurements for the LongPeriodFirstMotion Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 *
 * @returns LongPeriodFirstMotion FeatureMeasurementValue or undefined if not found
 */
export function findLongPeriodFirstMotionFeatureMeasurementValue(
  featureMeasurements: FeatureMeasurement[]
): FirstMotionMeasurementValue | undefined {
  const fm = featureMeasurements.find<LongPeriodFirstMotionFeatureMeasurement>(
    isLongPeriodFirstMotionFeatureMeasurement
  );
  return fm ? fm.measurementValue : undefined;
}

/**
 * Finds the phase from the current hypothesis, phase feature measurement value.
 *
 * @param signalDetection the signal detection we need the phase from
 * @returns a phase value
 */
export function findSignalDetectionPhase(signalDetection: SignalDetection): string {
  const hypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
  return findPhaseFeatureMeasurementValue(hypothesis.featureMeasurements)?.value;
}

/**
 * Given a SD, returns the azimuth and slowness values from the current SDH
 *
 * @param signalDetection
 * @returns azimuth and slowness number values or undefined
 */
export const getAzimuthAndSlownessFromSD = (
  signalDetection: SignalDetection
): AzimuthSlownessValues | undefined => {
  if (!signalDetection) return undefined;
  const currentSdHypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
  const fmAzimuth = findAzimuthFeatureMeasurementValue(currentSdHypothesis.featureMeasurements);
  const fmSlowness = findSlownessFeatureMeasurementValue(currentSdHypothesis.featureMeasurements);

  if (!fmAzimuth || !fmSlowness) return undefined;
  return { azimuth: fmAzimuth.measuredValue.value, slowness: fmSlowness.measuredValue.value };
};
