package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.List;
import java.util.Map;

/**
 * Map containing keys which are FilterDefinitionUsage objects {@link FilterDefinitionUsage} and
 * values which are FilterDefinition objects {@link FilterDefinition}
 */
@AutoValue
public abstract class FilterDefinitionByFilterDefinitionUsage {

  public abstract ImmutableMap<FilterDefinitionUsage, FilterDefinition>
      getFilterDefinitionByFilterDefinitionUsage();

  @JsonCreator
  public static FilterDefinitionByFilterDefinitionUsage from(
      @JsonProperty("filterDefinitionByFilterDefinitionUsage")
          Map<FilterDefinitionUsage, FilterDefinition> filterDefinitionByFilterDefinitionUsage) {

    return new AutoValue_FilterDefinitionByFilterDefinitionUsage(
        ImmutableMap.copyOf(filterDefinitionByFilterDefinitionUsage));
  }

  @JsonIgnore
  public List<FilterDefinitionUsage> getFilterDefinitionUsageList() {
    return getFilterDefinitionByFilterDefinitionUsage().entrySet().stream()
        .map(Map.Entry::getKey)
        .toList();
  }

  @JsonIgnore
  public List<FilterDefinition> getFilterDefinitionList() {
    return getFilterDefinitionByFilterDefinitionUsage().entrySet().stream()
        .map(Map.Entry::getValue)
        .toList();
  }
}
