package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;

/**
 * Pair object of SignalDetectionHypothesis {@link SignalDetectionHypothesis} and
 * FilterDefinitionByFilterDefinitionUsage {@link FilterDefinitionByFilterDefinitionUsage}
 *
 * <p>
 */
@AutoValue
@JsonSerialize(as = SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.class)
@JsonDeserialize(
    builder =
        AutoValue_SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.Builder
            .class)
public abstract class SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair {

  @JsonProperty("signalDetectionHypothesis")
  public abstract SignalDetectionHypothesis getSignalDetectionHypothesis();

  @JsonUnwrapped
  public abstract FilterDefinitionByFilterDefinitionUsage
      getFilterDefinitionByFilterDefinitionUsage();

  public static SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair create(
      SignalDetectionHypothesis signalDetectionHypothesis,
      FilterDefinitionByFilterDefinitionUsage filterDefinitionByFilterDefinitionUsage) {

    return builder()
        .setSignalDetectionHypothesis(signalDetectionHypothesis)
        .setFilterDefinitionByFilterDefinitionUsage(filterDefinitionByFilterDefinitionUsage)
        .build();
  }

  public static Builder builder() {
    return new AutoValue_SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair
        .Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Builder setSignalDetectionHypothesis(SignalDetectionHypothesis signalDetectionHypothesis);

    @JsonUnwrapped
    Builder setFilterDefinitionByFilterDefinitionUsage(
        FilterDefinitionByFilterDefinitionUsage filterDefinitionByFilterDefinitionUsage);

    SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair build();
  }
}
