package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;

/**
 * Pair object of ChannelSegmentDescriptor {@link ChannelSegmentDescriptor} and
 * FilterDefinitionByFilterDefinitionUsage {@link FilterDefinitionByFilterDefinitionUsage}
 *
 * <p>
 */
@AutoValue
@JsonSerialize(as = ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.class)
@JsonDeserialize(
    builder = AutoValue_ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.Builder.class)
public abstract class ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair {

  @JsonProperty("channelSegment")
  public abstract ChannelSegment<Waveform> getChannelSegment();

  @JsonUnwrapped
  public abstract FilterDefinitionByFilterDefinitionUsage
      getFilterDefinitionByFilterDefinitionUsage();

  public static ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair create(
      ChannelSegment<Waveform> channelSegment,
      FilterDefinitionByFilterDefinitionUsage filterDefinitionByFilterDefinitionUsage) {

    return builder()
        .setChannelSegment(channelSegment)
        .setFilterDefinitionByFilterDefinitionUsage(filterDefinitionByFilterDefinitionUsage)
        .build();
  }

  public static Builder builder() {
    return new AutoValue_ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Builder setChannelSegment(ChannelSegment<Waveform> channelSegment);

    @JsonUnwrapped
    Builder setFilterDefinitionByFilterDefinitionUsage(
        FilterDefinitionByFilterDefinitionUsage filterDefinitionByFilterDefinitionUsage);

    ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair build();
  }
}
