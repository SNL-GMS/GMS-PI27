package gms.shared.signalenhancement.coi.filter;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Map;
import java.util.Optional;

/**
 * Represents the configuration for a {@link FilterDefinition}, optionally bound by a {@link
 * DistanceRangeDeg}
 *
 * @param filterDefinition the filterDefintion to be used
 * @param distanceRange the distanceRange to be used to constrain the definition
 */
public record FilterDefinitionForDistanceRange(
    FilterDefinition filterDefinition, Optional<DistanceRangeDeg> distanceRange) {

  /** Factory method omitting Optional */
  public FilterDefinitionForDistanceRange(FilterDefinition filterDefinition) {
    this(filterDefinition, Optional.empty());
  }

  /** Factory method wrapping distance range in Optional */
  public FilterDefinitionForDistanceRange(
      FilterDefinition filterDefinition, DistanceRangeDeg distanceRange) {
    this(filterDefinition, Optional.of(distanceRange));
  }

  /** Validation */
  public FilterDefinitionForDistanceRange {
    Preconditions.checkNotNull(filterDefinition);
    Preconditions.checkNotNull(distanceRange);
  }

  /**
   * Transforms the {@link FilterDefinitionForDistanceRange} into a Range Map entry for composition
   * into a Map<Range<Double>, FilterDefinition> by callers
   *
   * @return The RangeMap entry representation of the {@link FilterDefinitionForDistanceRange}
   */
  public Optional<Map.Entry<Range<Double>, FilterDefinition>> asRangeMapEntry() {
    return this.distanceRange.map(dr -> Map.entry(dr.asRange(), this.filterDefinition));
  }
}
