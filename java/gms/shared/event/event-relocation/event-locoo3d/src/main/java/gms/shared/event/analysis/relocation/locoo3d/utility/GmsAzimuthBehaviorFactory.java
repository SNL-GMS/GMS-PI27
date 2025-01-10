package gms.shared.event.analysis.relocation.locoo3d.utility;

import static java.lang.Math.toDegrees;

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
import gov.sandia.gmp.util.globals.Globals;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Utility class for generating the Azimuth components of a LocOo3d -> GMS COI conversion */
final class GmsAzimuthBehaviorFactory {

  private static final Logger LOGGER = LoggerFactory.getLogger(GmsAzimuthBehaviorFactory.class);

  /**
   * Map from GeoAttributes to FeaturePredictionComponentType that includes all the azimuth
   * components that add up to the total azimuth
   */
  private static final Map<GeoAttributes, FeaturePredictionComponentType> AZ_COMPONENT_MAP =
      Map.of(
          GeoAttributes.AZIMUTH_BASEMODEL, FeaturePredictionComponentType.BASEMODEL_PREDICTION,
          GeoAttributes.AZIMUTH_PATH_CORRECTION, FeaturePredictionComponentType.PATH_CORRECTION,
          GeoAttributes.AZIMUTH_MASTER_EVENT_CORRECTION,
              FeaturePredictionComponentType.MASTER_EVENT_CORRECTION);

  private GmsAzimuthBehaviorFactory() {
    // utility class
  }

  /**
   * Generates a collection of {@link LocationBehavior}s for a RECEIVER_TO_SOURCE_AZIMUTH {@link
   * FeatureMeasurement}
   *
   * @param azimuthFm an azimuth {@link FeatureMeasurement}
   * @param observation the {@link Observation}
   * @param newEventLocation the new {@link EventLocation}
   * @param stationLocation the {@link Location} of the observing {@link Station}
   * @return the collection of {@link LocationBehavior}s
   */
  static Collection<LocationBehavior> create(
      FeatureMeasurement<?> azimuthFm,
      Observation observation,
      EventLocation newEventLocation,
      Location stationLocation) {

    var behaviors = new ArrayList<LocationBehavior>();

    if (GmsOutputConverter.areValid(observation.getAzimuth(), observation.getDelaz())) {
      var featurePredictionValueOptional = getAzimuthPredictionValue(observation);
      var featurePredictionOptional =
          featurePredictionValueOptional.map(
              featurePredictionValue ->
                  FeaturePrediction.<NumericFeaturePredictionValue>builder()
                      .setChannel(azimuthFm.getChannel())
                      .setSourceLocation(newEventLocation)
                      .setReceiverLocation(stationLocation)
                      .setPhase(PhaseType.valueOf(observation.getPhase().toString()))
                      .setPredictionType(
                          FeaturePredictionType.RECEIVER_TO_SOURCE_AZIMUTH_PREDICTION_TYPE)
                      .setPredictionValue(featurePredictionValue)
                      .build());

      featurePredictionOptional.ifPresent(
          featurePrediction ->
              behaviors.add(
                  LocationBehavior.from(
                      Math.toDegrees(observation.getAzres()),
                      GmsOutputConverter.toInverseDegrees(observation.getAzWeight()),
                      observation.isAzdef(),
                      featurePrediction,
                      azimuthFm)));
    }

    return behaviors;
  }

  /**
   * Generates the {@link NumericFeaturePredicitionValue} for a RECEIVER_TO_SOURCE_AZIMUTH {@link
   * FeatureMeasurement}
   *
   * @param observation
   * @return
   */
  private static Optional<NumericFeaturePredictionValue> getAzimuthPredictionValue(
      Observation observation) {

    var predictedValueOptional =
        Optional.ofNullable(observation.getPredictions().get(GeoAttributes.AZIMUTH))
            .filter(prediction -> !ConverterUtility.isNaValue(prediction))
            .map(
                predictionRadians ->
                    NumericMeasurementValue.from(
                        Optional.empty(),
                        DoubleValue.from(
                            Math.toDegrees(predictionRadians),
                            Optional.of(
                                Math.toDegrees(
                                    observation
                                        .getPredictions()
                                        .get(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY))),
                            Units.DEGREES)));

    return predictedValueOptional.map(
        predictedValue ->
            NumericFeaturePredictionValue.from(
                FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
                predictedValue,
                getAzimuthDerivativeMap(observation),
                getAzimuthPredictionComponents(observation)));
  }

  /**
   * Generates the derivative map for a RECEIVER_TO_SOURCE_AZIMUTH {@link FeatureMeasurement}
   *
   * @param observation
   * @return
   */
  private static EnumMap<FeaturePredictionDerivativeType, DoubleValue> getAzimuthDerivativeMap(
      Observation observation) {

    EnumMap<FeaturePredictionDerivativeType, DoubleValue> derivativeMap =
        new EnumMap<>(FeaturePredictionDerivativeType.class);

    Double prediction = observation.getPredictions().get(GeoAttributes.DAZ_DLAT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_LATITUDE,
          DoubleValue.from(prediction, Optional.empty(), Units.UNITLESS));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DAZ_DLON);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_LONGITUDE,
          DoubleValue.from(prediction, Optional.empty(), Units.UNITLESS));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DAZ_DR);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
          DoubleValue.from(-toDegrees(prediction), Optional.empty(), Units.DEGREES_PER_KM));
    }

    prediction = observation.getPredictions().get(GeoAttributes.DAZ_DTIME);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      derivativeMap.put(
          FeaturePredictionDerivativeType.DERIVATIVE_WRT_TIME,
          DoubleValue.from(toDegrees(prediction), Optional.empty(), Units.DEGREES_PER_SECOND));
    }

    return derivativeMap;
  }

  /**
   * Generates the {@link FeaturePredictionComponent}s for a RECEIVER_TO_SOURCE_AZIMUTH {@link
   * FeatureMeasurement}
   *
   * @param observation
   * @return
   */
  private static Set<FeaturePredictionComponent<DoubleValue>> getAzimuthPredictionComponents(
      Observation observation) {

    Set<FeaturePredictionComponent<DoubleValue>> featurePredictionComponents = new HashSet<>();

    double total =
        AZ_COMPONENT_MAP.entrySet().stream()
            .filter(
                entry ->
                    GmsOutputConverter.isValidPrediction(
                        observation.getPredictions().get(entry.getKey())))
            .mapToDouble(
                (Map.Entry<GeoAttributes, FeaturePredictionComponentType> entry) -> {
                  var prediction = observation.getPredictions().get(entry.getKey());
                  var c =
                      FeaturePredictionComponent.from(
                          DoubleValue.from(toDegrees(prediction), Optional.empty(), Units.DEGREES),
                          false,
                          entry.getValue());
                  featurePredictionComponents.add(c);
                  LOGGER.debug(
                      "Azimuth feature prediction component type ({}) with value ({}) added to"
                          + " component set.",
                      c.getFeaturePredictionComponent(),
                      c.getValue().getValue());
                  return prediction;
                })
            .collect(
                () -> new double[] {0.0},
                (sum, value) -> sum[0] = (sum[0] + value + Globals.TWO_PI) % Globals.TWO_PI,
                (sum, partialSum) ->
                    sum[0] = (sum[0] + partialSum[0] + Globals.TWO_PI) % Globals.TWO_PI)[0];

    // check that the sum of the azimuth components equals the predicted azimuth
    if (!DoubleMath.fuzzyEquals(
        total, observation.getPrediction(GeoAttributes.AZIMUTH), GmsOutputConverter.TOLERANCE)) {
      LOGGER.warn(
          "Sum of azimuth prediction components ({}) != the predicted azimuth ({})",
          total,
          observation.getAzimuth());
    }

    Double prediction =
        observation
            .getPredictions()
            .get(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY_STATION_PHASE_DEPENDENT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      FeaturePredictionComponent<DoubleValue> c =
          FeaturePredictionComponent.from(
              DoubleValue.from(toDegrees(prediction), Optional.empty(), Units.DEGREES),
              false,
              FeaturePredictionComponentType.UNCERTAINTY_STATION_PHASE_DEPENDENT);
      featurePredictionComponents.add(c);
    }

    prediction =
        observation.getPredictions().get(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY_PATH_DEPENDENT);
    if (GmsOutputConverter.isValidPrediction(prediction)) {
      FeaturePredictionComponent<DoubleValue> c =
          FeaturePredictionComponent.from(
              DoubleValue.from(toDegrees(prediction), Optional.empty(), Units.DEGREES),
              false,
              FeaturePredictionComponentType.UNCERTAINTY_PATH_DEPENDENT);
      featurePredictionComponents.add(c);
    }

    return featurePredictionComponents;
  }
}
