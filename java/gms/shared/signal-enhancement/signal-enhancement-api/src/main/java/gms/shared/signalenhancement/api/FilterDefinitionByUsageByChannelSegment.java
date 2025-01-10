package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.auto.value.extension.memoized.Memoized;
import com.google.common.collect.ImmutableList;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Map containing keys which are ChannelSegmentDescriptor objects {@link ChannelSegmentDescriptor}
 * and values which are FilterDefinitionByFilterDefinitionUsage objects {@link
 * FilterDefinitionByFilterDefinitionUsage}
 */
@AutoValue
public abstract class FilterDefinitionByUsageByChannelSegment {

  public abstract ImmutableList<ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair>
      getFilterDefinitionByUsageByChannelSegment();

  @JsonCreator
  public static FilterDefinitionByUsageByChannelSegment from(
      @JsonProperty("filterDefinitionByUsageByChannelSegment")
          Collection<ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair>
              filterDefinitionByUsageByChannelSegment) {

    return new AutoValue_FilterDefinitionByUsageByChannelSegment(
        ImmutableList.copyOf(filterDefinitionByUsageByChannelSegment));
  }

  @JsonIgnore
  @Memoized
  public Map<ChannelSegment<Waveform>, FilterDefinitionByFilterDefinitionUsage>
      getChannelSegmentByFilterDefinitionByFilterDefinitionUsage() {

    return getFilterDefinitionByUsageByChannelSegment().stream()
        .collect(
            Collectors.toMap(
                ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair::getChannelSegment,
                ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair
                    ::getFilterDefinitionByFilterDefinitionUsage));
  }

  @JsonIgnore
  @Memoized
  public Map<ChannelSegment<Waveform>, List<FilterDefinitionUsage>>
      getChannelSegmentByFilterDefinitionUsage() {

    return getChannelSegmentByFilterDefinitionByFilterDefinitionUsage().entrySet().stream()
        .collect(
            Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getFilterDefinitionUsageList()));
  }

  @JsonIgnore
  @Memoized
  public Map<ChannelSegment<Waveform>, List<FilterDefinition>>
      getChannelSegmentByFilterDefinition() {

    return getChannelSegmentByFilterDefinitionByFilterDefinitionUsage().entrySet().stream()
        .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getFilterDefinitionList()));
  }
}
