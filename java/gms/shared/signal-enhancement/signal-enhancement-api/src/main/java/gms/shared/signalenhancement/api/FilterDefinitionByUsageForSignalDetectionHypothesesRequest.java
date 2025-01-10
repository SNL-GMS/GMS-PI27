package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import java.util.Collection;
import java.util.Optional;
import javax.annotation.Nullable;
import org.apache.commons.lang3.Validate;

/**
 * Contains at least one {@link SignalDetectionHypothesis} (faceted entity, ID-only or fully
 * populated) and an optional fully populated {@link EventHypothesis}
 */
@AutoValue
@JsonSerialize(as = FilterDefinitionByUsageForSignalDetectionHypothesesRequest.class)
@JsonDeserialize(
    builder = AutoValue_FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class FilterDefinitionByUsageForSignalDetectionHypothesesRequest {

  public abstract ImmutableList<SignalDetectionHypothesis> getSignalDetectionsHypotheses();

  public abstract Optional<EventHypothesis> getEventHypothesis();

  public static FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder builder() {
    return new AutoValue_FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder();
  }

  public abstract FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder
        setSignalDetectionsHypotheses(
            ImmutableList<SignalDetectionHypothesis> signalDetectionHypotheses);

    default FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder
        setSignalDetectionsHypotheses(
            Collection<SignalDetectionHypothesis> signalDetectionHypotheses) {
      return setSignalDetectionsHypotheses(ImmutableList.copyOf(signalDetectionHypotheses));
    }

    FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder setEventHypothesis(
        @Nullable EventHypothesis eventHypothesis);

    /**
     * Clears an already-set EventHypothesis
     *
     * @return the updated Builder
     */
    default FilterDefinitionByUsageForSignalDetectionHypothesesRequest.Builder noEventHypothesis() {
      return setEventHypothesis(null);
    }

    FilterDefinitionByUsageForSignalDetectionHypothesesRequest autoBuild();

    default FilterDefinitionByUsageForSignalDetectionHypothesesRequest build() {
      var filterDefinitionByUsuageForSignalDetectionHypothesesRequest = autoBuild();
      Validate.notEmpty(
          filterDefinitionByUsuageForSignalDetectionHypothesesRequest
              .getSignalDetectionsHypotheses(),
          "Request must contain at least one Signal Detection Hypothesis");
      return filterDefinitionByUsuageForSignalDetectionHypothesesRequest;
    }
  }
}
