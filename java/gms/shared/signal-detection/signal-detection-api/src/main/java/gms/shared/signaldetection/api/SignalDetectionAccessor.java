package gms.shared.signaldetection.api;

import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.apache.commons.lang3.tuple.Pair;
import reactor.core.publisher.Mono;

/**
 * Interface for a data access utility responsible for providing an expanded query interface and
 * caching for {@link SignalDetection} and {@link SignalDetectionHypothesis} objects
 */
public interface SignalDetectionAccessor extends SignalDetectionRepository {

  /**
   * Retrieves {@link SignalDetectionsWithChannelSegments} for the provided stations, time range,
   * stage id, and excluding any of the provided {@link SignalDetection}s
   *
   * @param stations the {@link Station}s to find {@link SignalDetection}s for
   * @param startTime the start time of the time range
   * @param endTime the end time of the time range
   * @param stageId the {@link WorkflowDefinitionId} for the stage
   * @param excludedSignalDetections the list of {@link SignalDetection}s to exclude from the
   *     results
   * @return the {@link SignalDetectionsWithChannelSegments} satisfying the requirements
   */
  SignalDetectionsWithChannelSegments findWithSegmentsByStationsAndTime(
      List<Station> stations,
      Instant startTime,
      Instant endTime,
      WorkflowDefinitionId stageId,
      List<SignalDetection> excludedSignalDetections);

  /**
   * Retrieves {@link SignalDetectionsWithChannelSegments} for the provided stations, time range,
   * stage id, and excluding any of the provided {@link SignalDetection}s, then applies faceting to
   * them based on the provided {@link FacetingDefinition}
   *
   * @param stations the {@link Station}s to find {@link SignalDetection}s for
   * @param startTime the start time of the time range
   * @param endTime the end time of the time range
   * @param stageId the {@link WorkflowDefinitionId} for the stage
   * @param excludedSignalDetections the list of {@link SignalDetection}s to exclude from the
   *     results
   * @param facetingDefinition the {@link FacetingDefinition} defining how the return {@link
   *     SignalDetection}s will be faceted.
   * @return the {@link SignalDetectionsWithChannelSegments} satisfying the requirements
   */
  List<SignalDetection> findByStationsAndTime(
      List<Station> stations,
      Instant startTime,
      Instant endTime,
      WorkflowDefinitionId stageId,
      List<SignalDetection> excludedSignalDetections,
      FacetingDefinition facetingDefinition);

  /**
   * Finds {@link SignalDetection}s by their ids and stage, then applies faceting to them based on
   * the provided {@link FacetingDefinition}
   *
   * @param ids the {@link UUID}s to find corresponding {@link SignalDetection}s
   * @param stageId the {@link WorkflowDefinitionId} defining the stage the {@link SignalDetection}s
   *     will be found in
   * @param facetingDefinition the {@link FacetingDefinition} defining how the return {@link
   *     SignalDetection}s will be faceted.
   * @return the faceted {@link SignalDetection}s
   */
  List<SignalDetection> findByIds(
      List<UUID> ids, WorkflowDefinitionId stageId, FacetingDefinition facetingDefinition);

  /**
   * Finds {@link SignalDetectionHypothesis} by their ids, then applies faceting to them based on
   * the provided {@link FacetingDefinition}
   *
   * @param ids the {@link SignalDetectionHypothesisId}s to find corresponding {@link
   *     SignalDetectionHypothesis}
   * @param facetingDefinition the {@link FacetingDefinition} defining how the return {@link
   *     SignalDetectionHypothesis} will be faceted.
   * @return the list of faceted {@link SignalDetectionHypothesis}
   */
  List<SignalDetectionHypothesis> findHypothesesByIds(
      List<SignalDetectionHypothesisId> ids, FacetingDefinition facetingDefinition);

  /**
   * Finds {@link SignalDetection}s by their ids and stage
   *
   * @param signalDetectionIds the {@link UUID}s to find corresponding {@link SignalDetection}s with
   *     {@link gms.shared.waveform.coi.ChannelSegment}s.
   * @param stageId the {@link WorkflowDefinitionId} defining the stage the {@link SignalDetection}s
   *     will be found in
   * @return the {@link SignalDetectionsWithChannelSegments}
   */
  SignalDetectionsWithChannelSegments findWithSegmentsByIds(
      List<UUID> signalDetectionIds, WorkflowDefinitionId stageId);

  /**
   * Finds {@link SignalDetection}s by their ids and stage, then applies faceting to them based on
   * the provided {@link FacetingDefinition}
   *
   * @param signalDetectionIds the {@link UUID}s to find corresponding {@link SignalDetection}s with
   *     {@link gms.shared.waveform.coi.ChannelSegment}s.
   * @param stageId the {@link WorkflowDefinitionId} defining the stage the {@link SignalDetection}s
   *     will be found in
   * @param facetingDefinition the {@link FacetingDefinition} defining how the return {@link
   *     SignalDetection}s will be faceted.
   * @return the faceted {@link SignalDetection}s
   */
  default SignalDetectionsWithChannelSegments findWithSegmentsByIds(
      List<UUID> signalDetectionIds,
      WorkflowDefinitionId stageId,
      FacetingDefinition facetingDefinition) {
    return SignalDetectionsWithChannelSegments.builder()
        .setChannelSegments(Set.of())
        .setSignalDetections(Set.of())
        .build();
  }

  /**
   * Finds the {@link FilterDefinition}s for the given {@link SignalDetection}s
   *
   * @param signalDetections the the list of {@link SignalDetection}s to find definitions for
   * @param stageId the workflowID
   * @return a Mono of a FilterDefinitionByUsageBySignalDetectionHypothesis object
   */
  Mono<Pair<FilterDefinitionByUsageBySignalDetectionHypothesis, Boolean>>
      findFilterDefinitionsForSignalDetections(
          List<SignalDetection> signalDetections, WorkflowDefinitionId stageId);
}
