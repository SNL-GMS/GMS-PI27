package gms.shared.event.analysis.relocation.locoo3d.utility;

import com.google.common.math.DoubleMath;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.event.coi.featureprediction.FeaturePredictionDerivativeType;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.NumericFeaturePredictionValue;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gov.sandia.gmp.baseobjects.globals.GeoAttributes;
import gov.sandia.gmp.baseobjects.observation.Observation;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Utility class for generating the Slowness components of a LocOo3d -> GMS COI conversion */
final class GmsSlownessBehaviorFactory {

  private static final Logger LOGGER = LoggerFactory.getLogger(GmsSlownessBehaviorFactory.class);

  /**
   * Map from GeoAttributes to FeaturePredictionComponentType that includes all the slowness
   * components that add up to the total slowness
   */
  private static final Map<GeoAttributes, FeaturePredictionComponentType> SL_COMPONENT_MAP =
      Map.of(
          GeoAttributes.SLOWNESS_BASEMODEL, FeaturePredictionComponentType.BASEMODEL_PREDICTION,
          GeoAttributes.SLOWNESS_PATH_CORRECTION, FeaturePredictionComponentType.PATH_CORRECTION,
          GeoAttributes.SLOWNESS_MASTER_EVENT_CORRECTION,
              FeaturePredictionComponentType.MASTER_EVENT_CORRECTION);

  private GmsSlownessBehaviorFactory() {
    // utility class
  }

  /**
   * Generates the {@link NumericFeaturePredicitionValue} for a SLOWNESS {@link FeatureMeasurement}
   *
   * @param observation
   * @return
   */
  private static Optional<NumericFeaturePredictionValue> getSlownessPredictionValue(
      Observation observation) {
    var predictedValueOptional =
        Optional.ofNullable(observation.getPredictions().get(GeoAttributes.SLOWNESS))
            .filter(prediction -> !ConverterUtility.isNaValue(prediction))
            .map(
                predictionInverseRadians ->
                    NumericMeasurementValue.from(
                        Optional.empty(),
                        DoubleValue.from(
                            GmsOutputConverter.toInverseDegrees(predictionInverseRadians),
                            Optional.of(
                                GmsOutputConverter.toInverseDegrees(
                                    observation
                                        .getPredictions()
                                        .get(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY))),
                            Units.SECONDS_PER_DEGREE)));

    return predictedValueOptional.map(
        predictedValue ->
            NumericFeaturePredictionValue.from(
                FeatureMeasurementTypes.SLOWNESS,
                predictedValue,
                getSlownessDerivativeMap(observation),
                getSlownessPredictionComponents(observation)));
  }

  /**
   * Generates a collection of {@link LocationBehavior}s for a SLOWNESS {@link FeatureMeasurement}
   *
   * @param slowFm a slowness {@link FeatureMeasurement}
   * @param observation the {@link Observation}
   * @param newEventLocation the new {@link EventLocation}
   * @param stationLocation the {@link Location} of the observing {@link Station}
   * @return the collection of {@link LocationBehavior}s
   */
  static Collection<LocationBehavior> create(
      FeatureMeasurement<?> slowFm,
      Observation observation,
      EventLocation newEventLocation,
      Location stationLocation) {

    var behaviors = new ArrayList<LocationBehavior>();

    if (GmsOutputConverter.areValid(observation.getSlow(), observation.getDelslo())) {
      var featurePredictionValueOptional = getSlownessPredictionValue(observation);
      var featurePredictionOptional =
          featurePredictionValueOptional.map(
              featurePredictionValue ->
                  FeaturePrediction.<NumericFeaturePredictionValue>builder()
                      .setChannel(slowFm.getChannel())
                      .setSourceLocation(newEventLocation)
                      .setReceiverLocation(stationLocation)
                      .setPhase(PhaseType.valueOf(observation.getPhase().toString()))
                      .setPredictionType(FeaturePredictionType.SLOWNESS_PREDICTION_TYPE)
                      .setPredictionValue(featurePredictionValue)
                      .build());

      featurePredictionOptional.ifPresent(
          featurePrediction ->
              behaviors.add(
                  LocationBehavior.from(
                      GmsOutputConverter.toInverseDegrees(observation.getSlores()),
                      Math.toDegrees(observation.getShWeight()),
                      observation.isSlodef(),
                      featurePrediction,
                      slowFm)));
    }

    return behaviors;
  }

  /**
   * Generates the {@link FeaturePredictionComponent}s for a SLOWNESS {@link FeatureMeasurement}
   *
   * @param observation
   * @return
   */
  private static Set<FeaturePredictionComponent<DoubleValue>> getSlownessPredictionComponents(
      Observation observation) {

    Set<FeaturePredictionComponent<DoubleValue>> featurePredictionComponents = new HashSet<>();
    var total =
        SL_COMPONENT_MAP.entrySet().stream()
            .filter(
                entry ->
                    GmsOutputConverter.isValidPrediction(
                        observation.getPredictions().get(entry.getKey())))
            .mapToDouble(
                (Map.Entry<GeoAttributes, FeaturePredictionComponentType> entry) -> {
                  var prediction = observation.getPredictions().get(entry.getKey());
                  var c =
                      FeaturePredictionComponent.from(
                          DoubleValue.from(
                              GmsOutputConverter.toInverseDegrees(prediction),
                              Optional.empty(),
                              Units.SECONDS_PER_DEGREE),
                          false,
                          entry.getValue());
                  featurePredictionComponents.add(c);
                  LOGGER.debug(
                      "Slowness feature prediction component type ({}) with value ({}) added to"
                          + " component set.",
                      c.getFeaturePredictionComponent(),
                      c.getValue().getValue());
                  return prediction;
                })
            .sum();

    // check that the sum of the slowness components equals the predicted slowness
    if (!DoubleMath.fuzzyEquals(
        total, observation.getPrediction(GeoAttributes.SLOWNESS), GmsOutputConverter.TOLERANCE)) {
      LOGGER.warn(
          "Sum of prediction slowness components ({}) != the predicted slowness ({})",
          total,
          observation.getSlow());
    }

    Double prediction =
        observation
            .getPredictions()
            .get(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY_STATION_PHASE_DEPENDENT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      FeaturePredictionComponent<DoubleValue> c =
          FeaturePredictionComponent.from(
              DoubleValue.from(
                  GmsOutputConverter.toInverseDegrees(prediction),
                  Optional.empty(),
                  Units.SECONDS_PER_DEGREE),
              false,
              FeaturePredictionComponentType.UNCERTAINTY_STATION_PHASE_DEPENDENT);
      featurePredictionComponents.add(c);
    }

    prediction =
        observation.getPredictions().get(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY_PATH_DEPENDENT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      FeaturePredictionComponent<DoubleValue> c =
          FeaturePredictionComponent.from(
              DoubleValue.from(
                  GmsOutputConverter.toInverseDegrees(prediction),
                  Optional.empty(),
                  Units.SECONDS_PER_DEGREE),
              false,
              FeaturePredictionComponentType.UNCERTAINTY_PATH_DEPENDENT);
      featurePredictionComponents.add(c);
    }

    return featurePredictionComponents;
  }

  /**
   * Generates the derivative map for a SLOWNESS {@link FeatureMeasurement}
   *
   * @param observation
   * @return
   */
  private static EnumMap<FeaturePredictionDerivativeType, DoubleValue> getSlownessDerivativeMap(
      Observation observation) {

    EnumMap<FeaturePredictionDerivativeType, DoubleValue> derivativeMap =
        new EnumMap<>(FeaturePredictionDerivativeType.class);

    Double prediction = observation.getPredictions().get(GeoAttributes.DSH_DLAT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_LATITUDE,
          DoubleValue.from(
              GmsOutputConverter.toInverseDegrees(GmsOutputConverter.toInverseDegrees(prediction)),
              Optional.empty(),
              Units.SECONDS_PER_DEGREE_SQUARED));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DSH_DLON);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_LONGITUDE,
          DoubleValue.from(
              GmsOutputConverter.toInverseDegrees(GmsOutputConverter.toInverseDegrees(prediction)),
              Optional.empty(),
              Units.SECONDS_PER_DEGREE_SQUARED));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DSH_DR);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
          DoubleValue.from(
              GmsOutputConverter.toInverseDegrees(-prediction),
              Optional.empty(),
              Units.SECONDS_PER_DEGREE_KM));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DSH_DTIME);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_TIME,
          DoubleValue.from(
              GmsOutputConverter.toInverseDegrees(prediction),
              Optional.empty(),
              Units.ONE_OVER_DEGREE));
    }

    return derivativeMap;
  }
}
