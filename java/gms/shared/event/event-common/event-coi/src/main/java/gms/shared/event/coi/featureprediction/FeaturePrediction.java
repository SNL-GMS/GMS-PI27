package gms.shared.event.coi.featureprediction;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.google.auto.value.AutoValue;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import java.util.Optional;
import javax.annotation.Nullable;

/**
 * Represents a feature prediction along with the phase, location, and channel information that went
 * into the prediction.
 *
 * @param <T> A class that extends FeaturePredictionValue, representing the type of feature
 *     prediction.
 */
@AutoValue
@JsonDeserialize(builder = FeaturePrediction.Builder.class)
public abstract class FeaturePrediction<T extends FeaturePredictionValue<?, ?, ?>> {

  public abstract T getPredictionValue();

  public abstract FeaturePredictionType<T> getPredictionType();

  public abstract PhaseType getPhase();

  public abstract boolean isExtrapolated();

  public abstract EventLocation getSourceLocation();

  public abstract Location getReceiverLocation();

  public abstract Optional<Channel> getChannel();

  public abstract Optional<ChannelSegment<Timeseries>> getPredictionChannelSegment();

  private static <T extends FeaturePredictionValue<?, ?, ?>> FeaturePrediction<T> create(
      T predictionValue,
      FeaturePredictionType<T> predictionType,
      PhaseType phase,
      boolean extrapolated,
      EventLocation sourceLocation,
      Location receiverLocation,
      Channel channel,
      ChannelSegment<Timeseries> predictionChannelSegment) {
    return new AutoValue_FeaturePrediction<>(
        predictionValue,
        predictionType,
        phase,
        extrapolated,
        sourceLocation,
        receiverLocation,
        Optional.ofNullable(channel),
        Optional.ofNullable(predictionChannelSegment));
  }

  public static <T extends FeaturePredictionValue<?, ?, ?>> Builder<T> builder() {
    return new Builder<>();
  }

  public Builder<T> toBuilder() {
    // TODO: Change to Autovalue builder
    return FeaturePrediction.<T>builder()
        .setChannel(this.getChannel().orElse(null))
        .setPredictionValue(this.getPredictionValue())
        .setSourceLocation(this.getSourceLocation())
        .setPhase(this.getPhase())
        .setExtrapolated(this.isExtrapolated())
        .setReceiverLocation(this.getReceiverLocation())
        .setPredictionType(this.getPredictionType())
        .setPredictionChannelSegment(this.getPredictionChannelSegment().orElse(null));
  }

  @JsonPOJOBuilder(withPrefix = "set")
  public static class Builder<T extends FeaturePredictionValue<?, ?, ?>> {

    private T predictionValue;
    private FeaturePredictionType<T> predictionType;
    private PhaseType phaseType;
    private boolean isExtrapolated;
    private EventLocation sourceLocation;
    private Location receiverLocation;
    private Channel channel;
    private ChannelSegment<Timeseries> predictionChannelSegment;

    public Builder<T> setPredictionValue(T predictionValue) {
      this.predictionValue = predictionValue;
      return this;
    }

    public Builder<T> setPredictionType(FeaturePredictionType<T> predictionType) {
      this.predictionType = predictionType;
      return this;
    }

    public Builder<T> setPhase(PhaseType phaseType) {
      this.phaseType = phaseType;
      return this;
    }

    public Builder<T> setExtrapolated(boolean extrapolated) {
      isExtrapolated = extrapolated;
      return this;
    }

    public Builder<T> setSourceLocation(EventLocation sourceLocation) {
      this.sourceLocation = sourceLocation;
      return this;
    }

    public Builder<T> setChannel(@Nullable Channel channel) {
      this.channel = channel;
      return this;
    }

    public Builder<T> noChannel() {
      this.channel = null;
      return this;
    }

    public Builder<T> setPredictionChannelSegment(
        @Nullable ChannelSegment<Timeseries> predictionChannelSegment) {
      this.predictionChannelSegment = predictionChannelSegment;
      return this;
    }

    public Builder<T> noPredictionChannelSegment() {
      this.predictionChannelSegment = null;
      return this;
    }

    public Builder<T> setReceiverLocation(Location receiverLocation) {
      this.receiverLocation = receiverLocation;
      return this;
    }

    public FeaturePrediction<T> build() {
      return FeaturePrediction.create(
          predictionValue,
          predictionType,
          phaseType,
          isExtrapolated,
          sourceLocation,
          receiverLocation,
          channel,
          predictionChannelSegment);
    }
  }
}
