package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.Set;

/**
 * Represents the request for the Filter Definitions By Usage Map from the UI
 *
 * @param channels the set of channels to query filter definitions for, must not be null and have at
 *     least one channel
 * @param phases the set of phases to query filter definitions for, must not be null and have at
 *     least one phase
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record FilterDefintionByUsageMapRequest(Set<Channel> channels, Set<PhaseType> phases) {

  /** Validation */
  public FilterDefintionByUsageMapRequest {
    Preconditions.checkNotNull(channels);
    Preconditions.checkNotNull(phases);
    Preconditions.checkArgument(!channels.isEmpty(), "There must be at least one Channel");
    Preconditions.checkArgument(!phases.isEmpty(), "There must be at least one Phase");
  }
}
