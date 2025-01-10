package gms.shared.fk.control.api;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

/** Wrapper class containing all needed data in order to compute spectra. */
@AutoValue
@JsonSerialize(as = FkStreamingRequest.class)
@JsonDeserialize(builder = AutoValue_FkStreamingRequest.Builder.class)
public abstract class FkStreamingRequest {

  public String toString() {
    return """
        Channel names: %s
        Start time: %s
        Sample rate: %s
        Sample count: %s
        Window lead: %s
        Window length: %s
        Frequency band (low, high): %s, %s
        Phase type: %s
        Slow start: (x: %s, y: %s)
        Slow delta: (x: %s, y: %s)
        Slow count: (x: %s, y: %s)
        Use channel vertical offset: %s
        Normalize Waveforms: %s"""
        .formatted(
            getChannels(),
            getStartTime(),
            getSampleRate(),
            getSampleCount(),
            getWindowLead(),
            getWindowLength(),
            getLowFrequency(),
            getHighFrequency(),
            getPhaseType(),
            getSlowStartX(),
            getSlowStartY(),
            getSlowDeltaX(),
            getSlowDeltaY(),
            getSlowCountX(),
            getSlowCountY(),
            getUseChannelVerticalOffset(),
            getNormalizeWaveforms());
  }

  public abstract Set<Channel> getChannels();

  public abstract Instant getStartTime();

  public abstract Double getSampleRate();

  public abstract Integer getSampleCount();

  public abstract Duration getWindowLead();

  public abstract Duration getWindowLength();

  public abstract Double getLowFrequency();

  public abstract Double getHighFrequency();

  public abstract PhaseType getPhaseType();

  public abstract Optional<Double> getSlowStartX();

  public abstract Optional<Double> getSlowDeltaX();

  public abstract Optional<Integer> getSlowCountX();

  public abstract Optional<Double> getSlowStartY();

  public abstract Optional<Double> getSlowDeltaY();

  public abstract Optional<Integer> getSlowCountY();

  public abstract Boolean getUseChannelVerticalOffset();

  public abstract Boolean getNormalizeWaveforms();

  public static Builder builder() {
    return new AutoValue_FkStreamingRequest.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setChannels(Set<Channel> channels);

    public abstract Builder setStartTime(Instant startTime);

    public abstract Builder setSampleRate(Double sampleRate);

    public abstract Builder setSampleCount(Integer sampleCount);

    public abstract Builder setWindowLead(Duration windowLead);

    public abstract Builder setWindowLength(Duration windowLength);

    public abstract Builder setLowFrequency(Double lowFrequency);

    public abstract Builder setHighFrequency(Double highFrequency);

    public abstract Builder setPhaseType(PhaseType phaseType);

    public abstract Builder setSlowStartX(Double slowStartX);

    public abstract Builder setSlowDeltaX(Double slowDeltaX);

    public abstract Builder setSlowCountX(Integer slowCountX);

    public abstract Builder setSlowStartY(Double slowStartY);

    public abstract Builder setSlowDeltaY(Double slowDeltaY);

    public abstract Builder setSlowCountY(Integer slowCountY);

    public abstract Builder setUseChannelVerticalOffset(Boolean useChannelVerticalOffset);

    public abstract Builder setNormalizeWaveforms(Boolean normalizeWaveforms);

    abstract FkStreamingRequest autoBuild();

    public FkStreamingRequest build() {
      FkStreamingRequest request = autoBuild();

      Preconditions.checkState(
          request.getSampleRate() > 0.0,
          "Error creating FkStreamingRequest: Sample Rate must be greater than 0");
      Preconditions.checkState(
          request.getSampleCount() > 0,
          "Error creating FkStreamingRequest: Sample Count must be greater than 0");
      Preconditions.checkState(
          !request.getChannels().isEmpty(),
          "Error creating FkStreamingRequest: Channel Names cannot be empty");

      return request;
    }
  }
}
