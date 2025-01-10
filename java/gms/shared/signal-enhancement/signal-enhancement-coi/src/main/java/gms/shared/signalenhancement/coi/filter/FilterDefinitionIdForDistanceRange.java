package gms.shared.signalenhancement.coi.filter;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Optional;
import java.util.UUID;

/**
 * Represents the configuration for a {@link FilterDefinition}, optionally bound by a {@link
 * DistanceRangeDeg}
 *
 * @param filterDefinitionId the {@link UUID} of the associated {@link FilterDefinition}
 * @param distanceRange the distanceRange to be used to constrain the definition
 */
public record FilterDefinitionIdForDistanceRange(
    UUID filterDefinitionId, Optional<DistanceRangeDeg> distanceRange) {

  /** Validation */
  public FilterDefinitionIdForDistanceRange {
    Preconditions.checkNotNull(filterDefinitionId);
    Preconditions.checkNotNull(distanceRange);
  }

  /** Factory method omitting Optional */
  public FilterDefinitionIdForDistanceRange(UUID filterDefinitionId) {
    this(filterDefinitionId, Optional.empty());
  }

  /** Factory method wrapping distance range in Optional */
  public FilterDefinitionIdForDistanceRange(
      UUID filterDefinitionId, DistanceRangeDeg distanceRange) {
    this(filterDefinitionId, Optional.of(distanceRange));
  }

  /** Convert from {@link FilterDefinition} value object to "unique ID" reference */
  public FilterDefinitionIdForDistanceRange(FilterDefinitionForDistanceRange fdForDistanceRange) {
    this(
        fdForDistanceRange.filterDefinition().getUniqueIdentifier(),
        fdForDistanceRange.distanceRange());
  }
}
