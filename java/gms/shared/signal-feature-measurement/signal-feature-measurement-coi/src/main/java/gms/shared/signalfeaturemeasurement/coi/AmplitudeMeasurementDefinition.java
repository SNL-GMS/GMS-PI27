package gms.shared.signalfeaturemeasurement.coi;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import java.time.Duration;
import java.util.Collection;
import java.util.Optional;
import javax.annotation.Nullable;

/** Value class for storing the components of an Amplitude Measurement */
public record AmplitudeMeasurementDefinition(
    Duration windowArrivalTimeLead,
    Duration windowDuration,
    Optional<Duration> minPeriod,
    Optional<Duration> maxPeriod,
    boolean removeFilterResponse,
    boolean removeInstrumentResponse,
    Optional<Double> smoothnessThreshold,
    AmplitudeMeasurementMethod measurementMethod,
    Collection<PhaseType> phases,
    AmplitudeMeasurementType type) {

  /**
   * Value class for storing the components of an Amplitude Measurement.
   *
   * <p>minPeriod, maxPeriod, and smoothnessThreshold will be populated unless the
   * amplitudeMeasurementMethod is ROOT_MEAN_SQUARE
   *
   * @param windowArrivalTimeLead The earliest possible time (inclusive) relative to the measured
   *     {@link SignalDetectionHypothesis}'s ARRIVAL_TIME FeatureMeasurement value, of the first
   *     sample in the measured amplitude (e.g. a peak or trough sample). A positive
   *     windowArrivalTimeLead value is before the ARRIVAL_TIME FeatureMeasurement value and a
   *     negative windowArrivalTimeLead value is after it. Has units of time.
   * @param windowDuration Used to define the latest possible time (inclusive) of the last sample in
   *     the measured amplitude (e.g. a peak or trough sample). To find this time, add the
   *     windowDuration value to the time found by offsetting the measured SignalDetectionHypothesis
   *     object's ARRIVAL_TIME FeatureMeasurement value by windowArrivalTimeLead. Has units of time.
   * @param minPeriod The measured amplitude's minimum period (inclusive). Must be positive. Has
   *     units of time. Empty if the measurementMethod is ROOT_MEAN_SQUARE; populated otherwise.
   * @param maxPeriod The measured amplitude's maximum period (inclusive). Must be positive and
   *     greater than or equal to minPeriod. Has units of time. Empty if the measurementMethod is
   *     ROOT_MEAN_SQUARE; populated otherwise.
   * @param removeFilterResponse Indicates whether the conditioning filter's response should be
   *     removed from the measured amplitude
   * @param removeInstrumentResponse Indicates whether the measured {@link Channel}'s instrument
   *     response should be removed from the measured amplitude
   * @param smoothnessThreshold Any waveform excursion (i.e. a local peak or trough) between the
   *     measured amplitude's peak and trough (or zero and peak) samples must have an amplitude less
   *     than or equal to this fraction of the measured amplitude. In range [0.0, 1.0]. Empty if the
   *     measurementMethod is ROOT_MEAN_SQUARE; populated otherwise.
   * @param measurementMethod The {@link AmplitudeMeasurementMethod} that describes how the
   *     amplitude is measured on a waveform.
   * @param phases A collection of {@link PhaseType}s. The amplitude is measured for {@link
   *     SignalDetectionHypothesis} objects with a PHASE FeatureMeasurement value matching any of
   *     these phases.
   * @param type The {@link AmplitudeMeasurementType} describing the measured amplitude's type.
   */
  public AmplitudeMeasurementDefinition {
    Preconditions.checkNotNull(windowArrivalTimeLead);
    Preconditions.checkNotNull(windowDuration);
    Preconditions.checkNotNull(minPeriod);
    Preconditions.checkNotNull(maxPeriod);
    Preconditions.checkNotNull(smoothnessThreshold);
    Preconditions.checkNotNull(measurementMethod);
    Preconditions.checkNotNull(phases);
    Preconditions.checkNotNull(type);

    Preconditions.checkArgument(
        !phases.isEmpty(), "There must be at least one PhaseType in phases.");

    if (measurementMethod == AmplitudeMeasurementMethod.ROOT_MEAN_SQUARE) {
      Preconditions.checkArgument(
          minPeriod.isEmpty(),
          "The minPeriod must not be populated when the method is ROOT_MEAN_SQUARE.");
      Preconditions.checkArgument(
          maxPeriod.isEmpty(),
          "The maxPeriod must not be populated when the method is ROOT_MEAN_SQUARE.");
      Preconditions.checkArgument(
          smoothnessThreshold.isEmpty(),
          "The smoothnessThreshold must not be populated when the method is ROOT_MEAN_SQUARE.");
    } else {
      Preconditions.checkArgument(
          minPeriod.isPresent(),
          "The minPeriod must be populated when the method is not ROOT_MEAN_SQUARE.");
      Preconditions.checkArgument(
          !minPeriod.orElseThrow().isNegative() && !minPeriod.orElseThrow().isZero(),
          "The minPeriod must be positive.");
      Preconditions.checkArgument(
          maxPeriod.isPresent(),
          "The maxPeriod must be populated when the method is not ROOT_MEAN_SQUARE.");
      Preconditions.checkArgument(
          maxPeriod.orElseThrow().compareTo(minPeriod.orElseThrow()) >= 0,
          "The maxPeriod must be greater than or equal to the minPeriod.");
      Preconditions.checkArgument(
          smoothnessThreshold.isPresent(),
          "The smoothnessThreshold must be populated when the method is not ROOT_MEAN_SQUARE.");
      Preconditions.checkArgument(
          0.0 <= smoothnessThreshold.orElseThrow() && smoothnessThreshold.orElseThrow() <= 1.0,
          "The smoothnessThreshold must be in the range [0, 1].");
    }
  }

  public static AmplitudeMeasurementDefinition.Builder builder() {
    return new AutoBuilder_AmplitudeMeasurementDefinition_Builder();
  }

  public static AmplitudeMeasurementDefinition.Builder builder(AmplitudeMeasurementDefinition amd) {
    return new AutoBuilder_AmplitudeMeasurementDefinition_Builder(amd);
  }

  public AmplitudeMeasurementDefinition.Builder toBuilder() {
    return new AutoBuilder_AmplitudeMeasurementDefinition_Builder(this);
  }

  @AutoBuilder
  public interface Builder {
    /**
     * The non-null {@link Duration} representing the relative time of the first sample in the
     * measured amplitude to the {@link SignalDetectionHypothesis}'s ARRIVAL_TIME.
     */
    Builder setWindowArrivalTimeLead(Duration windowArrivalTimeLead);

    /**
     * The non-null {@link Duration} defining the time of the last sample in the measured amplitude.
     */
    Builder setWindowDuration(Duration windowDuration);

    /**
     * The positive {@link Duration} defining the minimum period of the measured amplitude.
     *
     * <p>If the method is ROOT_MEAN_SQUARE, minPeriod must not be populated.
     */
    Builder setMinPeriod(@Nullable Duration minPeriod);

    /**
     * The positive {@link Duration} defining the maximum period of the measured amplitude.
     *
     * <p>maxPeriod >= minPeriod. If the method is ROOT_MEAN_SQUARE, maxPeriod must not be
     * populated.
     */
    Builder setMaxPeriod(@Nullable Duration maxPeriod);

    /**
     * Determines if the conditioning filter's response should be removed from the measured
     * amplitude.
     */
    Builder setRemoveFilterResponse(boolean removeFilterResponse);

    /**
     * Determines if the measured {@link Channel}'s instrument response should be removed from the
     * measured amplitude.
     */
    Builder setRemoveInstrumentResponse(boolean removeInstrumentResponse);

    /**
     * The maximum ratio of a local peak/trough to the maximum peak/trough of the measured
     * amplitude.
     *
     * <p>smoothnessThreshold is in the range [0, 1]. If the method is ROOT_MEAN_SQUARE,
     * smoothnessThreshold must not be populated.
     */
    Builder setSmoothnessThreshold(@Nullable Double smoothnessThreshold);

    /**
     * The {@link AmplitudeMeasurementMethod} that describes how the amplitude is measured on a
     * waveform.
     */
    Builder setMeasurementMethod(AmplitudeMeasurementMethod measurementMethod);

    /**
     * The collection of {@link PhaseType}s of {@link SignalDetectionHypothesis}s that match the
     * measured amplitude.
     */
    Builder setPhases(Collection<PhaseType> phases);

    /** The {@link AmplitudeMeasurementType} describing the measured amplitude's type. */
    Builder setType(AmplitudeMeasurementType type);

    AmplitudeMeasurementDefinition build();
  }
}
