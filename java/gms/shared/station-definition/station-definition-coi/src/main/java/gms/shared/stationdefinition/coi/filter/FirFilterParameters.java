package gms.shared.stationdefinition.coi.filter;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import java.time.Duration;
import java.util.List;

@AutoValue
@JsonSerialize(as = FirFilterParameters.class)
@JsonDeserialize(builder = AutoValue_FirFilterParameters.Builder.class)
public abstract class FirFilterParameters implements LinearFilterParameters {
  public abstract ImmutableList<Double> getTransferFunctionBCoefficients();

  public static FirFilterParameters.Builder builder() {
    return new AutoValue_FirFilterParameters.Builder();
  }

  @JsonCreator
  public static FirFilterParameters from(
      @JsonProperty("sampleRateHz") double sampleRateHz,
      @JsonProperty("sampleRateToleranceHz") double sampleRateToleranceHz,
      @JsonProperty("groupDelaySec") Duration groupDelaySec,
      @JsonProperty("transferFunctionBCoefficients") List<Double> transferFunctionBCoefficients) {

    return FirFilterParameters.builder()
        .setSampleRateHz(sampleRateHz)
        .setSampleRateToleranceHz(sampleRateToleranceHz)
        .setGroupDelaySec(groupDelaySec)
        .setTransferFunctionBCoefficients(transferFunctionBCoefficients)
        .build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    FirFilterParameters.Builder setSampleRateHz(double sampleRateHz);

    FirFilterParameters.Builder setSampleRateToleranceHz(double sampleRateToleranceHz);

    FirFilterParameters.Builder setGroupDelaySec(Duration groupDelaySec);

    FirFilterParameters.Builder setTransferFunctionBCoefficients(
        List<Double> transferFunctionBCoefficients);

    FirFilterParameters autoBuild();

    default FirFilterParameters build() {
      validateFields(autoBuild());

      return autoBuild();
    }
  }

  static void validateFields(FirFilterParameters filterParameters) {
    checkArgument(filterParameters.getSampleRateHz() > 0.00, "sampleRateHz must be greater than 0");
    checkArgument(
        filterParameters.getSampleRateToleranceHz() >= 0.00,
        "sampleRateToleranceHz must be greater than or equal to 0");
    checkArgument(
        filterParameters.getGroupDelaySec().getSeconds() >= 0,
        "getGroupDelaySec must be greater than or equal to 0");

    checkArgument(
        !filterParameters.getTransferFunctionBCoefficients().isEmpty(),
        "transferFunctionBCoefficients must contain elements");
  }
}
