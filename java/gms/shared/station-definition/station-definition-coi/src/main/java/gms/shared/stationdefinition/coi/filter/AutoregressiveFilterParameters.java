package gms.shared.stationdefinition.coi.filter;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;

@AutoValue
@JsonSerialize(as = AutoregressiveFilterParameters.class)
@JsonDeserialize(builder = AutoValue_AutoregressiveFilterParameters.Builder.class)
public abstract class AutoregressiveFilterParameters implements BaseAutoregressiveFilterParameters {

  public abstract ImmutableList<Double> getCoefficients();

  public abstract ChannelSegmentDescriptor getNoiseWindow();

  public static AutoregressiveFilterParameters.Builder builder() {
    return new AutoValue_AutoregressiveFilterParameters.Builder();
  }

  @JsonCreator
  public static AutoregressiveFilterParameters from(
      @JsonProperty("sampleRateHz") double sampleRateHz,
      @JsonProperty("sampleRateToleranceHz") double sampleRateToleranceHz,
      @JsonProperty("coefficients") ImmutableList<Double> coefficients,
      @JsonProperty("noiseWindow") ChannelSegmentDescriptor noiseWindow) {

    return AutoregressiveFilterParameters.builder()
        .setSampleRateHz(sampleRateHz)
        .setSampleRateToleranceHz(sampleRateToleranceHz)
        .setCoefficients(coefficients)
        .setNoiseWindow(noiseWindow)
        .build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    AutoregressiveFilterParameters.Builder setSampleRateHz(double sampleRateHz);

    AutoregressiveFilterParameters.Builder setSampleRateToleranceHz(double sampleRateToleranceHz);

    AutoregressiveFilterParameters.Builder setCoefficients(ImmutableList<Double> coefficients);

    AutoregressiveFilterParameters.Builder setNoiseWindow(ChannelSegmentDescriptor noiseWindow);

    AutoregressiveFilterParameters autoBuild();

    default AutoregressiveFilterParameters build() {
      validateFields(autoBuild());

      return autoBuild();
    }
  }

  static void validateFields(AutoregressiveFilterParameters filterParameters) {
    checkArgument(filterParameters.getSampleRateHz() > 0.00, "sampleRateHz must be greater than 0");
    checkArgument(
        filterParameters.getSampleRateToleranceHz() >= 0.00,
        "sampleRateToleranceHz must be greater than or equal to 0");
    checkArgument(!filterParameters.getCoefficients().isEmpty(), "coefficients must exist");
  }
}
