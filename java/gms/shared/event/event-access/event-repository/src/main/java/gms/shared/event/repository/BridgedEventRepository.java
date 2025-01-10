package gms.shared.event.repository;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.AR_INFO_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.ASSOC_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.EVENT_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.EVENT_CONTROL_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.GA_TAG_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.NETMAG_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.ORIGERR_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.ORIGIN_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.STAMAG_CONNECTOR_TYPE;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;

import com.google.auto.value.AutoValue;
import com.google.auto.value.extension.memoized.Memoized;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Multimaps;
import gms.shared.event.api.EventRepository;
import gms.shared.event.coi.Event;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.PreferredEventHypothesis;
import gms.shared.event.connector.EventDatabaseConnector;
import gms.shared.event.connector.GaTagDatabaseConnector;
import gms.shared.event.connector.OriginDatabaseConnector;
import gms.shared.event.connector.StaMagDatabaseConnector;
import gms.shared.event.dao.ArInfoDao;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.EventDao;
import gms.shared.event.dao.GaTagDao;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.OrigerrDao;
import gms.shared.event.dao.OriginDao;
import gms.shared.event.dao.StaMagDao;
import gms.shared.event.repository.converter.EventConverter;
import gms.shared.event.utility.id.EventIdUtility;
import gms.shared.event.utility.id.OriginUniqueIdentifier;
import gms.shared.event.utility.processing.EventBridgeDefinition;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.dao.css.AridOridKey;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.repository.utils.SignalDetectionHypothesisAssocIdComponents;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Bridged implementation of EventRepository */
@Component("bridgedEventRepository")
public class BridgedEventRepository implements EventRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedEventRepository.class);

  public static final String ANALYST_REJECTED = "analyst_rejected";
  public static final String OBJECT_TYPE_A = "a";
  public static final String OBJECT_TYPE_O = "o";
  public static final String EMPTY_EVENTS_MESSAGE =
      "Requested Stage ID {} not in definition. Returning empty events.";

  private final EventBridgeDatabaseConnectors eventBridgeDatabaseConnectors;
  private final SignalDetectionLegacyAccessor signalDetectionLegacyAccessor;
  private final EventIdUtility eventIdUtility;
  private final EventConverter eventConverter;
  private final EventBridgeDefinition eventBridgeDefinition;
  private final EventStages eventStages;

  @Autowired
  public BridgedEventRepository(
      EventBridgeDatabaseConnectors eventBridgeDatabaseConnectors,
      SignalDetectionLegacyAccessor signalDetectionLegacyAccessor,
      EventIdUtility eventIdUtility,
      EventConverter eventConverter,
      EventBridgeDefinition eventBridgeDefinition,
      EventStages eventStages) {

    LOGGER.info(
        "{} loaded EventBridgeDefinition: {}",
        this.getClass().getSimpleName(),
        eventBridgeDefinition);
    this.eventBridgeDefinition = eventBridgeDefinition;
    this.eventIdUtility = eventIdUtility;
    this.eventConverter = eventConverter;
    this.eventBridgeDatabaseConnectors = eventBridgeDatabaseConnectors;
    this.signalDetectionLegacyAccessor = signalDetectionLegacyAccessor;
    this.eventStages = eventStages;
  }

  /** {@inheritDoc} */
  @Override
  public Set<Event> findByTime(Instant startTime, Instant endTime, WorkflowDefinitionId stageId) {
    checkNotNull(startTime, "startTime shall not be null");
    checkNotNull(endTime, "endTime shall not be null");
    checkArgument(
        startTime.isBefore(endTime),
        String.format("startTime [%s] must come before endTime [%s]", startTime, endTime));
    checkNotNull(stageId, "stageId shall not be null");

    if (!eventBridgeDefinition.getOrderedStages().contains(stageId)) {
      LOGGER.warn(EMPTY_EVENTS_MESSAGE, stageId.getName());
      return new HashSet<>();
    }

    var stageName = stageId.getName();
    var timeNow = Instant.now();
    if (startTime.isAfter(timeNow)) {
      LOGGER.warn(
          "findByTime query startTime is in the future.  This may impact expected results."
              + " Current Time [{}] Query startTime [{}]",
          timeNow,
          startTime);
    }

    var eventDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, EVENT_CONNECTOR_TYPE);
    var originDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, ORIGIN_CONNECTOR_TYPE);
    var gaTagDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, GA_TAG_CONNECTOR_TYPE);

    var prevOriginDatabaseConnectorExists =
        eventBridgeDatabaseConnectors.connectorExistsForPreviousStage(
            stageName, ORIGIN_CONNECTOR_TYPE);

    LOGGER.debug("findByTime:Initiating event queries in current stageId: {}.", stageId);

    var currentStageEventIdToEventDaos =
        eventDatabaseConnector.findEventsByTime(startTime, endTime).stream()
            .collect(Collectors.toMap(EventDao::getEventId, Function.identity()));

    Set<Event> currentStageEvents = new HashSet<>();
    if (!currentStageEventIdToEventDaos.keySet().isEmpty()) {
      var eventIdToOriginDaos =
          Multimaps.index(
              originDatabaseConnector.findByEventIds(
                  new ArrayList<>(currentStageEventIdToEventDaos.keySet())),
              OriginDao::getEventId);

      var eventIdToObjectProcessAndGaTagDaos =
          Multimaps.index(
              gaTagDatabaseConnector.findGaTagsByObjectTypesProcessStatesAndEvids(
                  List.of(OBJECT_TYPE_A, OBJECT_TYPE_O),
                  List.of(ANALYST_REJECTED),
                  new ArrayList<>(currentStageEventIdToEventDaos.keySet())),
              GaTagDao::getRejectedArrivalOriginEvid);

      currentStageEvents =
          currentStageEventIdToEventDaos.keySet().stream()
              .map(
                  eventId ->
                      eventConverter.fromLegacyToDefaultFacetedEvent(
                          currentStageEventIdToEventDaos.get(eventId),
                          eventIdToOriginDaos.get(eventId),
                          eventIdToObjectProcessAndGaTagDaos.get(eventId),
                          stageId))
              .collect(toSet());
    }

    LOGGER.debug(
        "findByTime:Current stage query complete stageId: {}.  [{}] Events collected",
        stageId,
        currentStageEvents.size());
    LOGGER.debug("findByTime:Current Stage Events Found(call1) : [{}]", currentStageEvents);

    if (prevOriginDatabaseConnectorExists) {
      currentStageEvents =
          addPreviousStageEvents(
              startTime, endTime, stageId, stageName, gaTagDatabaseConnector, currentStageEvents);
    }
    return currentStageEvents;
  }

  /** {@inheritDoc} */
  @Override
  public Set<Event> findByIds(Collection<UUID> eventIds, WorkflowDefinitionId stageId) {
    checkNotNull(eventIds, "findByIds requires a non-null list of eventIds");
    checkNotNull(stageId, "findByIds requires a non-null stageId");

    if (eventIds.isEmpty()) {
      LOGGER.info("No event ids to search");
      return new HashSet<>();
    }

    if (!eventBridgeDefinition.getOrderedStages().contains(stageId)) {
      LOGGER.warn(EMPTY_EVENTS_MESSAGE, stageId.getName());
      return new HashSet<>();
    }
    LOGGER.debug("findByIds:Initiating event queries in current stageId: {}.", stageId);

    var stageName = stageId.getName();
    var eventDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, EVENT_CONNECTOR_TYPE);
    var originDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, ORIGIN_CONNECTOR_TYPE);
    var gaTagDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, GA_TAG_CONNECTOR_TYPE);

    LOGGER.debug("Processing {} EventIds", eventIds.size());
    var eventSet =
        eventIds.stream()
            .map(
                (UUID eventId) ->
                    getFacetedEventByStageConnector(
                        eventDatabaseConnector,
                        originDatabaseConnector,
                        gaTagDatabaseConnector,
                        eventId,
                        stageId))
            .flatMap(Optional::stream)
            .collect(toSet());
    LOGGER.debug(
        "findByIds:Current stage query complete stageId: {}.  [{}] Events collected",
        stageId,
        eventSet.size());
    LOGGER.debug("findByIds:Current Stage Events Found(call2): [{}]", eventSet);

    if (eventBridgeDatabaseConnectors.connectorExistsForPreviousStage(
            stageName, EVENT_CONNECTOR_TYPE)
        && eventBridgeDatabaseConnectors.connectorExistsForPreviousStage(
            stageName, ORIGIN_CONNECTOR_TYPE)
        && eventStages.getPreviousStage(stageId).isPresent()) {

      var previousStageId =
          eventStages
              .getPreviousStage(stageId)
              .orElseThrow(() -> new IllegalStateException("No previous stage found"));
      LOGGER.debug("findByIds:Initiating event queries in previous stageId: {}.", previousStageId);

      var prevStageEventDatabaseConnector =
          eventBridgeDatabaseConnectors.getConnectorForPreviousStageOrThrow(
              stageName, EVENT_CONNECTOR_TYPE);
      var prevStageOriginDatabaseConnector =
          eventBridgeDatabaseConnectors.getConnectorForPreviousStageOrThrow(
              stageName, ORIGIN_CONNECTOR_TYPE);

      var previousStageEvents =
          eventIds.stream()
              .map(
                  eventId ->
                      getFacetedEventByStageConnector(
                          prevStageEventDatabaseConnector,
                          prevStageOriginDatabaseConnector,
                          gaTagDatabaseConnector,
                          eventId,
                          previousStageId))
              .flatMap(Optional::stream)
              .collect(toSet());
      LOGGER.debug(
          "findByIds:Previous stage query complete stageId: {}.  [{}] Events collected",
          previousStageId,
          previousStageEvents.size());
      LOGGER.debug("findByIdsPrevious Stage Events Found: [{}]", previousStageEvents);

      var eventSetSize = eventSet.size();
      // for each previous event, check if the Event Id already exists in the current
      previousStageEvents.forEach(preEvent -> processPreviousEvent(preEvent, eventSet));

      LOGGER.debug(
          "Number of unique previous stage Events added to Event List: {} New Total: {}",
          eventSet.size() - eventSetSize,
          eventSet.size());
    }

    return eventSet;
  }

  private static void processPreviousEvent(Event previousEvent, Set<Event> currentStageEventSet) {
    var currentEventOpt =
        currentStageEventSet.stream()
            .filter(a -> a.getId().equals(previousEvent.getId()))
            .findFirst();

    // The previous event was already found as an existing Event ID in the current Event Set
    // Therefore make sure the PreferredEventHypotheses are also copied into said found
    currentEventOpt.ifPresentOrElse(
        (Event currentEvent) -> {
          var currentEventDataBuilder = currentEvent.getData().orElseThrow().toBuilder();

          // PreferredEventHypothesis data from the previous one
          currentStageEventSet.remove(currentEvent);
          updateEventData(previousEvent, currentEventDataBuilder);

          currentStageEventSet.add(
              currentEvent.toBuilder().setData(currentEventDataBuilder.build()).build());
        },
        () -> currentStageEventSet.add(previousEvent));
  }

  private static void updateEventData(
      Event previousEvent, Event.Data.Builder currentEventDataBuilder) {
    previousEvent
        .getData()
        .orElseThrow()
        .getPreferredEventHypothesisByStage()
        .forEach(
            (PreferredEventHypothesis peh) -> {
              currentEventDataBuilder.addEventHypothesis(peh.getPreferred());
              currentEventDataBuilder.addPreferredEventHypothesis(peh);
            });
  }

  /** {@inheritDoc} */
  @Override
  public List<EventHypothesis> findHypothesesByIds(
      Collection<EventHypothesis.Id> eventHypothesisIds) {
    LOGGER.debug("findHypothesesByIds input:[{}]", eventHypothesisIds);
    checkNotNull(eventHypothesisIds, "eventHypothesisIds must not be null");
    var output =
        eventHypothesisIds.stream()
            .map(this::retrieveAndCombineIds)
            .flatMap(Optional::stream)
            .map(this::findHypothesis)
            .flatMap(Collection::stream)
            .collect(toList());
    LOGGER.debug("findHypothesesByIds output:[{}]", output);

    return output;
  }

  /** {@inheritDoc} */
  @Override
  public Set<Event> findByAssociatedDetectionHypotheses(
      Collection<SignalDetectionHypothesis> signalDetectionHypotheses,
      WorkflowDefinitionId stageId) {

    var legacyAccountIdToAssocIdComponents =
        Multimaps.index(
            signalDetectionLegacyAccessor.getSignalDetectionHypothesesAssocIdComponents(
                signalDetectionHypotheses),
            SignalDetectionHypothesisAssocIdComponents::getLegacyDatabaseAccountId);

    var legacyAccountIdToEventDatabaseConnectorMap =
        legacyAccountIdToAssocIdComponents.keySet().stream()
            .distinct()
            .collect(
                Collectors.toMap(
                    Function.identity(),
                    legacyDatabaseAccountId ->
                        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                            SignalDetectionLegacyAccessor.legacyDatabaseAccountToStageId(
                                    legacyDatabaseAccountId)
                                .getName(),
                            EVENT_CONNECTOR_TYPE)));

    List<Long> evids = new ArrayList<>();

    legacyAccountIdToEventDatabaseConnectorMap.forEach(
        (String legacyAccountId, EventDatabaseConnector databaseConnector) -> {
          var arids =
              legacyAccountIdToAssocIdComponents.get(legacyAccountId).stream()
                  .map(SignalDetectionHypothesisAssocIdComponents::getArid)
                  .collect(toList());
          evids.addAll(databaseConnector.findEventIdsByArids(arids));
        });

    var eventIds = evids.stream().map(eventIdUtility::getOrCreateEventId).collect(toList());

    return findByIds(eventIds, stageId).stream()
        .map(this::updateEventHypothesesEventObject)
        .flatMap(Optional::stream)
        .collect(Collectors.toSet());
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
    checkNotNull(stageId, "stageId cannot be null");
    var stageName = stageId.getName();

    List<WorkflowDefinitionId> orderedStages = eventBridgeDefinition.getOrderedStages();
    if (!orderedStages.contains(stageId)) {
      LOGGER.warn(EMPTY_EVENTS_MESSAGE, stageName);
      return false;
    }

    List<WorkflowDefinitionId> stagesAfterStageId = getStagesAfterStageId(stageId, orderedStages);

    var databaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, EVENT_CONNECTOR_TYPE);
    var isPreferred = databaseConnector.isPreferred(orid);
    return isPreferred && notPreferredForStages(orid, stagesAfterStageId);
  }

  private boolean notPreferredForStages(long orid, List<WorkflowDefinitionId> stages) {
    var notPreferredForOtherStages = true;

    for (var i = 0; i < stages.size(); i++) {
      var connector =
          eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
              stages.get(i).getName(), EVENT_CONNECTOR_TYPE);
      if (connector.isPreferred(orid)) {
        notPreferredForOtherStages = false;
      }
    }
    return notPreferredForOtherStages;
  }

  private List<WorkflowDefinitionId> getStagesAfterStageId(
      WorkflowDefinitionId stageId, List<WorkflowDefinitionId> orderedStages) {
    List<WorkflowDefinitionId> stagesAfterStageId = new ArrayList<>();
    var afterStageId = false;
    for (var i = 0; i < orderedStages.size(); i++) {
      if (afterStageId) {
        stagesAfterStageId.add(orderedStages.get(i));
      }
      if (orderedStages.get(i).equals(stageId)) {
        afterStageId = true;
      }
    }
    return stagesAfterStageId;
  }

  /**
   * Takes the input Event setting the EventHypotheses appropriately as required by
   * findByAssociatedDetectionHypotheses
   *
   * @param event An {@link Event} to be updated
   * @return Updated {@link Event} with properly populated EventHypotheses
   */
  private Optional<Event> updateEventHypothesesEventObject(Event event) {

    try {
      var eventData =
          event
              .getData()
              .orElseThrow(() -> new IllegalStateException("No event data when required"));
      var ehIds =
          eventData.getEventHypotheses().stream()
              .map(EventHypothesis::getId)
              .collect(Collectors.toSet());
      var eventHypotheses = findHypothesesByIds(ehIds);
      var builtEvent =
          event.toBuilder()
              .setData(eventData.toBuilder().setEventHypotheses(eventHypotheses).build())
              .build();

      return Optional.of(builtEvent);
    } catch (IllegalStateException ex) {
      LOGGER.warn("Unable to construct Event. Excluding Event {}", event.getId(), ex);
      return Optional.empty();
    }
  }

  /**
   * Add previous stage {@link Event}s to the current stage set of {@link Event}s
   *
   * @param startTime query start time
   * @param endTime query end time
   * @param stageId current stage {@link WorkflowDefinitionId}
   * @param stageName current stage name string
   * @param gaTagDatabaseConnector {@link GaTagDatabaseConnector}
   * @param currentStageEvents set of current stage {@link Event}s
   * @return set of previous and current stage {@link Event}s
   */
  private Set<Event> addPreviousStageEvents(
      Instant startTime,
      Instant endTime,
      WorkflowDefinitionId stageId,
      String stageName,
      GaTagDatabaseConnector gaTagDatabaseConnector,
      Set<Event> currentStageEvents) {

    var prevOriginDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForPreviousStageOrThrow(
            stageName, ORIGIN_CONNECTOR_TYPE);
    var previousStageId =
        eventStages
            .getPreviousStage(stageId)
            .orElseThrow(() -> new IllegalStateException("No previous stage found"));

    LOGGER.debug("Initiating event queries in previous stageId: {}.", previousStageId);

    var evids =
        currentStageEvents.stream()
            .map(event -> eventIdUtility.getEvid(event.getId()))
            .flatMap(Optional::stream)
            .distinct()
            .collect(toList());

    if (!evids.isEmpty()) {
      var originDaoList = prevOriginDatabaseConnector.findByEventIds(evids);
      currentStageEvents =
          currentStageEvents.stream()
              .map(
                  (Event event) ->
                      populateEventWithEventHypotheses(previousStageId, event, originDaoList))
              .collect(toSet());
    }

    var oridsForCurrentStageEvents =
        currentStageEvents.stream()
            .map(Event::getData)
            .flatMap(Optional::stream)
            .map(Event.Data::getEventHypotheses)
            .flatMap(Collection::stream)
            .map(EventHypothesis::getId)
            .map(id -> eventIdUtility.getOriginUniqueIdentifier(id.getHypothesisId()))
            .flatMap(Optional::stream)
            .map(OriginUniqueIdentifier::getOrid)
            .collect(toSet());

    var previousStageOriginDaos =
        prevOriginDatabaseConnector.findByTime(startTime, endTime).stream()
            .filter(originDao -> !oridsForCurrentStageEvents.contains(originDao.getOriginId()))
            .collect(toSet());

    var previousStageEventConnector =
        this.eventBridgeDatabaseConnectors.getConnectorForPreviousStageOrThrow(
            stageName, EVENT_CONNECTOR_TYPE);

    buildPreviousStageEvents(
        previousStageId,
        currentStageEvents,
        previousStageEventConnector,
        gaTagDatabaseConnector,
        previousStageOriginDaos);

    return currentStageEvents;
  }

  private Event populateEventWithEventHypotheses(
      WorkflowDefinitionId previousStageId, Event event, List<OriginDao> originDaoList) {
    var eventId = eventIdUtility.getEvid(event.getId());
    var eventHypotheses =
        originDaoList.stream()
            .filter(originDao -> originDao.getEventId() == eventId.orElseThrow())
            .map(
                (OriginDao originDao) -> {
                  var originUniqueId =
                      OriginUniqueIdentifier.create(
                          originDao.getOriginId(), previousStageId.getName());
                  var eventHypothesisUUID =
                      eventIdUtility.getOrCreateEventHypothesisId(originUniqueId);
                  return EventHypothesis.createEntityReference(
                      EventHypothesis.Id.from(event.getId(), eventHypothesisUUID));
                })
            .collect(Collectors.toList());

    var updatedData =
        event
            .getData()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "Event [" + event.getId() + "] does not contain Data"))
            .toBuilder()
            .addAllEventHypotheses(eventHypotheses)
            .build();
    return event.toBuilder().setData(updatedData).build();
  }

  /**
   * Build previous stage events if appropriate connectors and event ids exists
   *
   * @param previousStageId {@link WorkflowDefinitionId}
   * @param currentStageEvents current set of {@link Event}s to update
   * @param prevEventDatabaseConnector previous stage {@link EventDatabaseConnector}
   * @param gaTagDatabaseConnector {@link GaTagDatabaseConnector}
   * @param previousStageOriginDaos list of previous stage {@link OriginDao}
   */
  private void buildPreviousStageEvents(
      WorkflowDefinitionId previousStageId,
      Collection<Event> currentStageEvents,
      EventDatabaseConnector prevEventDatabaseConnector,
      GaTagDatabaseConnector gaTagDatabaseConnector,
      Collection<OriginDao> previousStageOriginDaos) {

    if (!previousStageOriginDaos.isEmpty()) {
      var previousStageEventDaos =
          previousStageOriginDaos.stream()
              .map(OriginDao::getEventId)
              .distinct()
              .map(prevEventDatabaseConnector::findEventById)
              .flatMap(Optional::stream)
              .collect(toSet());
      var previousStageEvids =
          previousStageEventDaos.stream().map(EventDao::getEventId).collect(toSet());
      var gaTagDaos =
          gaTagDatabaseConnector.findGaTagsByObjectTypesProcessStatesAndEvids(
              List.of(OBJECT_TYPE_A, OBJECT_TYPE_O), List.of(ANALYST_REJECTED), previousStageEvids);

      var previousStageEvents =
          previousStageEventDaos.stream()
              .map(
                  eventDao ->
                      eventConverter.fromLegacyToDefaultFacetedEvent(
                          eventDao,
                          previousStageOriginDaos.stream()
                              .filter(originDao -> originDao.getEventId() == eventDao.getEventId())
                              .collect(toSet()),
                          gaTagDaos.stream()
                              .filter(
                                  gaTagDao ->
                                      gaTagDao.getRejectedArrivalOriginEvid()
                                          == eventDao.getEventId())
                              .collect(toSet()),
                          previousStageId))
              .collect(toSet());

      LOGGER.debug(
          "Previous stage query complete stageId: {}. [{}] Events collected",
          previousStageId,
          previousStageEvents.size());

      currentStageEvents.addAll(previousStageEvents);

      LOGGER.debug(
          "Number of unique previous stage Events added to Event List: {} New Total: {}",
          previousStageEvents.size(),
          currentStageEvents.size());
    }
  }

  private Optional<OriginIdentifiers> retrieveAndCombineIds(EventHypothesis.Id eventHypothesisId) {
    var evidOpt = eventIdUtility.getEvid(eventHypothesisId.getEventId());
    var originUniqueIdentifierOpt =
        eventIdUtility.getOriginUniqueIdentifier(eventHypothesisId.getHypothesisId());

    if (evidOpt.isEmpty()) {
      LOGGER.debug("No evid mapping exists for Event id [{}]", eventHypothesisId.getEventId());
    }

    if (originUniqueIdentifierOpt.isEmpty()) {
      LOGGER.debug(
          "No origin unique identifier mapping exists for Event Hypothesis id [{}]",
          eventHypothesisId.getHypothesisId());
    }

    return evidOpt.flatMap(
        evid ->
            originUniqueIdentifierOpt.map(
                originUniqueId ->
                    OriginIdentifiers.from(
                        originUniqueId.getStage(), evid, originUniqueId.getOrid())));
  }

  private Collection<EventHypothesis> findHypothesis(OriginIdentifiers originIdentifiers) {

    var stageId = originIdentifiers.getStageId();
    var evid = originIdentifiers.getEventId();
    var orid = originIdentifiers.getOrid();

    var ehInfo = assembleBridgedEhInformation(stageId, evid, orid);
    var sdhInfo = assembleBridgedSdhInformation(stageId, orid);

    return ehInfo
        .map(
            (BridgedEhInformation info) -> {
              try {
                return eventConverter.fromLegacyToDefaultFacetedEventHypothesis(
                    stageId, info, sdhInfo);
              } catch (NullPointerException | IllegalArgumentException | IllegalStateException e) {
                LOGGER.error("Error bridging event hypothesis for id {}", originIdentifiers, e);
                return Collections.<EventHypothesis>emptyList();
              }
            })
        .orElseGet(Collections::emptyList);
  }

  private Optional<BridgedEhInformation> assembleBridgedEhInformation(
      WorkflowDefinitionId stageId, long evid, long orid) {

    var stageName = stageId.getName();
    var originConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, ORIGIN_CONNECTOR_TYPE);
    var originErrConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, ORIGERR_CONNECTOR_TYPE);
    var eventControlConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, EVENT_CONTROL_CONNECTOR_TYPE);
    var gaTagConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, GA_TAG_CONNECTOR_TYPE);

    var originDao = originConnector.findById(orid);
    var originErrDao = originErrConnector.findById(orid);
    var eventControlDao = eventControlConnector.findByEventIdOriginId(evid, orid);
    var gaTagDao =
        gaTagConnector
            .findGaTagByObjectTypeProcessStateAndEvid(OBJECT_TYPE_O, ANALYST_REJECTED, evid)
            .stream()
            .findFirst();

    // Note that according to architecture (for now) the NETMAG.MAGTYPE field in the DB should be
    // ignored
    // and the NetMag records referenced by the ORIGIN.MBID / .MLID / .MSID = NETMAG.MAGID should be
    // labeled
    // using the corresponding labels MB, ML, and MS.  Hence, the map of MagnitudeType to NetMagDao.
    Map<MagnitudeType, NetMagDao> netMagDaosByType =
        originDao
            .map(
                od ->
                    eventBridgeDatabaseConnectors
                        .getConnectorForCurrentStageOrThrow(stageName, NETMAG_CONNECTOR_TYPE)
                        .findNetMagByOriginDao(originDao.get()))
            .orElse(Collections.emptyMap());

    // Could come back empty and cause a database error if the evid does not exist in the previous
    // stage
    Set<EventHypothesis.Id> parentEventHypotheses =
        getParentHypotheses(stageId, evid).stream().collect(toSet());

    return originDao.flatMap(
        origin ->
            originErrDao.map(
                originErr ->
                    creatBridgedEhInformation(
                        origin,
                        originErr,
                        netMagDaosByType,
                        parentEventHypotheses,
                        gaTagDao,
                        eventControlDao)));
  }

  private BridgedEhInformation creatBridgedEhInformation(
      OriginDao origin,
      OrigerrDao originErr,
      Map<MagnitudeType, NetMagDao> netMagDaosByType,
      Set<EventHypothesis.Id> parentEventHypotheses,
      Optional<GaTagDao> gaTagDao,
      Optional<EventControlDao> eventControlDao) {

    var ehInfoBuilder =
        BridgedEhInformation.builder()
            .setEventStages(this.eventStages)
            .setOriginDao(origin)
            .setOrigerrDao(originErr)
            .setNetMagDaosByType(netMagDaosByType)
            .setParentEventHypotheses(parentEventHypotheses);
    gaTagDao.ifPresent(ehInfoBuilder::setGaTagDao);
    eventControlDao.ifPresent(ehInfoBuilder::setEventControlDao);
    return ehInfoBuilder.build();
  }

  private Set<BridgedSdhInformation> assembleBridgedSdhInformation(
      WorkflowDefinitionId stageId, long orid) {
    var stageName = stageId.getName();
    LOGGER.debug("Assembling BridgedSdhInformation for stageId[{}] and orid[{}]", stageName, orid);
    var assocConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, ASSOC_CONNECTOR_TYPE);
    var assocs = assocConnector.findAssocsByOrids(List.of(orid));

    var arInfoDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, AR_INFO_CONNECTOR_TYPE);
    var staMagDatabaseConnector =
        eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageName, STAMAG_CONNECTOR_TYPE);

    var mapOfArInfos = arInfoDatabaseConnector.findArInfosByAssocs(assocs);
    var mapOfStaMagDaos =
        Multimaps.index(
            staMagDatabaseConnector.findStaMagDaosByAssocs(assocs),
            StaMagDatabaseConnector::staMagDaoKeyTransformer);

    var assocDaoPairMap =
        assocs.stream()
            .map(AssocDao::assocDaoToAridOridKeyTransformer)
            .collect(
                Collectors.toMap(
                    assocKey -> assocKey,
                    assocKey ->
                        Pair.of(
                            Optional.ofNullable(mapOfArInfos.get(assocKey)),
                            Optional.of(mapOfStaMagDaos.get(assocKey)))));

    var bridgedSdhInformationSet = new HashSet<BridgedSdhInformation>();

    if (assocs.isEmpty()) {
      LOGGER.warn("No ASSOCs returned for stageId[{}] and orid[{}]", stageName, orid);

    } else {
      assocs.forEach(
          assoc ->
              bridgedSdhInformationSet.add(createBridgedSdhInfo(stageId, assoc, assocDaoPairMap)));
    }

    return bridgedSdhInformationSet;
  }

  private BridgedSdhInformation createBridgedSdhInfo(
      WorkflowDefinitionId stageId,
      AssocDao assoc,
      Map<AridOridKey, Pair<Optional<ArInfoDao>, Optional<ImmutableList<StaMagDao>>>>
          assocDaoPairMap) {
    var bridgedSdhInfoBuilder = BridgedSdhInformation.builder();
    signalDetectionLegacyAccessor
        .findHypothesisByStageIdAridAndOrid(
            stageId, assoc.getId().getArrivalId(), assoc.getId().getOriginId())
        .ifPresent(bridgedSdhInfoBuilder::setSignalDetectionHypothesis);

    var assocDaoPair = assocDaoPairMap.get(AssocDao.assocDaoToAridOridKeyTransformer(assoc));

    bridgedSdhInfoBuilder.setAssocDao(assoc).setArInfoDao(assocDaoPair.getLeft().orElse(null));
    assocDaoPair.getRight().ifPresent(bridgedSdhInfoBuilder::setStaMagDaos);
    return bridgedSdhInfoBuilder.build();
  }

  /**
   * Takes and origin record from the current stage and determines if there are any associated
   * parent EventHypotheses
   *
   * @param currentStageId The currentStageId
   * @param evid evid of interest
   * @return parentEventHypotheses as a list of {@link Optional} faceted {@link EventHypothesis.Id}
   */
  Optional<EventHypothesis.Id> getParentHypotheses(WorkflowDefinitionId currentStageId, long evid) {
    checkNotNull(currentStageId);

    if (eventStages.getPreviousStage(currentStageId).isEmpty()) {
      LOGGER.debug("No Previous Stage found for current stage [{}]", currentStageId);
      return Optional.empty();
    }

    var currentStageName = currentStageId.getName();
    var eventConnector =
        eventBridgeDatabaseConnectors.connectorExistsForPreviousStage(
                currentStageName, EVENT_CONNECTOR_TYPE)
            ? eventBridgeDatabaseConnectors.getConnectorForPreviousStageOrThrow(
                currentStageName, EVENT_CONNECTOR_TYPE)
            : eventBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                currentStageName, EVENT_CONNECTOR_TYPE);

    var event = eventConnector.findEventById(evid);
    var eventId = this.eventIdUtility.getOrCreateEventId(evid);
    return event
        .map(
            eventDao ->
                eventIdUtility.getOrCreateEventHypothesisId(
                    eventDao.getPreferredOrigin(), currentStageId.getName()))
        .map(hypothesisId -> EventHypothesis.Id.from(eventId, hypothesisId));
  }

  private Optional<Event> getFacetedEventByStageConnector(
      EventDatabaseConnector localEventDatabaseConnector,
      OriginDatabaseConnector localOriginDatabaseConnector,
      GaTagDatabaseConnector gaTagDatabaseConnector,
      UUID eventId,
      WorkflowDefinitionId stageId) {
    return eventIdUtility
        .getEvid(eventId)
        .flatMap(
            evid ->
                localEventDatabaseConnector
                    .findEventById(evid)
                    .map(
                        (EventDao eventDao) -> {
                          var originDaos =
                              localOriginDatabaseConnector.findByEventIds(
                                  List.of(eventDao.getEventId()));

                          var gaTagDaos =
                              gaTagDatabaseConnector.findGaTagByObjectTypeProcessStateAndEvid(
                                  OBJECT_TYPE_O, ANALYST_REJECTED, eventDao.getEventId());

                          return eventConverter.fromLegacyToDefaultFacetedEvent(
                              eventDao, originDaos, gaTagDaos, stageId);
                        }));
  }

  @AutoValue
  protected abstract static class OriginIdentifiers {

    public abstract String getStage();

    @Memoized
    public WorkflowDefinitionId getStageId() {
      return WorkflowDefinitionId.from(getStage());
    }

    public abstract long getEventId();

    public abstract long getOrid();

    public static OriginIdentifiers from(String stage, long evid, long orid) {
      return new AutoValue_BridgedEventRepository_OriginIdentifiers(stage, evid, orid);
    }
  }
}
