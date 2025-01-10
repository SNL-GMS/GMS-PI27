package gms.shared.event.analysis.relocation.locoo3d.utility;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.ArrivalTimeFeaturePredictionValue;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.stationdefinition.coi.channel.Location;
import gov.sandia.gmp.baseobjects.globals.GeoAttributes;
import gov.sandia.gmp.baseobjects.observation.Observation;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Optional;

/** Utility class for generating the Arrival components of a LocOo3d -> GMS COI conversion */
final class GmsArrivalBehaviorFactory {

  private GmsArrivalBehaviorFactory() {
    // utility class
  }

  /**
   * Generates and stores a {@link LocationBehavior} for an ARRIVAL_TIME {@link FeatureMeasurement}
   *
   * @param arrivalFm as arrival {@link FeatureMeasurement}
   * @param observation the {@link Observation}
   * @param newEventLocation the new {@link EventLocation}
   * @param stationLocation the {@link Location} of the observing {@link Station}
   * @return the collection of {@link LocationBehavior}s
   */
  static Collection<LocationBehavior> create(
      FeatureMeasurement<?> arrivalFm,
      Observation observation,
      EventLocation newEventLocation,
      Location stationLocation) {

    var behaviors = new ArrayList<LocationBehavior>();

    if (GmsOutputConverter.areValid(observation.getArrivalTime(), observation.getDeltim())) {
      var featurePredictionValueOptional = getArrivalTimePredictionValue(arrivalFm, observation);
      var featurePredictionOptional =
          featurePredictionValueOptional.map(
              featurePredictionValue ->
                  FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
                      .setChannel(arrivalFm.getChannel())
                      .setSourceLocation(newEventLocation)
                      .setReceiverLocation(stationLocation)
                      .setPhase(PhaseType.valueOf(observation.getPhase().toString()))
                      .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
                      .setPredictionValue(featurePredictionValue)
                      .build());

      featurePredictionOptional.ifPresent(
          featurePrediction ->
              behaviors.add(
                  LocationBehavior.from(
                      observation.getTimeres(),
                      observation.getTtWeight(),
                      observation.isTimedef(),
                      featurePrediction,
                      arrivalFm)));
    }

    return behaviors;
  }

  /**
   * Generates the {@link ArrivalTimeFeaturePredictionValue} for an ARRIVAL_TIME {@link
   * FeatureMeasurement}
   *
   * @param observation
   * @return
   */
  private static Optional<ArrivalTimeFeaturePredictionValue> getArrivalTimePredictionValue(
      FeatureMeasurement<?> arrivalFm, Observation observation) {

    var predictedTravelTimeOptional =
        Optional.ofNullable(
            GmsOutputConverter.durationFromSeconds(
                observation.getPredictions().get(GeoAttributes.TRAVEL_TIME)));

    if (predictedTravelTimeOptional.isPresent()) {
      var predictedTravelTime = predictedTravelTimeOptional.get();
      var standardDeviation =
          GmsOutputConverter.durationFromSeconds(
              observation.getPredictions().get(GeoAttributes.TT_MODEL_UNCERTAINTY));

      var fmArrivalTime =
          ((FeatureMeasurement<ArrivalTimeMeasurementValue>) arrivalFm)
              .getMeasurementValue()
              .getArrivalTime()
              .getValue();
      var predictedArrivalTime = fmArrivalTime.plus(predictedTravelTime);

      var arrivalTime = InstantValue.from(predictedArrivalTime, standardDeviation);
      var travelTime = Optional.of(DurationValue.from(predictedTravelTime, standardDeviation));

      var predictedValue = ArrivalTimeMeasurementValue.from(arrivalTime, travelTime);
      var derivativeMap =
          GmsArrivalTimePredictionFactory.createArrivalTimeDerivativeMap(observation);
      var featurePredictionComponents =
          GmsArrivalTimePredictionFactory.createArrivalTimePredictionComponents(observation);

      return Optional.of(
          ArrivalTimeFeaturePredictionValue.create(
              predictedValue, derivativeMap, featurePredictionComponents));
    } else {
      return Optional.empty();
    }
  }
}
