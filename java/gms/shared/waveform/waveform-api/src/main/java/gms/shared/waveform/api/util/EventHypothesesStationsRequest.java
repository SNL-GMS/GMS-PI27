package gms.shared.waveform.api.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Preconditions;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Collection;
import java.util.Optional;
import org.apache.commons.lang3.Validate;

/** EventHypothesesStationsRequest for getting channel segments by event hypotheses */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EventHypothesesStationsRequest(
    Collection<EventHypothesis> eventHypotheses,
    Collection<Station> stations,
    Optional<FacetingDefinition> facetingDefinition) {

  /** Validation */
  public EventHypothesesStationsRequest {
    Preconditions.checkNotNull(eventHypotheses);
    Preconditions.checkNotNull(stations);
    Preconditions.checkNotNull(facetingDefinition);
    Validate.notEmpty(eventHypotheses, "Request must contain at least one event hypothesis");
    Validate.notEmpty(stations, "Request must contain at least one station");
  }
}
