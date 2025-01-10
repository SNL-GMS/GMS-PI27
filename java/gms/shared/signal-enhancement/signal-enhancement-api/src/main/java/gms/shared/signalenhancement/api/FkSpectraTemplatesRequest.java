package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Collection;
import org.apache.commons.lang3.Validate;

/**
 * Request body structure for the "FK Reviewable Phases" Endpoint
 *
 * @param stations {@link Station}s to be matched against configuration (non-empty)
 * @param phases {@link PhaseType}s to be matched against configuration (non-empty)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record FkSpectraTemplatesRequest(
    Collection<Station> stations, Collection<PhaseType> phases) {

  /** Validation */
  public FkSpectraTemplatesRequest {
    Validate.notEmpty(stations, "Request must contain at least one station");
    Validate.notEmpty(phases, "Request must contain at least phase type");
  }
}
