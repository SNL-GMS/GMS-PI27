package gms.shared.signalenhancement.coi.filter;

import com.google.common.base.Preconditions;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Sets;
import com.google.common.collect.Table;
import com.google.common.collect.Table.Cell;
import com.google.common.collect.Tables;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.signalenhancement.coi.utils.ChannelComponents;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Optimized mapping of {@link FilterDefinition}s with their unique IDs indexed by {@link Channel}
 * name, {@link PhaseType}, {@link FilterDefinitionUsage} and distance range, then a separate
 * mapping of the {@link FilterDefinition}s themselves indexed by their unique IDs
 *
 * @param filterDefinitionIdsByUsage {@link FilterDefinition} unique IDs indexed by {@link Channel}
 *     name, {@link PhaseType}, {@link FilterDefinitionUsage} and distance range
 * @param globalDefaults Unique IDs for global default {@link FilterDefinition}s indexed by {@link
 *     FilterDefinitionUsage} and distance range
 * @param filterDefinitionsById {@link FilterDefinition}s indexed by their unique IDs
 */
public record FilterDefsByUsageTable(
    Table<String, PhaseType, Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
        filterDefinitionIdsByUsage,
    Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>> globalDefaults,
    Map<UUID, FilterDefinition> filterDefinitionsById) {

  /** Validation */
  public FilterDefsByUsageTable {
    Preconditions.checkNotNull(filterDefinitionIdsByUsage);
    Preconditions.checkNotNull(filterDefinitionsById);
    Preconditions.checkNotNull(globalDefaults);
    Preconditions.checkArgument(!globalDefaults.entrySet().isEmpty());
    Preconditions.checkArgument(!filterDefinitionsById.isEmpty());

    var tableFdIdSet =
        filterDefinitionIdsByUsage.cellSet().stream()
            .map(
                cell ->
                    cell.getValue().values().stream()
                        .flatMap(List::stream)
                        .map(FilterDefinitionIdForDistanceRange::filterDefinitionId))
            .flatMap(Function.identity())
            .collect(Collectors.toSet());

    var globaFdIdSet =
        globalDefaults.values().stream()
            .map(ls -> ls.stream().map(FilterDefinitionIdForDistanceRange::filterDefinitionId))
            .flatMap(Function.identity())
            .collect(Collectors.toSet());

    Preconditions.checkArgument(
        filterDefinitionsById.keySet().equals(Sets.union(tableFdIdSet, globaFdIdSet)),
        "FilterDefinition IDs in FD ID by Usage table and the global Fd ID set must all map to a"
            + " key in the FD by ID map, and vise versa.");
  }

  /**
   * Convenience method to convert into a {@link Builder}
   *
   * @return This {@link FilterDefsByUsageTable} as a builder
   */
  public Builder toBuilder() {
    return new Builder(this);
  }

  /** A {@link FilterDefsByUsageTable} builder */
  public static final class Builder {

    ImmutableTable.Builder<
            String, PhaseType, Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
        filterDefinitionIdsByUsageBuilder;
    Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>> defaultFdIdsByUsage;
    Map<UUID, FilterDefinition> filterDefinitionsByIdBuilder;
    Map<UUID, FilterDefinition> globalFilterDefinitionsByIds;

    public Builder() {
      this.filterDefinitionIdsByUsageBuilder =
          ImmutableTable
              .<String, PhaseType,
                  Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                  builder();
      this.defaultFdIdsByUsage = new LinkedHashMap<>();
      // Since there is a chance for many duplicate insertions while building, opting for a more
      // efficient map with over-writeable keys instead of ImmutableMap.Builder
      this.filterDefinitionsByIdBuilder = new LinkedHashMap<>();
      this.globalFilterDefinitionsByIds = new LinkedHashMap<>();
    }

    public Builder(FilterDefsByUsageTable source) {
      this();
      this.filterDefinitionIdsByUsageBuilder.putAll(source.filterDefinitionIdsByUsage);
      this.defaultFdIdsByUsage = source.globalDefaults;
      this.filterDefinitionsByIdBuilder = new LinkedHashMap<>(source.filterDefinitionsById);
    }

    /**
     * Add the contents of a {@link TableCell} to the table. Note calling this twice with the same
     * cell will cause a build failure.
     *
     * @param cell The cell whose contents will be aggregated into the table builder
     * @return The builder with the cell's contents added
     */
    public Builder withCell(TableCell cell) {
      this.filterDefinitionIdsByUsageBuilder.put(cell.filterDefIdsByUsageCell);
      this.filterDefinitionsByIdBuilder.putAll(cell.filterDefinitionsById);
      return this;
    }

    /**
     * Add the contents of a {@link FilterDefsForDistRangesByUsage} to the table as the global
     * defaults. Multiple calls to this method will override the defaults being used to the last
     * called.
     *
     * @param filterDefsForDistRangesByUsage The optimized mapping containing the global default FDs
     *     mapped by usage and distance range
     * @return The builder with the mapping's contents added
     */
    public Builder withGlobalDefaults(
        FilterDefsForDistRangesByUsage filterDefsForDistRangesByUsage) {
      this.defaultFdIdsByUsage =
          filterDefsForDistRangesByUsage.filterDefIdsForDistanceRangesByUsage();
      this.globalFilterDefinitionsByIds = filterDefsForDistRangesByUsage.filterDefinitionsById();
      return this;
    }

    /**
     * Combiner used for collectors
     *
     * @param other the other {@link Builder} to combine with
     * @return A {@link Builder} that is the combination of two builders
     */
    Builder combine(Builder other) {
      // Need to carefully join the cells of each builder to form a single table without collisions
      var builderCellsStream =
          Stream.concat(
                  this.filterDefinitionIdsByUsageBuilder.buildOrThrow().cellSet().stream(),
                  other.filterDefinitionIdsByUsageBuilder.buildOrThrow().cellSet().stream())
              .parallel();
      var dedupedCellsTable =
          builderCellsStream.collect(
              Tables.toTable(
                  Table.Cell::getRowKey,
                  Table.Cell::getColumnKey,
                  Table.Cell::getValue,
                  // Currently a very simplistic merge strategy
                  (a, b) -> b,
                  HashBasedTable::create));
      this.filterDefinitionIdsByUsageBuilder =
          ImmutableTable
              .<String, PhaseType,
                  Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                  builder()
              .putAll(dedupedCellsTable);
      this.filterDefinitionsByIdBuilder.putAll(other.filterDefinitionsByIdBuilder);

      // Don't want to get fancy with merge, just override
      this.defaultFdIdsByUsage = other.defaultFdIdsByUsage;

      // Prune overridden FDs
      var remainingFdIds =
          Stream.concat(
                  this.filterDefinitionIdsByUsageBuilder.buildOrThrow().values().stream()
                      .map(Map::values)
                      .flatMap(Collection::stream)
                      .flatMap(List::stream)
                      .map(fdIdFdr -> fdIdFdr.filterDefinitionId()),
                  this.defaultFdIdsByUsage.values().stream()
                      .flatMap(List::stream)
                      .map(fdIdFdr -> fdIdFdr.filterDefinitionId()))
              .collect(Collectors.toSet());

      this.filterDefinitionsByIdBuilder =
          this.filterDefinitionsByIdBuilder.entrySet().stream()
              .filter(entry -> remainingFdIds.contains(entry.getKey()))
              .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
      return this;
    }

    /**
     * Construct a {@link FilterDefsByUsageTable} with the {@link Builder}'s contents
     *
     * @return A built {@link FilterDefsByUsageTable}
     */
    public FilterDefsByUsageTable build() {
      Preconditions.checkNotNull(defaultFdIdsByUsage);

      // combine the global and regular fdbyIds map on build time
      this.filterDefinitionsByIdBuilder.putAll(this.globalFilterDefinitionsByIds);
      return new FilterDefsByUsageTable(
          this.filterDefinitionIdsByUsageBuilder.buildOrThrow(),
          this.defaultFdIdsByUsage,
          ImmutableMap.copyOf(this.filterDefinitionsByIdBuilder));
    }

    /**
     * Returns a {@link Collector} to be used when aggregating {@link TableCells}
     *
     * @return A {@link FilterDefsByUsageTable.Builder} {@link Collector}
     */
    public static Collector<TableCell, ?, FilterDefsByUsageTable.Builder> toBuilder() {

      return Collector.of(
          (Supplier<FilterDefsByUsageTable.Builder>) FilterDefsByUsageTable.Builder::new,
          FilterDefsByUsageTable.Builder::withCell,
          FilterDefsByUsageTable.Builder::combine,
          Function.identity());
    }
  }

  public record TableCell(
      Cell<String, PhaseType, Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
          filterDefIdsByUsageCell,
      Map<UUID, FilterDefinition> filterDefinitionsById) {
    public TableCell(
        ChannelComponents components,
        PhaseType phase,
        FilterDefsForDistRangesByUsage filterDefsForDistRangeByUsage) {
      this(
          Tables
              .<String, PhaseType,
                  Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                  immutableCell(
                      components.channelName(),
                      phase,
                      filterDefsForDistRangeByUsage.filterDefIdsForDistanceRangesByUsage()),
          filterDefsForDistRangeByUsage.filterDefinitionsById());
    }
  }
}
