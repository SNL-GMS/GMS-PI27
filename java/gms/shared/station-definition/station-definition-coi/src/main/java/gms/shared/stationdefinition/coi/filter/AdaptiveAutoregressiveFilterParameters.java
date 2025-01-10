package gms.shared.stationdefinition.coi.filter;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;

@AutoValue
@JsonSerialize(as = AdaptiveAutoregressiveFilterParameters.class)
@JsonDeserialize(builder = AutoValue_AdaptiveAutoregressiveFilterParameters.Builder.class)
public abstract class AdaptiveAutoregressiveFilterParameters
    implements BaseAutoregressiveFilterParameters {

  public static AdaptiveAutoregressiveFilterParameters.Builder builder() {
    return new AutoValue_AdaptiveAutoregressiveFilterParameters.Builder();
  }

  @JsonCreator
  public static AdaptiveAutoregressiveFilterParameters from(
      @JsonProperty("sampleRateHz") double sampleRateHz,
      @JsonProperty("sampleRateToleranceHz") double sampleRateToleranceHz) {

    return AdaptiveAutoregressiveFilterParameters.builder()
        .setSampleRateHz(sampleRateHz)
        .setSampleRateToleranceHz(sampleRateToleranceHz)
        .build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    AdaptiveAutoregressiveFilterParameters.Builder setSampleRateHz(double sampleRateHz);

    AdaptiveAutoregressiveFilterParameters.Builder setSampleRateToleranceHz(
        double sampleRateToleranceHz);

    AdaptiveAutoregressiveFilterParameters autoBuild();

    default AdaptiveAutoregressiveFilterParameters build() {
      validateFields(autoBuild());

      return autoBuild();
    }
  }

  static void validateFields(AdaptiveAutoregressiveFilterParameters filterParameters) {
    checkArgument(filterParameters.getSampleRateHz() > 0.00, "sampleRateHz must be greater than 0");
    checkArgument(
        filterParameters.getSampleRateToleranceHz() >= 0.00,
        "sampleRateToleranceHz must be greater than or equal to 0");
  }
}
