package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Collection;

/** Value class that holds the information to request back {@link RotationTemplate}s from the SEC */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RotationTemplateRequest(Collection<Station> stations, Collection<PhaseType> phases) {

  /**
   * Value class that holds the information to request back {@link RotationTemplate}s from the SEC
   *
   * @param stations The list of stations to pull back back {@link RotationTemplate}s for
   * @param phases The list of {@link PhaseType}s to pull back {@link RotationTemplate}s for
   */
  public RotationTemplateRequest {
    Preconditions.checkNotNull(stations);
    Preconditions.checkNotNull(phases);
    Preconditions.checkArgument(!stations.isEmpty(), "There must be at least one station");
    Preconditions.checkArgument(!phases.isEmpty(), "There must be at least one phase");
  }
}
