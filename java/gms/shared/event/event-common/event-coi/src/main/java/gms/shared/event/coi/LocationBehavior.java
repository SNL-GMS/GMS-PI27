package gms.shared.event.coi;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import java.util.Optional;

/**
 * Define a class for LocationBehavior for the processing results location solution. Represent the
 * relationship between {@link FeatureMeasurement}s and {@link FeaturePrediction}s
 */
@AutoValue
public abstract class LocationBehavior {

  public abstract Optional<Double> getResidual();

  public abstract Optional<Double> getWeight();

  public abstract boolean isDefining();

  public abstract Optional<FeaturePrediction<? extends FeaturePredictionValue<?, ?, ?>>>
      getPrediction();

  public abstract FeatureMeasurement<?> getMeasurement();

  /**
   * Define a LocationBehavior from known attributes.
   *
   * @param residual The difference between the measurement value and the prediction value.
   * @param weight how the location algorithm weighted the measurement when determining the
   *     EventLocation; must be 0.0 if defining is false.
   * @param isDefining a boolean flag indicating whether the measurement was used to determine the
   *     EventLocation.
   * @param prediction a FeaturePrediction object for the same Channel and FeatureMeasurementType as
   *     the measurement.
   * @param measurement a FeatureMeasurement object; must be for one of the
   *     SignalDetectionHypothesis objects associated to the EventHypothesis containing the
   *     LocationSolution.
   * @return A {@link LocationBehavior} object.
   */
  @JsonCreator
  public static LocationBehavior from(
      @JsonProperty("residual") Double residual,
      @JsonProperty("weight") Double weight,
      @JsonProperty("defining") boolean isDefining,
      @JsonProperty("prediction")
          FeaturePrediction<? extends FeaturePredictionValue<?, ?, ?>> prediction,
      @JsonProperty("measurement") FeatureMeasurement<?> measurement) {
    return new AutoValue_LocationBehavior(
        Optional.ofNullable(residual),
        Optional.ofNullable(weight),
        isDefining,
        Optional.ofNullable(prediction),
        measurement);
  }
}
