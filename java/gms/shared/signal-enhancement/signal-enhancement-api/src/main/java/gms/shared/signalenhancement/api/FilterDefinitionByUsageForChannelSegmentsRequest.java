package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.Collection;
import java.util.Optional;
import javax.annotation.Nullable;
import org.apache.commons.lang3.Validate;

/**
 * Contains a list of at least one {@link ChannelSegment}{@literal <}{@link Waveform}> (faceted
 * entity, ID-only or fully populated) and an optional fully populated {@link EventHypothesis}
 */
@AutoValue
@JsonSerialize(as = FilterDefinitionByUsageForChannelSegmentsRequest.class)
@JsonDeserialize(builder = AutoValue_FilterDefinitionByUsageForChannelSegmentsRequest.Builder.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class FilterDefinitionByUsageForChannelSegmentsRequest {

  public abstract ImmutableList<ChannelSegment<Waveform>> getChannelSegments();

  public abstract Optional<EventHypothesis> getEventHypothesis();

  public static FilterDefinitionByUsageForChannelSegmentsRequest.Builder builder() {
    return new AutoValue_FilterDefinitionByUsageForChannelSegmentsRequest.Builder();
  }

  public abstract FilterDefinitionByUsageForChannelSegmentsRequest.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    FilterDefinitionByUsageForChannelSegmentsRequest.Builder setChannelSegments(
        ImmutableList<ChannelSegment<Waveform>> channelSegments);

    default FilterDefinitionByUsageForChannelSegmentsRequest.Builder setChannelSegments(
        Collection<ChannelSegment<Waveform>> channelSegments) {
      return setChannelSegments(ImmutableList.copyOf(channelSegments));
    }

    FilterDefinitionByUsageForChannelSegmentsRequest.Builder setEventHypothesis(
        @Nullable EventHypothesis eventHypothesis);

    /**
     * Clears an already-set EventHypothesis
     *
     * @return the updated Builder
     */
    default FilterDefinitionByUsageForChannelSegmentsRequest.Builder noEventHypothesis() {
      return setEventHypothesis(null);
    }

    FilterDefinitionByUsageForChannelSegmentsRequest autoBuild();

    default FilterDefinitionByUsageForChannelSegmentsRequest build() {
      var filterDefinitionByUsageForChannelSegmentsRequest = autoBuild();
      Validate.notEmpty(
          filterDefinitionByUsageForChannelSegmentsRequest.getChannelSegments(),
          "Request must contain at least one Channel Segment");
      return filterDefinitionByUsageForChannelSegmentsRequest;
    }
  }
}
