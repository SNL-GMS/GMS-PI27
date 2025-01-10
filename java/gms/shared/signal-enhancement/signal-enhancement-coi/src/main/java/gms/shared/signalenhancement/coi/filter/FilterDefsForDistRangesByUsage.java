package gms.shared.signalenhancement.coi.filter;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableMap;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collector;
import java.util.stream.Collectors;

/**
 * Optimized mapping of {@link FilterDefinition}s with their unique IDs indexed by usage and
 * distance range, then the {@link FilterDefinition}s themselves indexed by their unique IDs
 *
 * @param filterDefIdsForDistanceRangesByUsage {@link FilterDefinition} unique IDs indexed by usage
 *     and distance range
 * @param filterDefinitionsById {@link FilterDefinition}s indexed by their unique IDs
 */
public record FilterDefsForDistRangesByUsage(
    Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>
        filterDefIdsForDistanceRangesByUsage,
    Map<UUID, FilterDefinition> filterDefinitionsById) {
  /** Validation */
  public FilterDefsForDistRangesByUsage {
    Preconditions.checkNotNull(filterDefIdsForDistanceRangesByUsage);
    Preconditions.checkNotNull(filterDefinitionsById);
    Preconditions.checkArgument(
        !(filterDefIdsForDistanceRangesByUsage.isEmpty() ^ filterDefinitionsById.isEmpty()),
        "FD ID by Usage map and FD by ID map must either both be populated or both empty.");

    var fdIdByUsageMapFdIdSet =
        filterDefIdsForDistanceRangesByUsage.entrySet().stream()
            .map(
                entry ->
                    entry.getValue().stream()
                        .map(FilterDefinitionIdForDistanceRange::filterDefinitionId))
            .flatMap(Function.identity())
            .distinct()
            .collect(Collectors.toSet());

    Preconditions.checkArgument(
        filterDefinitionsById.keySet().equals(fdIdByUsageMapFdIdSet),
        "FilterDefinition IDs in FD ID by Usage map must all map to a key in the FD by ID map, and"
            + " vise versa.");
  }

  public Builder toBuilder() {
    return new Builder(this);
  }

  /** A {@link FilterDefsForDistRangesByUsage} builder */
  public static final class Builder {

    ImmutableMap.Builder<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>
        filterDefIdsForDistanceRangesByUsageBuilder;
    Map<UUID, FilterDefinition> filterDefinitionsByIdBuilder;

    public Builder() {
      this.filterDefIdsForDistanceRangesByUsageBuilder =
          ImmutableMap.<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>builder();
      // Since there is a chance for many duplicate insertions while building, opting for a more
      // efficient map with over-writeable keys instead of ImmutableMap.Builder
      this.filterDefinitionsByIdBuilder = new LinkedHashMap<>();
    }

    /**
     * Conversion method for transforming a {@link FilterDefsForDistRangesByUsage} into its {@link
     * Builder}
     *
     * @param source The {@link FilterDefsForDistRangesByUsage} to convert
     */
    private Builder(FilterDefsForDistRangesByUsage source) {
      this();
      this.filterDefIdsForDistanceRangesByUsageBuilder.putAll(
          source.filterDefIdsForDistanceRangesByUsage);
      this.filterDefinitionsByIdBuilder.putAll(source.filterDefinitionsById);
    }

    /**
     * Add the contents of a "Filter Definition for Distance Range by Usage" map entry to this
     * {@link Builder}
     *
     * @param entry A {@link Map.Entry} containing all {@link FilterDefinitionForDistanceRange}s for
     *     a given {@link FilterDefinitionUsage}
     * @return The {@link Builder} with this entry's contents incorporated
     */
    public Builder withEntry(
        Map.Entry<FilterDefinitionUsage, List<FilterDefinitionForDistanceRange>> entry) {
      var fdIdsForDistanceRanges =
          entry.getValue().stream()
              .map(
                  (FilterDefinitionForDistanceRange fdForDistanceRange) -> {
                    this.filterDefinitionsByIdBuilder.put(
                        fdForDistanceRange.filterDefinition().getUniqueIdentifier(),
                        fdForDistanceRange.filterDefinition());
                    return new FilterDefinitionIdForDistanceRange(fdForDistanceRange);
                  })
              .toList();
      filterDefIdsForDistanceRangesByUsageBuilder.put(
          Map.entry(entry.getKey(), fdIdsForDistanceRanges));

      return this;
    }

    /**
     * Combiner used for collectors
     *
     * @param other the other {@link Builder} to combine with
     * @return A {@link Builder} that is the combination of two builders
     */
    Builder combine(Builder other) {
      this.filterDefIdsForDistanceRangesByUsageBuilder.putAll(
          other.filterDefIdsForDistanceRangesByUsageBuilder.build());
      this.filterDefinitionsByIdBuilder.putAll(other.filterDefinitionsByIdBuilder);
      return this;
    }

    /**
     * Construct a {@link FilterDefsByUsageTable} with the {@link Builder}'s contents
     *
     * @return A built {@link FilterDefsByUsageTable}
     */
    public FilterDefsForDistRangesByUsage build() {
      return new FilterDefsForDistRangesByUsage(
          filterDefIdsForDistanceRangesByUsageBuilder.buildKeepingLast(),
          ImmutableMap.copyOf(filterDefinitionsByIdBuilder));
    }
  }

  /**
   * Returns a {@link Collector} to be used when aggregating "FilterDefinition for Distance Range by
   * Usage" {@link Map.Entry}s
   *
   * @return A {@link FilterDefsForDistRangesByUsage} {@link Collector}
   */
  public static Collector<
          Map.Entry<FilterDefinitionUsage, List<FilterDefinitionForDistanceRange>>,
          ?,
          FilterDefsForDistRangesByUsage>
      toFilterDefsForDistRangesByUsage() {

    return Collector.of(
        (Supplier<FilterDefsForDistRangesByUsage.Builder>)
            FilterDefsForDistRangesByUsage.Builder::new,
        FilterDefsForDistRangesByUsage.Builder::withEntry,
        FilterDefsForDistRangesByUsage.Builder::combine,
        FilterDefsForDistRangesByUsage.Builder::build);
  }
}
