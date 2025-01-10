package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.auto.value.extension.memoized.Memoized;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Table;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Map containing keys which are SignalDetectionHypothesis objects {@link SignalDetectionHypothesis}
 * and values which are FilterDefinitionByFilterDefinitionUsage objects {@link
 * FilterDefinitionByFilterDefinitionUsage}
 */
@AutoValue
public abstract class FilterDefinitionByUsageBySignalDetectionHypothesis {

  public abstract ImmutableList<
          SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair>
      getFilterDefinitionByUsageBySignalDetectionHypothesis();

  @JsonCreator
  public static FilterDefinitionByUsageBySignalDetectionHypothesis from(
      @JsonProperty("filterDefinitionByUsageBySignalDetectionHypothesis")
          Collection<SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair>
              filterDefinitionByUsageBySignalDetectionHypothesis) {

    return new AutoValue_FilterDefinitionByUsageBySignalDetectionHypothesis(
        ImmutableList.copyOf(filterDefinitionByUsageBySignalDetectionHypothesis));
  }

  /**
   * Constructor method retrieving values from a {@link Table}, generating the map-of-maps
   * structure.
   *
   * @param table the Table of values to transform
   * @return the map-of-maps representation of the table
   */
  public static FilterDefinitionByUsageBySignalDetectionHypothesis fromTable(
      Table<SignalDetectionHypothesis, FilterDefinitionUsage, FilterDefinition> table) {
    return FilterDefinitionByUsageBySignalDetectionHypothesis.from(
        table.rowMap().entrySet().stream()
            .map(
                entry ->
                    SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.create(
                        entry.getKey(),
                        FilterDefinitionByFilterDefinitionUsage.from(entry.getValue())))
            .toList());
  }

  @JsonIgnore
  @Memoized
  public Map<SignalDetectionHypothesis, FilterDefinitionByFilterDefinitionUsage>
      getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage() {

    return getFilterDefinitionByUsageBySignalDetectionHypothesis().stream()
        .collect(
            Collectors.toMap(
                SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair
                    ::getSignalDetectionHypothesis,
                SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair
                    ::getFilterDefinitionByFilterDefinitionUsage));
  }

  @JsonIgnore
  @Memoized
  public Map<SignalDetectionHypothesis, List<FilterDefinitionUsage>>
      getSignalDetectionHypothesisByFilterDefinitionUsage() {

    return getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage()
        .entrySet()
        .stream()
        .collect(
            Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getFilterDefinitionUsageList()));
  }

  @JsonIgnore
  @Memoized
  public Map<SignalDetectionHypothesis, List<FilterDefinition>>
      getSignalDetectionHypothesisByFilterDefinition() {

    return getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage()
        .entrySet()
        .stream()
        .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getFilterDefinitionList()));
  }
}
