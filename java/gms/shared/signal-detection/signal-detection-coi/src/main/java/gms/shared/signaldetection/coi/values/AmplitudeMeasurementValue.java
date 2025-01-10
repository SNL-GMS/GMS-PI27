package gms.shared.signaldetection.coi.values;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Represents an amplitude measurement.
 *
 * <p>Corresponds to the AMPLITUDE varieties of FeatureMeasurementType
 */
@AutoValue
public abstract class AmplitudeMeasurementValue {
  private static final String PERIOD_NON_ZERO = "Period should be non-zero";

  /**
   * Gets the value of the measurement
   *
   * @return the amplitude value
   */
  public abstract double getAmplitude();

  /**
   * Gets the units associated with the amplitude value
   *
   * @return the units for the amplitude value
   */
  public abstract Units getUnits();

  /**
   * Gets the period of this amplitude measurement
   *
   * @return the period
   */
  public abstract Optional<Duration> getPeriod();

  /**
   * Gets the measurement time this amplitude measurement was made.
   *
   * @return the measurement time of the measurement
   */
  public abstract Optional<Instant> getMeasurementTime();

  /**
   * Measurement window start time where amplitude was measured
   *
   * @return the measurement window start time
   */
  public abstract Optional<Instant> getMeasurementWindowStart();

  /**
   * Measurement window duration where amplitude was measured
   *
   * @return the measurement window duration
   */
  public abstract Optional<Duration> getMeasurementWindowDuration();

  /**
   * A boolean flag specifying whether the measured data was clipped
   *
   * @return is clipped boolean flag
   */
  public abstract Optional<Boolean> isClipped();

  /**
   * Creates an AmplitudeMeasurementValue
   *
   * @param amplitude The amplitude
   * @param units The units for the amplitude
   * @param period The period
   * @param measurementTime The measurement time
   * @param measurementWindowStart The measurement window start time
   * @param measurementWindowDuration The measurement window duration
   * @param clipped Boolean on whether the amplitude was clipped
   * @return AmplitudeMeasurementValue
   * @throws IllegalArgumentException if any of the parameters are null
   */
  @JsonCreator
  public static AmplitudeMeasurementValue from(
      @JsonProperty("amplitude") double amplitude,
      @JsonProperty("units") Units units,
      @JsonProperty("period") Optional<Duration> period,
      @JsonProperty("measurementTime") Optional<Instant> measurementTime,
      @JsonProperty("measurementWindowStart") Optional<Instant> measurementWindowStart,
      @JsonProperty("measurementWindowDuration") Optional<Duration> measurementWindowDuration,
      @JsonProperty("clipped") Optional<Boolean> clipped) {
    period.ifPresent(p -> checkState(!p.isZero(), PERIOD_NON_ZERO));

    return new AutoValue_AmplitudeMeasurementValue(
        amplitude,
        units,
        period,
        measurementTime,
        measurementWindowStart,
        measurementWindowDuration,
        clipped);
  }

  public static AmplitudeMeasurementValue fromFeatureMeasurement(
      double amplitude,
      Units units,
      Duration period,
      Instant measurementTime,
      Instant measurementWindowStart,
      Duration measurementWindowDuration,
      Boolean isClipped) {
    return from(
        amplitude,
        units,
        Optional.ofNullable(period),
        Optional.of(measurementTime),
        Optional.of(measurementWindowStart),
        Optional.of(measurementWindowDuration),
        Optional.of(isClipped));
  }

  public static AmplitudeMeasurementValue fromFeaturePrediction(
      double amplitude, Units units, Duration period) {
    return from(
        amplitude,
        units,
        Optional.ofNullable(period),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty());
  }
}
