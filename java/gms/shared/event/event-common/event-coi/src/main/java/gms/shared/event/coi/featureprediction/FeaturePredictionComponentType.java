package gms.shared.event.coi.featureprediction;

/**
 * An enumeration of the different component types that may be applied to signal feature predictions
 */
public enum FeaturePredictionComponentType {
  BASEMODEL_PREDICTION,
  BULK_STATIC_STATION_CORRECTION,
  ELEVATION_CORRECTION,
  ELLIPTICITY_CORRECTION,
  MASTER_EVENT_CORRECTION,
  PATH_CORRECTION,
  SOURCE_DEPENDENT_CORRECTION,
  UNCERTAINTY_DISTANCE_DEPENDENT,
  UNCERTAINTY_PATH_DEPENDENT,
  UNCERTAINTY_STATION_PHASE_DEPENDENT
}
