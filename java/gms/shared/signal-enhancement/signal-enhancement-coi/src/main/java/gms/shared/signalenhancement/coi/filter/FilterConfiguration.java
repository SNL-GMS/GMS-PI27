package gms.shared.signalenhancement.coi.filter;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;

@AutoValue
@JsonSerialize(as = FilterConfiguration.class)
public abstract class FilterConfiguration {

  public abstract FilterDefinition getFilterDefinition();

  @JsonCreator
  public static FilterConfiguration from(
      @JsonProperty("filterDefinition") FilterDefinition filterDefinition) {

    return new AutoValue_FilterConfiguration(filterDefinition);
  }
}
