package gms.shared.event.coi.featureprediction;

/** Literals for different types of derivatives. */
public enum FeaturePredictionDerivativeType {
  DERIVATIVE_WRT_DEPTH,
  DERIVATIVE_WRT_LATITUDE,
  DERIVATIVE_WRT_LONGITUDE,
  DERIVATIVE_WRT_TIME,
  // TODO: Not in guidance, but used by ApacheBicubicSplineInterpolator.  Delete when ABSI goes
  // away.
  DERIVATIVE_WRT_DISTANCE
}
