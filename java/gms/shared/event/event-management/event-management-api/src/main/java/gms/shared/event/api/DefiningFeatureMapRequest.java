package gms.shared.event.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;

/** Value class that holds {@link PhaseType}s and {@link Channel}s */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DefiningFeatureMapRequest(
    ImmutableList<PhaseType> phases, ImmutableList<Channel> channels) {

  /** Constructor needed for null checks */
  public DefiningFeatureMapRequest {
    Preconditions.checkNotNull(phases);
    Preconditions.checkNotNull(channels);
  }
}
