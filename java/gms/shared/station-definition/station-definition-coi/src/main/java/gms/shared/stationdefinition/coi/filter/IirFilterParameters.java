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
@JsonSerialize(as = IirFilterParameters.class)
@JsonDeserialize(builder = AutoValue_IirFilterParameters.Builder.class)
public abstract class IirFilterParameters implements LinearFilterParameters {
  private static final int COEFFICIENT_SIZE = 3;

  public abstract ImmutableList<Double> getSosNumeratorCoefficients();

  public abstract ImmutableList<Double> getSosDenominatorCoefficients();

  public static IirFilterParameters.Builder builder() {
    return new AutoValue_IirFilterParameters.Builder();
  }

  @JsonCreator
  public static IirFilterParameters from(
      @JsonProperty("sampleRateHz") double sampleRateHz,
      @JsonProperty("sampleRateToleranceHz") double sampleRateToleranceHz,
      @JsonProperty("groupDelaySec") Duration groupDelaySec,
      @JsonProperty("sosNumeratorCoefficients") List<Double> sosNumeratorCoefficients,
      @JsonProperty("sosDenominatorCoefficients") List<Double> sosDenominatorCoefficients) {

    return IirFilterParameters.builder()
        .setSampleRateHz(sampleRateHz)
        .setSampleRateToleranceHz(sampleRateToleranceHz)
        .setGroupDelaySec(groupDelaySec)
        .setSosNumeratorCoefficients(sosNumeratorCoefficients)
        .setSosDenominatorCoefficients(sosDenominatorCoefficients)
        .build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    IirFilterParameters.Builder setSampleRateHz(double sampleRateHz);

    IirFilterParameters.Builder setSampleRateToleranceHz(double sampleRateToleranceHz);

    IirFilterParameters.Builder setGroupDelaySec(Duration groupDelaySec);

    IirFilterParameters.Builder setSosNumeratorCoefficients(List<Double> sosNumeratorCoefficients);

    IirFilterParameters.Builder setSosDenominatorCoefficients(
        List<Double> sosDenominatorCoefficients);

    IirFilterParameters autoBuild();

    default IirFilterParameters build() {
      validateFields(autoBuild());

      return autoBuild();
    }
  }

  static void validateFields(IirFilterParameters filterParameters) {
    checkArgument(filterParameters.getSampleRateHz() > 0.00, "sampleRateHz must be greater than 0");
    checkArgument(
        filterParameters.getSampleRateToleranceHz() >= 0.00,
        "sampleRateToleranceHz must be greater than or equal to 0");
    checkArgument(
        filterParameters.getGroupDelaySec().getSeconds() >= 0,
        "getGroupDelaySec must be greater than or equal to 0");
    checkArgument(
        filterParameters.getSosNumeratorCoefficients().size() >= COEFFICIENT_SIZE,
        "sosNumeratorCoefficients must contain elements");
    checkArgument(
        filterParameters.getSosDenominatorCoefficients().size() >= COEFFICIENT_SIZE,
        "sosDenominatorCoefficients must contain elements");
    checkArgument(
        filterParameters.getSosNumeratorCoefficients().size() % COEFFICIENT_SIZE == 0,
        "sosNumeratorCoefficients must contain elements in increments of 3");
    checkArgument(
        filterParameters.getSosDenominatorCoefficients().size() % COEFFICIENT_SIZE == 0,
        "sosDenominatorCoefficients must contain elements in increments of 3");
    checkArgument(
        filterParameters.getSosNumeratorCoefficients().size()
            == filterParameters.getSosDenominatorCoefficients().size(),
        "sosNumeratorCoefficients and sosDenominatorCoefficients contain the same number of"
            + " elements");
  }
}
