package gms.shared.event.accessor;

import gms.shared.event.accessor.facet.EventFacetingDefinitions;
import gms.shared.event.accessor.facet.EventFacetingUtility;
import gms.shared.event.accessor.facet.FacetingTypes;
import gms.shared.event.api.EventAccessor;
import gms.shared.event.api.EventRepository;
import gms.shared.event.api.EventStatusInfoByStageIdAndEventIdsResponse;
import gms.shared.event.api.EventsWithDetectionsAndSegments;
import gms.shared.event.coi.Event;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventStatusInfo;
import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.utilities.logging.TimingLogger;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** {@inheritDoc} */
@Component
public class DefaultEventAccessor implements EventAccessor {

  private static final Logger LOGGER = LoggerFactory.getLogger(DefaultEventAccessor.class);
  private static final TimingLogger<Set<Event>> eventLogger = TimingLogger.create(LOGGER);
  private static final TimingLogger<SignalDetectionsWithChannelSegments> sigDetLogger =
      TimingLogger.create(LOGGER);

  private final EventRepository eventRepository;
  private final EventFacetingUtility eventFacetingUtility;
  private final SignalDetectionAccessor signalDetectionAccessor;
  private final EventStatusInfoCache eventStatusInfoCache;
  private final Environment environment;

  /**
   * Creates a new EventAccessor instance
   *
   * @param eventRepository EventRepository the created EventAccessor will delegate some operations
   *     to
   * @param eventFacetingUtility Creates object subject to faceting definition
   * @param signalDetectionAccessor SignalDetection data access utility
   * @param eventStatusInfoCache EventStatus cache object
   */
  @Autowired
  public DefaultEventAccessor(
      EventRepository eventRepository,
      @Lazy EventFacetingUtility eventFacetingUtility,
      @Qualifier("bridgedSignalDetectionAccessor") SignalDetectionAccessor signalDetectionAccessor,
      EventStatusInfoCache eventStatusInfoCache,
      Environment environment) {

    this.eventRepository = eventRepository;
    this.eventFacetingUtility = eventFacetingUtility;
    this.signalDetectionAccessor = signalDetectionAccessor;
    this.eventStatusInfoCache = eventStatusInfoCache;
    this.environment = environment;
  }

  /** {@inheritDoc} */
  @Override
  public Set<Event> findByIds(Collection<UUID> uuids, WorkflowDefinitionId stageId) {
    return eventRepository.findByIds(uuids, stageId);
  }

  /** {@inheritDoc} */
  @Override
  public Set<Event> findByTime(Instant startTime, Instant endTime, WorkflowDefinitionId stageId) {
    return eventRepository.findByTime(startTime, endTime, stageId);
  }

  /** {@inheritDoc} */
  @Override
  public Set<Event> findByTime(
      Instant startTime,
      Instant endTime,
      WorkflowDefinitionId stageId,
      Optional<FacetingDefinition> facetingDefinitionOpt) {

    return facetingDefinitionOpt
        .map(
            facetingDefinition ->
                findByTime(startTime, endTime, stageId).stream()
                    .map(
                        event ->
                            eventFacetingUtility.populateFacets(event, stageId, facetingDefinition))
                    .collect(Collectors.toSet()))
        .orElseGet(() -> findByTime(startTime, endTime, stageId));
  }

  /**
   * Retrieves Event Hypotheses associated with the provided IDs adhering to the provided {@link
   * FacetingDefinition}
   *
   * @param eventHypothesisIds IDs of the desired hypotheses
   * @param facetingDefinition Definition outlining the desired faceting structure of the resultant
   *     hypotheses
   * @return The Event Hypotheses associated with the provided IDs adhering to the provided {@link
   *     FacetingDefinition}
   */
  public List<EventHypothesis> findHypothesesByIds(
      Collection<EventHypothesis.Id> eventHypothesisIds, FacetingDefinition facetingDefinition) {
    // DEFAULT_FACETED_EVENT_HYPOTHESIS is a special case as eventRepository.findHypothesesByIds
    // already returns
    // expected results with no further processing required
    return (facetingDefinition
            .getClassType()
            .equals(FacetingTypes.DEFAULT_FACETED_EVENT_HYPOTHESIS_TYPE.toString()))
        ? eventRepository.findHypothesesByIds(eventHypothesisIds)
        : eventRepository.findHypothesesByIds(eventHypothesisIds).stream()
            .map(eH -> eventFacetingUtility.populateFacets(eH, facetingDefinition))
            .flatMap(List::stream)
            .toList();
  }

  /** {@inheritDoc} */
  @Override
  public List<EventHypothesis> findHypothesesByIds(
      Collection<EventHypothesis.Id> eventHypothesisIds) {
    var defaultEventHypothesisFacetingDefinition =
        FacetingDefinition.builder()
            .setPopulated(true)
            .setClassType(FacetingTypes.DEFAULT_FACETED_EVENT_HYPOTHESIS_TYPE.toString())
            .build();
    return findHypothesesByIds(eventHypothesisIds, defaultEventHypothesisFacetingDefinition);
  }

  /** {@inheritDoc} */
  @Override
  public EventsWithDetectionsAndSegments findEventsWithDetectionsAndSegmentsByTime(
      Instant startTime, Instant endTime, WorkflowDefinitionId stageId) {

    var events =
        eventLogger.apply(
            this.getClass().getSimpleName() + "::findByTime",
            () -> eventRepository.findByTime(startTime, endTime, stageId),
            environment.getActiveProfiles());

    var populatedEvents =
        eventLogger.apply(
            this.getClass().getSimpleName() + "::populateEventFacets",
            () -> populateEventFacets(events, stageId),
            environment.getActiveProfiles());

    var signalDetectionsWithChannelSegments =
        sigDetLogger.apply(
            this.getClass().getSimpleName() + "::getAssociatedSignalDetectionsWithChannelSegments",
            () -> getAssociatedSignalDetectionsWithChannelSegments(populatedEvents, stageId),
            environment.getActiveProfiles());

    return EventsWithDetectionsAndSegments.builder()
        .setEvents(populatedEvents)
        .setDetectionsWithChannelSegments(
            SignalDetectionsWithChannelSegments.builder()
                .setSignalDetections(signalDetectionsWithChannelSegments.getSignalDetections())
                .setChannelSegments(signalDetectionsWithChannelSegments.getChannelSegments())
                .build())
        .build();
  }

  private Set<Event> populateEventFacets(Set<Event> events, WorkflowDefinitionId stageId) {
    return events.stream()
        .parallel()
        .map(
            event ->
                eventFacetingUtility.populateFacets(
                    event, stageId, EventFacetingDefinitions.defaultEventFacetDefinition))
        .collect(Collectors.toSet());
  }

  /**
   * Finds {@link Event}s associated with the provided signal detections and stage
   *
   * @param signalDetectionHypotheses A collection of {@link SignalDetectionHypothesis} objects
   * @param stageId The {@link WorkflowDefinitionId} of the Events to return
   * @return Set of Events
   */
  public Set<Event> findByAssociatedDetectionHypotheses(
      Collection<SignalDetectionHypothesis> signalDetectionHypotheses,
      WorkflowDefinitionId stageId) {
    var events =
        eventRepository.findByAssociatedDetectionHypotheses(signalDetectionHypotheses, stageId);

    events =
        events.stream()
            .map(
                event ->
                    eventFacetingUtility.populateFacets(
                        event, stageId, EventFacetingDefinitions.defaultEventFacetDefinition))
            .collect(Collectors.toSet());

    return events;
  }

  /** {@inheritDoc} */
  @Override
  public EventStatusInfoByStageIdAndEventIdsResponse findEventStatusInfoByStageIdAndEventIds(
      WorkflowDefinitionId stageId, List<UUID> eventIds) {
    final var eventStatusInfos =
        eventIds.stream()
            .distinct()
            .map(
                event ->
                    Pair.of(event, eventStatusInfoCache.getOrCreateEventStatusInfo(stageId, event)))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));

    return EventStatusInfoByStageIdAndEventIdsResponse.builder()
        .setStageId(stageId)
        .setEventStatusInfoMap(eventStatusInfos)
        .build();
  }

  /** {@inheritDoc} */
  @Override
  public void updateEventStatusInfo(
      WorkflowDefinitionId stageId, UUID eventId, EventStatusInfo eventStatusInfo) {
    this.eventStatusInfoCache.addEventStatusInfo(stageId, eventId, eventStatusInfo);
  }

  /**
   * Determines whether the ORIGIN record with the provided orid is preferred by its EVENT in the
   * legacy database for the provided Stage
   *
   * @param orid to compare with the Event record prefer attribute
   * @param stageId The stageId of the Events to return
   * @return whether the orid id matches the preferred id in the event dao
   */
  @Override
  public boolean isLatestPreferred(long orid, WorkflowDefinitionId stageId) {
    return this.eventRepository.isLatestPreferred(orid, stageId);
  }

  /**
   * Gets the SignalDetections with ChannelSegments associated with the provided Events
   *
   * @param events Returns the SignalDetections and ChannelSegments associated with these Events
   * @param stageId Stage of the provided Events
   * @return SignalDetections with ChannelSegments associated with the provided Events
   */
  private SignalDetectionsWithChannelSegments getAssociatedSignalDetectionsWithChannelSegments(
      Collection<Event> events, WorkflowDefinitionId stageId) {

    var associatedSignalDetectionIds =
        events.stream()
            .flatMap(
                e ->
                    e
                        .getData()
                        .orElseThrow(
                            () ->
                                new IllegalStateException(
                                    "Event Data was not there! cannot continue"))
                        .getEventHypotheses()
                        .stream())
            .map(EventHypothesis::getData)
            .flatMap(Optional::stream)
            .flatMap(ehData -> ehData.getAssociatedSignalDetectionHypotheses().stream())
            .map(SignalDetectionHypothesis::getId)
            .map(SignalDetectionHypothesisId::getSignalDetectionId)
            .collect(Collectors.toSet());

    if (associatedSignalDetectionIds.isEmpty()) {
      LOGGER.debug(
          "No provided associatedSignalDetectionIds.  Not querying Signal Detection Accessor");
      return SignalDetectionsWithChannelSegments.builder().build();
    }

    LOGGER.debug(
        "Querying Signal Detection Accessor with associatedSignalDetectionIds[size={}]",
        associatedSignalDetectionIds.size());
    return signalDetectionAccessor.findWithSegmentsByIds(
        new ArrayList<>(associatedSignalDetectionIds), stageId);
  }
}
