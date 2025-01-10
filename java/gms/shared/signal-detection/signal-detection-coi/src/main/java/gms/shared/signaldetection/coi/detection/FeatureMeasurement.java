package gms.shared.signaldetection.coi.detection;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeInfo.As;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;
import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import java.util.Optional;

/**
 * Represents a measure of some kind of feature.
 *
 * <p>A Signal Detection Hypothesis typically will have many measurements associated with it,
 * captured with the Feature Measurement class. Feature Measurement has been made generic to
 * accommodate any new types of measurement that may be added in the future. Each Feature
 * Measurement has a type indicated with the feature measurement type attribute, a value, and a
 * reference to the Channel Segment on which it was calculated. As shown in the association above,
 * each Signal Detection Hypothesis is required to have at least an arrival time Feature
 * Measurement. The additional Feature Measurements are a "zero to many" relationship, because they
 * are not required by the system.
 *
 * @param <V> the class of the measurement value
 */
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = As.EXISTING_PROPERTY,
    property = "featureMeasurementType",
    visible = true)
@JsonTypeIdResolver(FeatureMeasurementIdResolver.class)
@AutoValue
@JsonIgnoreProperties({"measuredChannelSegment"})
@JsonSerialize(as = FeatureMeasurement.class)
@JsonDeserialize(builder = AutoValue_FeatureMeasurement.Builder.class)
public abstract class FeatureMeasurement<V> {

  /**
   * The {@link Channel} on which the measurement was made
   *
   * @return {@link Channel}
   */
  public abstract Channel getChannel();

  /**
   * The {@link ChannelSegment} measured data from the Channel
   *
   * @return {@link ChannelSegment}
   */
  public abstract Optional<ChannelSegment<? extends Timeseries>> getMeasuredChannelSegment();

  /**
   * Type of the measurement. Matches up to getMeasurementValue().
   *
   * @return type
   */
  public abstract FeatureMeasurementType<V> getFeatureMeasurementType();

  /**
   * Value of the measurement. Matches up to getFeatureMeasurementType().
   *
   * @return the value of the measurement
   */
  public abstract V getMeasurementValue();

  /**
   * The signal-to-noise ratio of the {@link ChannelSegment} at the time of measurement
   *
   * @return the optional signal-to-noise
   */
  public abstract Optional<DoubleValue> getSnr();

  /**
   * The precursor {@link ChannelSegment} to the measuredChannelSegment
   *
   * @return the optional precursor {@link ChannelSegment}
   */
  public abstract Optional<WaveformAndFilterDefinition> getAnalysisWaveform();

  /**
   * Creates a builder for a {@link FeatureMeasurement} of class V
   *
   * @param <V> the class of the measurement value
   * @return a builder for a {@link FeatureMeasurement} of class V
   */
  public static <V> Builder<V> builder() {
    return new AutoValue_FeatureMeasurement.Builder<>();
  }

  public abstract Builder<V> toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder<V> {

    /**
     * @param channel the {@link Channel} on which the measurement was made
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public abstract Builder<V> setChannel(Channel channel);

    /**
     * @param measuredChannelSegment the {@link ChannelSegment} measured data from the Channel
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public Builder<V> setMeasuredChannelSegment(
        ChannelSegment<? extends Timeseries> measuredChannelSegment) {
      return setMeasuredChannelSegment(Optional.ofNullable(measuredChannelSegment));
    }

    /**
     * @param measuredChannelSegment the {@link ChannelSegment} measured data from the Channel
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public abstract Builder<V> setMeasuredChannelSegment(
        Optional<ChannelSegment<? extends Timeseries>> measuredChannelSegment);

    /**
     * @param type the type of the measurement; matches up to {@literal <}V{@literal >}
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public abstract Builder<V> setFeatureMeasurementType(FeatureMeasurementType<V> type);

    /**
     * @param measurementValue the value of the measurement; matches up to {@literal <}V{@literal >}
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public abstract Builder<V> setMeasurementValue(V measurementValue);

    /**
     * @param snr the signal-to-noise ratio of the {@link ChannelSegment} at the time of measurement
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public Builder<V> setSnr(DoubleValue snr) {
      return setSnr(Optional.ofNullable(snr));
    }

    /**
     * @param snr the signal-to-noise ratio of the {@link ChannelSegment} at the time of measurement
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public abstract Builder<V> setSnr(Optional<DoubleValue> snr);

    /**
     * @param analysisWaveform the precursor {@link ChannelSegment} to the measuredChannelSegment
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public Builder<V> setAnalysisWaveform(WaveformAndFilterDefinition analysisWaveform) {
      return setAnalysisWaveform(Optional.ofNullable(analysisWaveform));
    }

    /**
     * @param analysisWaveform the precursor {@link ChannelSegment} to the measuredChannelSegment
     * @return the updated FeatureMeasurement{@literal <}V{@literal >} Builder
     */
    public abstract Builder<V> setAnalysisWaveform(
        Optional<WaveformAndFilterDefinition> analysisWaveform);

    public abstract FeatureMeasurement<V> build();
  }
}
