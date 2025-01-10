package gms.shared.event.analysis.relocation.locoo3d.utility;

import static java.lang.Math.toDegrees;

import com.google.common.math.DoubleMath;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.event.coi.featureprediction.FeaturePredictionDerivativeType;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gov.sandia.gmp.baseobjects.globals.GeoAttributes;
import gov.sandia.gmp.baseobjects.observation.Observation;
import java.time.Duration;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Utility class for generating components of the Arrival Time Predictions */
final class GmsArrivalTimePredictionFactory {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(GmsArrivalTimePredictionFactory.class);

  /**
   * Map from GeoAttributes to FeaturePredictionComponentType that includes all the travel_time
   * components that add up to the total travel time
   */
  private static final Map<GeoAttributes, FeaturePredictionComponentType> TT_COMPONENT_MAP =
      Map.of(
          GeoAttributes.TT_BASEMODEL, FeaturePredictionComponentType.BASEMODEL_PREDICTION,
          GeoAttributes.TT_ELEVATION_CORRECTION,
              FeaturePredictionComponentType.ELEVATION_CORRECTION,
          GeoAttributes.TT_ELLIPTICITY_CORRECTION,
              FeaturePredictionComponentType.ELLIPTICITY_CORRECTION,
          GeoAttributes.TT_PATH_CORRECTION, FeaturePredictionComponentType.PATH_CORRECTION,
          GeoAttributes.TT_MASTER_EVENT_CORRECTION,
              FeaturePredictionComponentType.MASTER_EVENT_CORRECTION);

  private GmsArrivalTimePredictionFactory() {
    // utility class
  }

  /**
   * Generates the {@link FeaturePredictionComponent}s for an ARRIVAL_TIME {@link
   * FeatureMeasurement}
   *
   * @param observation the {@link Observation}
   * @return a Set of arrival time {@link FeaturePredictionComponent}s
   */
  static Set<FeaturePredictionComponent<DurationValue>> createArrivalTimePredictionComponents(
      Observation observation) {

    Set<FeaturePredictionComponent<DurationValue>> featurePredictionComponents = new HashSet<>();

    // TT_COMPONENT_MAP predictions
    var total =
        TT_COMPONENT_MAP.entrySet().stream()
            .filter(
                entry ->
                    GmsOutputConverter.isValidPrediction(
                        observation.getPredictions().get(entry.getKey())))
            .mapToDouble(
                (Map.Entry<GeoAttributes, FeaturePredictionComponentType> entry) -> {
                  var prediction = observation.getPredictions().get(entry.getKey());
                  var c =
                      FeaturePredictionComponent.from(
                          DurationValue.from(
                              GmsOutputConverter.durationFromSeconds(prediction), Duration.ZERO),
                          false,
                          entry.getValue());
                  featurePredictionComponents.add(c);
                  return prediction;
                })
            .sum();

    // check that the sum of the travel time components equals the total predicted travel time
    if (!DoubleMath.fuzzyEquals(
        total,
        observation.getPrediction(GeoAttributes.TRAVEL_TIME),
        GmsOutputConverter.TOLERANCE)) {
      LOGGER.warn(
          "Sum of prediction travel time components ({}) != the predicted travel time ({})",
          total,
          observation.getTravelTime());
    }

    // TT_MODEL_UNCERTAINTY_DISTANCE_DEPENDENT prediction
    var prediction =
        observation.getPredictions().get(GeoAttributes.TT_MODEL_UNCERTAINTY_DISTANCE_DEPENDENT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      FeaturePredictionComponent<DurationValue> c =
          FeaturePredictionComponent.from(
              DurationValue.from(GmsOutputConverter.durationFromSeconds(prediction), Duration.ZERO),
              false,
              FeaturePredictionComponentType.UNCERTAINTY_DISTANCE_DEPENDENT);
      featurePredictionComponents.add(c);
    }

    // TT_MODEL_UNCERTAINTY_PATH_DEPENDENT prediction
    prediction =
        observation.getPredictions().get(GeoAttributes.TT_MODEL_UNCERTAINTY_PATH_DEPENDENT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      FeaturePredictionComponent<DurationValue> c =
          FeaturePredictionComponent.from(
              DurationValue.from(GmsOutputConverter.durationFromSeconds(prediction), Duration.ZERO),
              false,
              FeaturePredictionComponentType.UNCERTAINTY_PATH_DEPENDENT);
      featurePredictionComponents.add(c);
    }

    return featurePredictionComponents;
  }

  /**
   * Generates the derivative map for an ARRIVAL_TIME {@link FeatureMeasurement}
   *
   * @param observation the {@link Observation}
   * @return the arrival time derivative map (an EnumMap from {@link
   *     FeaturePredictionDerivativeType} to {@link DoubleValue}
   */
  static EnumMap<FeaturePredictionDerivativeType, DoubleValue> createArrivalTimeDerivativeMap(
      Observation observation) {

    Double prediction;
    EnumMap<FeaturePredictionDerivativeType, DoubleValue> derivativeMap =
        new EnumMap<>(FeaturePredictionDerivativeType.class);

    prediction = observation.getPredictions().get(GeoAttributes.DTT_DLAT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_LATITUDE,
          DoubleValue.from(toDegrees(prediction), Optional.empty(), Units.SECONDS_PER_DEGREE));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DTT_DLON);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_LONGITUDE,
          DoubleValue.from(toDegrees(prediction), Optional.empty(), Units.SECONDS_PER_DEGREE));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DTT_DR);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
          DoubleValue.from(-prediction, Optional.empty(), Units.SECONDS_PER_KILOMETER));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DTT_DTIME);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_TIME,
          DoubleValue.from(prediction, Optional.empty(), Units.UNITLESS));
    }

    return derivativeMap;
  }
}
