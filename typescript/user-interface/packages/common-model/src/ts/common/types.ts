// ***************************************
// Mutations
// ***************************************

import type { ChannelSegmentTypes } from '../common-model';

/** The `operation name` for the client log mutation */
export const ClientLogOperationMutationName = 'clientLog';

// ***************************************
// Queries
// ***************************************
export interface VersionInfo {
  versionNumber: string;
  commitSHA: string;
}

// ***************************************
// Model
// ***************************************

/**
 * System Event wrapper used with subscription message
 */
export interface SystemEvent {
  id: string;
  source: string;
  specversion: string;
  type: string;
  data?: unknown;
}

/**
 * System Event Type used with subscriptions
 */
export interface SystemEventType {
  eventType: string;
}

export interface DistanceToSourceInput {
  sourceType: DistanceSourceType;
  sourceId: string;
}

// Map entry of event id to usernames
export interface EventToUsers {
  eventId: string;
  userNames: string[];
}

// Workspace state
export interface WorkspaceState {
  eventToUsers: EventToUsers[];
}

/**
 * The distance value representing degrees and km.
 */
export interface Distance {
  readonly degrees: number;
  readonly km: number;
}

/**
 * Represents a distance measurement relative to a specified source location
 */
export interface DistanceToSource {
  // The distance
  readonly distance: Distance;

  // The azimuth
  readonly azimuth: number;

  // The source location
  readonly sourceLocation: Location;

  // The type of the source the distance is measured to (e.g. and event)
  readonly sourceType: DistanceSourceType;

  // the unique ID of the source object
  readonly sourceId: string;

  // Which station distance to the source
  readonly stationId: string;
}

/**
 * Creation Type, reflects system change or analyst change
 */
export enum CreatorType {
  Analyst = 'Analyst',
  System = 'System'
}

/**
 * Distance value's units degrees or kilometers
 */
export enum DistanceUnits {
  degrees = 'degrees',
  km = 'km'
}

/**
 * Distance to source type
 */
export enum DistanceSourceType {
  Event = 'Event',
  UserDefined = 'UserDefined'
}

/**
 * Time range in epoch seconds
 */
export interface TimeRange {
  startTimeSecs: number;
  endTimeSecs: number;
}

/**
 * Represents a location specified using latitude (degrees), longitude (degrees),
 * and altitude (kilometers).
 */
export interface Location {
  readonly latitudeDegrees: number;
  readonly longitudeDegrees: number;
  readonly elevationKm: number;
  readonly depthKm: number;
}

/**
 * Relative Position information relative to a location
 */
export interface Position {
  readonly northDisplacementKm: number;
  readonly eastDisplacementKm: number;
  readonly verticalDisplacementKm: number;
}

/**
 * Log Level to determine different levels
 *
 * ! the log levels must be all lowercase for the loggers
 */
export enum LogLevel {
  error = 'error',
  warn = 'warn',
  client = 'client',
  info = 'info',
  timing = 'timing',
  data = 'data',
  debug = 'debug'
}

/**
 * Client Log Input
 */
export interface ClientLogInput {
  logLevel: LogLevel;
  message: string;
  time: string;
  userName: string;
}

/**
 * Enumeration representing the different types of stations in the monitoring network.
 */
export enum StationType {
  SEISMIC_3_COMPONENT = 'SEISMIC_3_COMPONENT',
  SEISMIC_1_COMPONENT = 'SEISMIC_1_COMPONENT',
  SEISMIC_ARRAY = 'SEISMIC_ARRAY',
  HYDROACOUSTIC = 'HYDROACOUSTIC',
  HYDROACOUSTIC_ARRAY = 'HYDROACOUSTIC_ARRAY',
  INFRASOUND = 'INFRASOUND',
  INFRASOUND_ARRAY = 'INFRASOUND_ARRAY',
  WEATHER = 'WEATHER',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Represents Feature Measurement Value for a double type.
 */
export interface DoubleValue {
  readonly value: number;
  readonly standardDeviation?: number;
  readonly units: Units;
}

/**
 * Units used in DoubleValue part of feature prediction and DoubleValue part of calibration
 */
export enum Units {
  DEGREES = 'DEGREES',
  DECIBELS = 'DECIBELS',
  RADIANS = 'RADIANS',
  SECONDS = 'SECONDS',
  HERTZ = 'HERTZ',
  SECONDS_PER_DEGREE = 'SECONDS_PER_DEGREE',
  SECONDS_PER_RADIAN = 'SECONDS_PER_RADIAN',
  SECONDS_PER_DEGREE_SQUARED = 'SECONDS_PER_DEGREE_SQUARED',
  SECONDS_PER_KILOMETER_SQUARED = 'SECONDS_PER_KILOMETER_SQUARED',
  SECONDS_PER_KILOMETER = 'SECONDS_PER_KILOMETER',
  SECONDS_PER_KILOMETER_PER_DEGREE = 'SECONDS_PER_KILOMETER_PER_DEGREE',
  ONE_OVER_KM = 'ONE_OVER_KM',
  NANOMETERS = 'NANOMETERS',
  NANOMETERS_PER_SECOND = 'NANOMETERS_PER_SECOND',
  NANOMETERS_PER_COUNT = 'NANOMETERS_PER_COUNT',
  NANOMETERS_SQUARED_PER_SECOND = 'NANOMETERS_SQUARED_PER_SECOND',
  UNITLESS = 'UNITLESS',
  MAGNITUDE = 'MAGNITUDE',
  COUNTS_PER_NANOMETER = 'COUNTS_PER_NANOMETER',
  COUNTS_PER_PASCAL = 'COUNTS_PER_PASCAL',
  PASCALS_PER_COUNT = 'PASCALS_PER_COUNT'
}

export enum SamplingType {
  NEAREST_SAMPLE = 'Nearest sample',
  INTERPOLATED = 'Interpolated'
}

/**
 * Represents a return value for all wasm algorithms, where there were missing input channels provided
 */
export interface TimeseriesWithMissingInputChannels<T> {
  readonly timeseries: T[];
  readonly missingInputChannels: ChannelSegmentTypes.TimeRangesByChannel[];
}
