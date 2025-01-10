import type { SetKeys } from '../type-util/type-util';

/**
 * JSON fields of type Instance.
 * ! Defines the fields to search that may contain Instance type values for serializing and deserializing
 */
export const JSON_INSTANT_NAMES = [
  'creationTime',
  'currentIntervalEndTime',
  'effectiveAt',
  'effectiveForRequestTime',
  'effectiveTime',
  'effectiveUntil',
  'endTime',
  'measurementTime',
  'measurementWindowStart',
  'modificationTime',
  'processingEndTime',
  'processingStartTime',
  'referenceTime',
  'startTime',
  'time'
] as const;

/**
 * JSON fields of type Duration.
 * ! Defines the fields to search that may contain Duration type values for serializing and deserializing
 */
export const JSON_DURATION_NAMES = [
  'beamDuration',
  'currentIntervalDuration',
  'defaultSDTimeUncertainty',
  'defaultRotationDuration',
  'defaultRotationLeadTime',
  'duration',
  'groupDelaySec',
  'lagBufferDuration',
  'lead',
  'leadBufferDuration',
  'leadDuration',
  'maskedSegmentMergeThreshold',
  'maximumOpenAnythingDuration',
  'measurementWindowDuration',
  'minimumRequestDuration',
  'operationalPeriodEnd',
  'operationalPeriodStart',
  'panDoubleArrow',
  'panningBoundaryDuration',
  'panSingleArrow',
  'period',
  'spectrumStepDuration',
  'timeUncertainty',
  'trimWaveformDuration',
  'trimWaveformLead',
  'trimWaveformRetimeThreshold',
  'zasZoomInterval'
] as const;

/**
 * Custom JSON {@link InstantValue} entries.
 */
export const CUSTOM_JSON_INSTANT_VALUE_NAMES = ['arrivalTime', 'startTime'] as const;

/**
 * Custom JSON {@link DurationValue} entries.
 */
export const CUSTOM_JSON_DURATION_VALUE_NAMES = ['travelTime', 'duration'] as const;

const InstanceKeySet = new Set(JSON_INSTANT_NAMES);
const DurationKeySet = new Set(JSON_DURATION_NAMES);

/**
 * A type containing all key strings which represent instance values in OSD-sent JSON objects.
 * ! Represents the json fields that may contain Instance type values for serializing and deserializing
 */
export type InstanceKeys = SetKeys<typeof InstanceKeySet>;

/**
 * A type containing all key strings which represent duration values in OSD-sent JSON objects.
 * ! Represents the json fields that may contain Duration type values for serializing and deserializing
 */
export type DurationKeys = SetKeys<typeof DurationKeySet>;

/**
 * A type containing all key strings which represent instance and duration values in OSD-sent JSON objects.
 * ! Represents the union of all json fields that may contain Instance or Duration type values for serializing and deserializing
 */
export type AllTimeKeys = InstanceKeys | DurationKeys;
