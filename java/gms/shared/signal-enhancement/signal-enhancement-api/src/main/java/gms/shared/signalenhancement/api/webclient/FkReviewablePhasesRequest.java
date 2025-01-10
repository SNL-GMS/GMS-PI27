package gms.shared.signalenhancement.api.webclient;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.Collection;

/**
 * Request body structure for the "FK Reviewable Phases" Endpoint
 *
 * @param stations {@link Station}s to be matched against configuration
 * @param activity Activity {@link WorkflowDefinitionId} to be matched against configuration
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record FkReviewablePhasesRequest(
    Collection<Station> stations, WorkflowDefinitionId activity) {
  /** Validation */
  public FkReviewablePhasesRequest {
    Preconditions.checkNotNull(stations);
    Preconditions.checkNotNull(activity);
  }
}
