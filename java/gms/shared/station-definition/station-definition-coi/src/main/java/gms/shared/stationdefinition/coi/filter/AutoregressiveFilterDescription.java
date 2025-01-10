package gms.shared.stationdefinition.coi.filter;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.filter.types.AutoregressiveFilterType;
import gms.shared.stationdefinition.coi.filter.types.AutoregressiveType;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import java.time.Duration;
import java.util.Optional;

@AutoValue
public abstract class AutoregressiveFilterDescription implements FilterDescription {

  public abstract boolean isAdaptive();

  public abstract AutoregressiveFilterType getAutoregressiveFilterType();

  public abstract AutoregressiveType getAutoregressiveType();

  public abstract Duration getNoiseWindowDuration();

  public abstract Duration getNoiseWindowOffset();

  public abstract int getOrder();

  public abstract Optional<BaseAutoregressiveFilterParameters> getParameters();

  public abstract Optional<Duration> getSignalWindowDuration();

  public abstract Duration getSignalWindowOffset();

  @Override
  public FilterType getFilterType() {
    return FilterType.AUTOREGRESSIVE;
  }

  @JsonCreator
  public static AutoregressiveFilterDescription from(
      @JsonProperty("comments") Optional<String> comments,
      @JsonProperty("response") Optional<FrequencyAmplitudePhase> response,
      @JsonProperty("causal") boolean causal,
      @JsonProperty("adaptive") boolean adaptive,
      @JsonProperty("autoregressiveFilterType") AutoregressiveFilterType autoregressiveFilterType,
      @JsonProperty("autoregressiveType") AutoregressiveType autoregressiveType,
      @JsonProperty("noiseWindowDuration") Duration noiseWindowDuration,
      @JsonProperty("noiseWindowOffset") Duration noiseWindowOffset,
      @JsonProperty("order") int order,
      @JsonProperty("parameters") Optional<BaseAutoregressiveFilterParameters> parameters,
      @JsonProperty("signalWindowDuration") Optional<Duration> signalWindowDuration,
      @JsonProperty("signalWindowOffset") Duration signalWindowOffset) {

    checkArgument(causal, "causal must be true");
    checkArgument(order > 0, "order value must be positive");

    if (adaptive) {

      checkArgument(
          signalWindowDuration.isEmpty(),
          "signalWindowDuration must NOT be populated when adaptive is true");

      parameters.ifPresent(
          a ->
              checkArgument(
                  a instanceof AdaptiveAutoregressiveFilterParameters,
                  "Parameter must be of type AdaptiveAutoregressiveFilterParameters when adaptive"
                      + " is true"));
    } else {

      checkArgument(
          signalWindowDuration.isPresent(),
          "signalWindowDuration must be populated when adaptive is false");

      parameters.ifPresent(
          a ->
              checkArgument(
                  a instanceof AutoregressiveFilterParameters,
                  "Parameter must be of type AutoregressiveFilterParameters when adaptive is"
                      + " false"));
    }

    checkDurationGreaterThanState(noiseWindowDuration, "noiseWindowDuration");
    checkDurationGreaterThanEqualToState(noiseWindowOffset, "noiseWindowOffset");
    checkDurationGreaterThanEqualToState(signalWindowOffset, "signalWindowOffset");

    signalWindowDuration.ifPresent(
        duration ->
            AutoregressiveFilterDescription.checkDurationGreaterThanState(
                duration, "signalWindowDuration"));

    return new AutoValue_AutoregressiveFilterDescription(
        comments,
        response,
        causal,
        adaptive,
        autoregressiveFilterType,
        autoregressiveType,
        noiseWindowDuration,
        noiseWindowOffset,
        order,
        parameters,
        signalWindowDuration,
        signalWindowOffset);
  }

  private static void checkDurationGreaterThanState(Duration duration, String valueName) {
    checkArgument(
        duration.toSeconds() > 0, "Duration value " + valueName + " must be greater than 0");
  }

  private static void checkDurationGreaterThanEqualToState(Duration duration, String valueName) {
    checkArgument(
        duration.toSeconds() >= 0,
        "Duration value " + valueName + " must be greater than or equal to 0");
  }
}
