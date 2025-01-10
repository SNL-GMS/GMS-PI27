package gms.shared.event.api;

import gms.shared.event.coi.Event;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Defines EventRepository methods */
public interface EventRepository {

  /**
   * Finds Events occurring in the time range provided and for the provided stage.
   *
   * @param startTime Beginning of the time range
   * @param endTime End of the time range
   * @param stageId The stageId of the Events to return
   * @return Set of Events
   */
  Set<Event> findByTime(Instant startTime, Instant endTime, WorkflowDefinitionId stageId);

  /**
   * Finds Events associated with the provided signal detections and stage
   *
   * @param signalDetectionHypotheses A collection of {@link SignalDetectionHypothesis} objects
   * @param stageId The {@link WorkflowDefinitionId} of the Events to return
   * @return Set of Events
   */
  Set<Event> findByAssociatedDetectionHypotheses(
      Collection<SignalDetectionHypothesis> signalDetectionHypotheses,
      WorkflowDefinitionId stageId);

  /**
   * Finds Events with the provided UUIDs and for the provided stage
   *
   * @param uuids UUIDs of Events to retrieve
   * @param stageId The stageId of the Events to return
   * @return Set of Events
   */
  Set<Event> findByIds(Collection<UUID> uuids, WorkflowDefinitionId stageId);

  /**
   * Retrieves default-faceted Event Hypotheses associated with the provided IDs
   *
   * @param eventHypothesisIds IDs of the desired hypotheses
   * @return The default-faceted Event Hypotheses associated with the provided IDs
   */
  List<EventHypothesis> findHypothesesByIds(Collection<EventHypothesis.Id> eventHypothesisIds);

  /**
   * Determines whether the ORIGIN record with the provided orid is preferred by its EVENT in the
   * legacy database for the provided Stage
   *
   * @param orid to compare with the Event record prefer attribute
   * @param stageId The stageId of the Events to return
   * @return whether the orid id matches the preferred id in the event dao
   */
  boolean isLatestPreferred(long orid, WorkflowDefinitionId stageId);
}
