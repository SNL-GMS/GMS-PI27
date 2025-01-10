package gms.shared.signalenhancement.coi.filter;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;
import javax.annotation.Nullable;

@AutoValue
public abstract class FilterListEntry {
  public abstract boolean isWithinHotKeyCycle();

  public abstract Optional<Boolean> isUnfiltered();

  public abstract Optional<FilterDefinitionUsage> getNamedFilter();

  public abstract Optional<FilterDefinition> getFilterDefinition();

  @JsonCreator
  public static FilterListEntry from(
      @JsonProperty("withinHotKeyCycle") boolean withinHotKeyCycle,
      @Nullable @JsonProperty("unfiltered") Boolean unfiltered,
      @Nullable @JsonProperty("namedFilter") FilterDefinitionUsage namedFilter,
      @Nullable @JsonProperty("filterDefinition") FilterDefinition filterDefinition) {

    checkArgument(
        Stream.of(unfiltered, namedFilter, filterDefinition).filter(Objects::nonNull).count() == 1,
        "Exactly one filter entry must be populated");

    return new AutoValue_FilterListEntry(
        withinHotKeyCycle,
        Optional.ofNullable(unfiltered),
        Optional.ofNullable(namedFilter),
        Optional.ofNullable(filterDefinition));
  }
}
