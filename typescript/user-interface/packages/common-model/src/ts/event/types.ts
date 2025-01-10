import type { ChannelSegment, Timeseries } from '../channel-segment/types';
import type { Distance, DoubleValue } from '../common/types';
import type { CommonTypes } from '../common-model';
import type { EntityReference, VersionReference } from '../faceted';
import type {
  FeatureMeasurement,
  FeatureMeasurementType,
  FeatureMeasurementValue,
  SignalDetection,
  SignalDetectionHypothesisFaceted,
  SignalDetectionHypothesisId,
  ValueType
} from '../signal-detection';
import type { Channel } from '../station-definitions/channel-definitions/channel-definitions';
import type { Station } from '../station-definitions/station-definitions/station-definitions';
import type { WorkflowDefinitionId } from '../workflow/types';

/**
 * Enumerated Restraint Type
 */
export enum RestraintType {
  UNRESTRAINED = 'UNRESTRAINED',
  FIXED = 'FIXED'
}

/**
 * Enumerated Scaling Factor Type
 */
export enum ScalingFactorType {
  CONFIDENCE = 'CONFIDENCE',
  COVERAGE = 'COVERAGE',
  K_WEIGHTED = 'K_WEIGHTED'
}

/**
 * UI specific distance to source object, which has only the fields the UI needs
 */
export interface LocationDistance {
  readonly distance: Distance;
  readonly azimuth: number;
  readonly id: string;
}

/**
 * Event status options
 */
export enum EventStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  NOT_STARTED = 'NOT_STARTED',
  NOT_COMPLETE = 'NOT_COMPLETE'
}

/**
 * Filter status options
 */
export enum FilterStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  NOT_STARTED = 'NOT_STARTED',
  NOT_COMPLETE = 'NOT_COMPLETE'
}

/**
 * Enumerated Depth Restraint Reason
 */
export enum DepthRestraintReason {
  FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS = 'FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS',
  FIXED_AS_STANDARD_DEPTH = 'FIXED_AT_STANDARD_DEPTH',
  FIXED_AT_SURFACE = 'FIXED_AT_SURFACE',
  FIXED_BY_ANALYST = 'FIXED_BY_ANALYST',
  OTHER = 'OTHER'
}

/**
 * Enumerated Feature Prediction Derivative Type
 */
export enum FeaturePredictionDerivativeType {
  DERIVATIVE_WRT_DEPTH = 'DERIVATIVE_WRT_DEPTH',
  DERIVATIVE_WRT_LATITUDE = 'DERIVATIVE_WRT_LATITUDE',
  DERIVATIVE_WRT_LONGITUDE = 'DERIVATIVE_WRT_LONGITUDE',
  DERIVATIVE_WRT_TIME = 'DERIVATIVE_WRT_TIME',
  // TODO: Not in guidance, but used by ApacheBicubicSplineInterpolator.  Delete when ABSI goes away (keep in line with Java)
  DERIVATIVE_WRT_DISTANCE = 'DERIVATIVE_WRT_DISTANCE'
}

/**
 * Enumerated Magnitude Type
 */
export enum MagnitudeType {
  MB = 'MB',
  MB_CODA = 'MB_CODA',
  MB_MB = 'MB_MB',
  MB_MLE = 'MB_MLE',
  MB_PG = 'MB_PG',
  MB_REL_T = 'MB_REL_T',
  ML = 'ML',
  MS = 'MS',
  MS_MLE = 'MS_MLE',
  MS_VMAX = 'MS_VMAX',
  MW_CODA = 'MW_CODA'
}

/**
 * Magnitude Model Enum
 */
export enum MagnitudeModel {
  NUTTLI = 'NUTTLI',
  P_FACTOR = 'P_FACTOR',
  REZAPOUR_PEARCE = 'REZAPOUR_PEARCE',
  RICHTER = 'RICHTER',
  UNKNOWN = 'UNKNOWN',
  NET = 'NET',
  VEITH_CLAWSON = 'VEITH_CLAWSON'
}

/**
 * Prediction Component Type Enum
 */
export enum FeaturePredictionComponentType {
  BASEMODEL_PREDICTION = 'BASEMODEL_PREDICTION',
  BULK_STATIC_STATION_CORRECTION = 'BASE_STATIC_STATION_CORRECTION',
  ELEVATION_CORRECTION = 'ELEVATION_CORRECTION',
  ELLIPTICITY_CORRECTION = 'ELLIPTICITY_CORRECTION',
  MASTER_EVENT_CORRECTION = 'MASTER_EVENT_CORRECTION',
  PATH_CORRECTION = 'PATH_CORRECTION',
  SOURCE_DEPENDENT_CORRECTION = 'SOURCE_DEPENDENT_CORRECTION',
  UNCERTAINTY_DISTANCE_DEPENDENT = 'UNCERTAINTY_DISTANCE_DEPENDENT',
  UNCERTAINTY_PATH_DEPENDENT = 'UNCERTAINTY_PATH_DEPENDENT',
  UNCERTAINTY_STATION_PHASE_DEPENDENT = 'UNCERTAINTY_STATION_PHASE_DEPENDENT'
}

/**
 * Event status info for event status update
 */
export interface EventStatusInfo {
  readonly eventStatus: EventStatus;
  readonly activeAnalystIds: string[];
}

/**
 * Filter status info for event status update
 */
export interface FilterStatusInfo {
  readonly filterStatus: FilterStatus;
  readonly activeAnalystIds: string[];
}

/**
 * Ellipse
 */
export interface Ellipse {
  readonly scalingFactorType: ScalingFactorType;
  readonly kWeight: number;
  readonly confidenceLevel: number;
  readonly semiMajorAxisLengthKm?: number;
  readonly semiMajorAxisTrendDeg?: number;
  readonly semiMinorAxisLengthKm?: number;
  readonly depthUncertaintyKm?: number;
  readonly timeUncertainty?: number;
}

/**
 * Ellipsoid
 */
export interface Ellipsoid {
  readonly scalingFactorType: ScalingFactorType;
  readonly kWeight: number;
  readonly confidenceLevel: number;
  readonly semiMajorAxisLengthKm?: number;
  readonly semiMajorAxisTrendDeg?: number;
  readonly semiMajorAxisPlungeDeg?: number;
  readonly semiIntermediateAxisLengthKm?: number;
  readonly semiIntermediateAxisTrendDeg?: number;
  readonly semiIntermediateAxisPlungeDeg?: number;
  readonly semiMinorAxisLengthKm?: number;
  readonly semiMinorAxisTrendDeg?: number;
  readonly semiMinorAxisPlungeDeg?: number;
  readonly timeUncertainty?: number;
}

/**
 * Location Uncertainty
 */
export interface LocationUncertainty {
  readonly xx?: number;
  readonly xy?: number;
  readonly xz?: number;
  readonly xt?: number;
  readonly yy?: number;
  readonly yz?: number;
  readonly yt?: number;
  readonly zz?: number;
  readonly zt?: number;
  readonly tt?: number;
  readonly stdDevOneObservation?: number;
  readonly ellipses: Ellipse[];
  readonly ellipsoids: Ellipsoid[];
}

/**
 * Station magnitude solution
 */
export interface StationMagnitudeSolution {
  readonly type: MagnitudeType;
  readonly model: MagnitudeModel;
  readonly station: Station;
  readonly phase: string;
  readonly magnitude: DoubleValue;
  readonly measurement?: FeatureMeasurement;
}

/**
 * Network magnitude behavior
 */
export interface NetworkMagnitudeBehavior {
  readonly isDefining: boolean;
  readonly stationMagnitudeSolution: StationMagnitudeSolution;
  readonly residual: number;
  readonly weight: number;
}

/**
 * Network Magnitude Solution
 */
export interface NetworkMagnitudeSolution {
  readonly magnitude: DoubleValue;
  readonly magnitudeBehaviors: NetworkMagnitudeBehavior[];
  readonly type: MagnitudeType;
}

/**
 * Feature Prediction Component
 */
export interface FeaturePredictionComponent {
  readonly value: FeatureMeasurementValue | ValueType;
  readonly extrapolated: boolean;
  readonly predictionComponentType: FeaturePredictionComponentType;
}

export interface PredictionValue {
  readonly featureMeasurementType: FeatureMeasurementType;
  readonly predictedValue: FeatureMeasurementValue;
  readonly derivativeMap?: Partial<Record<FeaturePredictionDerivativeType, ValueType>>;
  readonly featurePredictionComponentSet: FeaturePredictionComponent[];
}

/**
 * Feature prediction
 */
export interface FeaturePrediction {
  readonly phase: string;
  readonly extrapolated: boolean;
  readonly predictionValue: PredictionValue;
  readonly sourceLocation: EventLocation;
  readonly receiverLocation: CommonTypes.Location;
  readonly channel?: VersionReference<'name'> | Channel;
  readonly predictionChannelSegment?: ChannelSegment<Timeseries>;
  readonly predictionType: FeatureMeasurementType;
}

/**
 * Location Restraint
 */
export interface LocationRestraint {
  readonly depthRestraintType: RestraintType;
  readonly depthRestraintReason?: DepthRestraintReason;
  readonly depthRestraintKm?: number;
  readonly positionRestraintType: RestraintType;
  readonly latitudeRestraintDegrees?: number;
  readonly longitudeRestraintDegrees?: number;
  readonly timeRestraintType: RestraintType;
  readonly timeRestraint?: number;
}

/**
 * Event Location
 */
export interface EventLocation {
  readonly latitudeDegrees: number;
  readonly longitudeDegrees: number;
  readonly depthKm: number;
  /** In epoch seconds */
  readonly time: number;
}

/**
 * Location Behavior
 */
export interface LocationBehavior {
  readonly defining: boolean;
  readonly measurement: FeatureMeasurement;
  readonly prediction?: FeaturePrediction;
  readonly residual?: number;
  readonly weight?: number;
}

/**
 * Location Solution
 */
export interface LocationSolution {
  readonly id: string;
  readonly networkMagnitudeSolutions: NetworkMagnitudeSolution[];
  readonly featurePredictions: {
    readonly featurePredictions: FeaturePrediction[];
  };
  readonly locationUncertainty?: LocationUncertainty;
  readonly locationBehaviors: LocationBehavior[];
  readonly location: EventLocation;
  readonly locationRestraint: LocationRestraint;
}

/**
 * Event Hypothesis ID
 */
export interface EventHypothesisId {
  readonly eventId: string;
  readonly hypothesisId: string;
}

/**
 * Event Hypothesis
 */
export interface EventHypothesis {
  readonly id: EventHypothesisId;
  readonly rejected: boolean;
  readonly deleted: boolean;
  readonly parentEventHypotheses: EntityReference<'id', EventHypothesis>[];
  readonly associatedSignalDetectionHypotheses: SignalDetectionHypothesisFaceted[];
  readonly preferredLocationSolution: { id: string };
  readonly locationSolutions: LocationSolution[];
  /** indicates if an event hypothesis has unsaved association changes: the number represents the last time it was changed (epoch seconds) */
  readonly _uiHasUnsavedChanges?: number;
}

/**
 * Preferred Event Hypothesis
 */
export interface PreferredEventHypothesis {
  readonly preferredBy: string;
  readonly stage: WorkflowDefinitionId;
  readonly preferred: EntityReference<'id', EventHypothesis>;
}

/**
 * Event
 */
export interface Event {
  readonly id: string;
  readonly rejectedSignalDetectionAssociations: EntityReference<'id', SignalDetection>[];
  readonly monitoringOrganization: string;
  readonly eventHypotheses: EventHypothesis[];
  readonly preferredEventHypothesisByStage: PreferredEventHypothesis[];
  readonly finalEventHypothesisHistory: EntityReference<'id', EventHypothesis>[];
  readonly overallPreferred?: EntityReference<'id', EventHypothesis>;
  /** indicates if an event has unsaved changes: the number represents the last time it was changed (epoch seconds) */
  readonly _uiHasUnsavedChanges?: number;
}

export interface AssociationConflict {
  signalDetectionHypothesisId: SignalDetectionHypothesisId;
  eventHypothesisIds: EventHypothesisId[];
}

/**
 * Stores the depth
 */
export interface Depth {
  value: number;
  uncertainty?: number;
}
