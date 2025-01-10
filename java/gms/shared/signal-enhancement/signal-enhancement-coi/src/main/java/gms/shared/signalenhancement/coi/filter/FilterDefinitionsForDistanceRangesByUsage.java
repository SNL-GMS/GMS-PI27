package gms.shared.signalenhancement.coi.filter;

import com.google.common.collect.ImmutableRangeMap;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.msgpack.core.Preconditions;

/**
 * Represents the configuration resolved that maps {@link FilterDefinition}s for a series of {@link
 * DistanceRangeDeg} indexed by {@link FilterDefinitionUsage}
 *
 * @param filterDefinitionsForDistanceRangesByUsage the resolved configuration parameters that maps
 *     {@link FilterDefinition}s for a series of {@link DistanceRangeDeg} indexed by {@link
 *     FilterDefinitionUsage}
 */
public record FilterDefinitionsForDistanceRangesByUsage(
    Map<FilterDefinitionUsage, List<FilterDefinitionForDistanceRange>>
        filterDefinitionsForDistanceRangesByUsage) {

  /** Validation */
  public FilterDefinitionsForDistanceRangesByUsage {
    Preconditions.checkNotNull(filterDefinitionsForDistanceRangesByUsage);
    Preconditions.checkArgument(
        !filterDefinitionsForDistanceRangesByUsage.isEmpty(),
        "Filter Definitions by Usage map cannot be empty");

    filterDefinitionsForDistanceRangesByUsage
        .values()
        .forEach(FilterDefinitionsForDistanceRangesByUsage::validateDefintionsForDistanceRanges);
  }

  private static void validateDefintionsForDistanceRanges(
      Collection<FilterDefinitionForDistanceRange> filterDefinitionsForDistanceRanges) {

    Preconditions.checkArgument(
        !filterDefinitionsForDistanceRanges.isEmpty(),
        "Filter Definitions for Distance Ranges must have at least one entry");

    var unconstrainedCount =
        filterDefinitionsForDistanceRanges.stream()
            .filter(fdfdr -> fdfdr.distanceRange().isEmpty())
            .count();

    Preconditions.checkArgument(
        unconstrainedCount <= 1, "There should be at most one unconstrained FilterDefinition");

    if (unconstrainedCount == 1) {
      Preconditions.checkArgument(
          filterDefinitionsForDistanceRanges.size() == unconstrainedCount,
          "Connot have unconstrained FilterDefinition along side a constrained FilterDefinition");
    }

    // this is to validate there are no overlapping distance ranges
    // we utilize the ImmutableRangeMaps behavior to achieve this validation
    ImmutableRangeMap.Builder<Double, FilterDefinition> fdForDistRangeMap =
        new ImmutableRangeMap.Builder<>();
    filterDefinitionsForDistanceRanges.stream()
        .map(FilterDefinitionForDistanceRange::asRangeMapEntry)
        .flatMap(Optional::stream)
        .forEach(rme -> fdForDistRangeMap.put(rme.getKey(), rme.getValue()));
    fdForDistRangeMap.build();
  }
}
