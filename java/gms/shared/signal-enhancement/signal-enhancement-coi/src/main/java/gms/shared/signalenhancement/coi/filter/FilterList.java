package gms.shared.signalenhancement.coi.filter;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import java.util.List;

@AutoValue
public abstract class FilterList {
  public abstract String getName();

  public abstract int getDefaultFilterIndex();

  public abstract ImmutableList<FilterListEntry> getFilters();

  @JsonCreator
  public static FilterList from(
      @JsonProperty("name") String name,
      @JsonProperty("defaultFilterIndex") int defaultFilterIndex,
      @JsonProperty("filters") List<FilterListEntry> filters) {

    checkArgument(!filters.isEmpty(), "The filter list must contain at list one entry");

    return new AutoValue_FilterList(name, defaultFilterIndex, ImmutableList.copyOf(filters));
  }
}
