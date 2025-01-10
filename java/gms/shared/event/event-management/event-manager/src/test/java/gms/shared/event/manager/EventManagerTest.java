package gms.shared.event.manager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.common.collect.ImmutableMap;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.api.EventAccessor;
import gms.shared.event.api.EventStatusInfoByStageIdAndEventIdsResponse;
import gms.shared.event.api.EventStatusUpdateRequest;
import gms.shared.event.api.FeaturePredictionsByReceiverName;
import gms.shared.event.api.PredictFeaturesForEventLocationRequest;
import gms.shared.event.api.PredictFeaturesForLocationSolutionRequest;
import gms.shared.event.api.ReceiverLocationsAndTypes;
import gms.shared.event.coi.EventStatus;
import gms.shared.event.coi.EventStatusInfo;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.featureprediction.ElevationCorrectionDefinition;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.ArrivalTimeFeaturePredictionValue;
import gms.shared.event.manager.config.EventConfigurationResolver;
import gms.shared.featureprediction.request.PredictForLocationRequest;
import gms.shared.featureprediction.request.PredictForLocationSolutionAndChannelRequest;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.system.events.SystemEvent;
import gms.shared.system.events.SystemEventPublisher;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class EventManagerTest {

  private static EventManager eventManager;

  @Mock private EventAccessor eventAccessor;

  @Mock private SystemEventPublisher systemEventPublisher;

  @Mock private WebRequests webRequests;

  @BeforeEach()
  void setUp() {
    var eventManagerConfiguration =
        new EventConfigurationResolver(
            new EventManagerTestBeanConfiguration().configurationConsumerUtility());
    eventManager =
        new EventManager(
            eventManagerConfiguration, eventAccessor, systemEventPublisher, webRequests);
  }

  @Test
  void testPredictFeaturesForLocationSolution() throws FeaturePredictionException {
    // Tests that the feature prediction service was called correctly using the provided
    // PredictFeaturesForLocationSolutionRequest
    // to resolve the correct PredictionsForLocationsolutionDefinition

    // Create request body for eventManager.predictFeaturesForLocationSolution
    var eventLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var locationSolution = createTestLocationSolution(eventLocation);

    var stationName = "stationOne";
    var channelName = stationName + ".channelOne";
    var channelLocation = Location.from(0.0, 0.0, 0.0, 0.0);
    var channel = createTestChannel(channelName, channelLocation);
    var channels = List.of(channel);

    var phaseTypes = List.of(PhaseType.P, PhaseType.S, PhaseType.PKP);

    var predictFeaturesForLocationSolutionRequestBody =
        PredictFeaturesForLocationSolutionRequest.from(locationSolution, channels, phaseTypes);

    // Not testing the contents of what we get back from FeaturePredictionService
    // Just return original LocationSolution
    when(webRequests.fpsWebRequestPredictForLocationSolutionAndChannel(ArgumentMatchers.any()))
        .thenReturn(Pair.of(Optional.of(locationSolution), false));

    // Execute request and assert 200
    var responseEntity =
        eventManager.predictFeaturesForLocationSolution(
            predictFeaturesForLocationSolutionRequestBody);
    assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

    // Verify eventManager.predictFeaturesForLocationSolution returns the correct LocationSolution
    var returnedLocationSolution = (LocationSolution) responseEntity.getBody();
    assertEquals(locationSolution, returnedLocationSolution);

    // Verify FeaturePredictionService was called twice with expected arguments
    verify(webRequests, times(2)).fpsWebRequestPredictForLocationSolutionAndChannel(any());
    verify(webRequests)
        .fpsWebRequestPredictForLocationSolutionAndChannel(
            PredictForLocationSolutionAndChannelRequest.from(
                List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
                locationSolution,
                channels,
                List.of(PhaseType.S, PhaseType.PKP),
                "Iaspei",
                List.of()));
    verify(webRequests)
        .fpsWebRequestPredictForLocationSolutionAndChannel(
            PredictForLocationSolutionAndChannelRequest.from(
                List.of(FeaturePredictionType.SLOWNESS_PREDICTION_TYPE),
                locationSolution,
                channels,
                List.of(PhaseType.P),
                "Iaspei",
                List.of()));
  }

  @Test
  void testPredictFeaturesForEventLocationIncorrectInput() throws FeaturePredictionException {
    var eventLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var receiverMap = new HashMap<String, Location>();
    receiverMap.put("TestLocation", Location.from(100.0, 50.0, 50.0, 100.0));
    var receiverMap2 = new HashMap<String, Location>();
    receiverMap2.put("TestLocation", Location.from(50, 50.0, 50.0, 100.0));
    var ReceiverLocationsAndTypesRequest =
        ReceiverLocationsAndTypes.from(
            Optional.of(ChannelDataType.SEISMIC),
            Optional.of(ChannelBandType.EXTREMELY_LONG_PERIOD),
            receiverMap);
    var ReceiverLocationsAndTypesRequest2 =
        ReceiverLocationsAndTypes.from(
            Optional.of(ChannelDataType.SEISMIC),
            Optional.of(ChannelBandType.EXTREMELY_LONG_PERIOD),
            receiverMap2);

    FeaturePrediction<ArrivalTimeFeaturePredictionValue> fp1a =
        FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
            .setPredictionValue(
                ArrivalTimeFeaturePredictionValue.from(
                    FeatureMeasurementTypes.ARRIVAL_TIME,
                    ArrivalTimeMeasurementValue.from(
                        InstantValue.from(Instant.ofEpochSecond(1), Duration.ofHours(1)),
                        Optional.of(DurationValue.from(Duration.ofDays(1), Duration.ZERO))),
                    Map.of(),
                    Set.of()))
            .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .setPhase(PhaseType.P)
            .setExtrapolated(false)
            .setSourceLocation(eventLocation)
            .setReceiverLocation(Location.from(100.0, 50.0, 50.0, 100.0))
            .noChannel()
            .noPredictionChannelSegment()
            .build();

    var request =
        PredictFeaturesForEventLocationRequest.from(
            eventLocation,
            List.of(PhaseType.P),
            List.of(ReceiverLocationsAndTypesRequest, ReceiverLocationsAndTypesRequest2));
    var responseEntity = eventManager.predictFeaturesForEventLocation(request);
    assertEquals(HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());
  }

  @Test
  void testPredictFeaturesForEventLocation() throws FeaturePredictionException {
    var eventLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var receiverMap = new HashMap<String, Location>();
    var phases = List.of(PhaseType.P);
    var earthModel = "Ak135";
    receiverMap.put("TestLocation", Location.from(45, 0.0, 0.0, 0.0));
    receiverMap.put("TestLocation2", Location.from(45.0, 90.0, 0.0, 0.0));
    var receiverLocationsAndTypes =
        ReceiverLocationsAndTypes.from(Optional.empty(), Optional.empty(), receiverMap);

    var predictForLocationRequest =
        PredictForLocationRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            eventLocation,
            new ArrayList<>(receiverMap.values()),
            phases,
            earthModel,
            List.of(ElevationCorrectionDefinition.from("Ak135")));

    var sampleResponse =
        buildArrivalTimeFeaturePredictionContainer(eventLocation, receiverMap.values());
    when(webRequests.fpsWebRequestPredictForLocation(predictForLocationRequest))
        .thenReturn(Pair.of(Optional.of(sampleResponse), false));

    var request =
        PredictFeaturesForEventLocationRequest.from(
            eventLocation, phases, List.of(receiverLocationsAndTypes));
    var responseEntity = eventManager.predictFeaturesForEventLocation(request);
    assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

    var featurePredictionsByReceiverName =
        FeaturePredictionsByReceiverName.from(
            Map.of(
                "TestLocation",
                    buildArrivalTimeFeaturePredictionContainer(
                        eventLocation, List.of(receiverMap.get("TestLocation"))),
                "TestLocation2",
                    buildArrivalTimeFeaturePredictionContainer(
                        eventLocation, List.of(receiverMap.get("TestLocation2")))));

    var responseFeaturePredictionsByReceiverName =
        Objects.requireNonNull((FeaturePredictionsByReceiverName) responseEntity.getBody());
    assertEquals(
        featurePredictionsByReceiverName.getReceiverLocationsByName().keySet(),
        responseFeaturePredictionsByReceiverName.getReceiverLocationsByName().keySet());
    assertEquals(
        featurePredictionsByReceiverName
            .getReceiverLocationsByName()
            .get("TestLocation")
            .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .size(),
        responseFeaturePredictionsByReceiverName
            .getReceiverLocationsByName()
            .get("TestLocation")
            .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .size());
  }

  @Test
  void testPredictFeaturesForEventLocationPartialResult() throws FeaturePredictionException {
    var eventLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var receiverMap = new HashMap<String, Location>();
    var phases = List.of(PhaseType.P);
    var earthModel = "Ak135";
    receiverMap.put("TestLocation", Location.from(45, 0.0, 0.0, 0.0));
    receiverMap.put("TestLocation2", Location.from(45.0, 90.0, 0.0, 0.0));
    var receiverLocationsAndTypes =
        ReceiverLocationsAndTypes.from(Optional.empty(), Optional.empty(), receiverMap);

    var predictForLocationRequest =
        PredictForLocationRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            eventLocation,
            new ArrayList<>(receiverMap.values()),
            phases,
            earthModel,
            List.of(ElevationCorrectionDefinition.from("Ak135")));

    var sampleResponse =
        buildArrivalTimeFeaturePredictionContainer(eventLocation, receiverMap.values());
    when(webRequests.fpsWebRequestPredictForLocation(predictForLocationRequest))
        .thenReturn(Pair.of(Optional.of(sampleResponse), true));

    var request =
        PredictFeaturesForEventLocationRequest.from(
            eventLocation, phases, List.of(receiverLocationsAndTypes));
    var responseEntity = eventManager.predictFeaturesForEventLocation(request);
    assertEquals(209, responseEntity.getStatusCode().value());

    var featurePredictionsByReceiverName =
        FeaturePredictionsByReceiverName.from(
            Map.of(
                "TestLocation",
                    buildArrivalTimeFeaturePredictionContainer(
                        eventLocation, List.of(receiverMap.get("TestLocation"))),
                "TestLocation2",
                    buildArrivalTimeFeaturePredictionContainer(
                        eventLocation, List.of(receiverMap.get("TestLocation2")))));

    var responseFeaturePredictionsByReceiverName =
        Objects.requireNonNull((FeaturePredictionsByReceiverName) responseEntity.getBody());
    assertEquals(
        featurePredictionsByReceiverName.getReceiverLocationsByName().keySet(),
        responseFeaturePredictionsByReceiverName.getReceiverLocationsByName().keySet());
    assertEquals(
        featurePredictionsByReceiverName
            .getReceiverLocationsByName()
            .get("TestLocation")
            .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .size(),
        responseFeaturePredictionsByReceiverName
            .getReceiverLocationsByName()
            .get("TestLocation")
            .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .size());
  }

  @Test
  void testPredictFeaturesForLocationSolutionFeaturePredictionException()
      throws FeaturePredictionException {
    // Tests that EventManager handles a FeaturePredictionException correctly when calling
    // FeaturePredictorService

    // Create request body for eventManager.predictFeaturesForLocationSolution
    var eventLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var locationSolution = createTestLocationSolution(eventLocation);

    var channelName = "channelOne";
    var channelLocation = Location.from(0.0, 0.0, 0.0, 0.0);
    var channel = createTestChannel(channelName, channelLocation);
    var channels = List.of(channel);

    var phaseTypes = List.of(PhaseType.P);

    var predictFeaturesForLocationSolutionRequestBody =
        PredictFeaturesForLocationSolutionRequest.from(locationSolution, channels, phaseTypes);

    // Mock that FeaturePredictorService returns malformed JSON
    when(webRequests.fpsWebRequestPredictForLocationSolutionAndChannel(ArgumentMatchers.any()))
        .thenThrow(
            new FeaturePredictionException(
                "Unable to convert to LocationSolution [this isn't json]"));

    // Assert that EventManager handles the bad response from FeaturePredictorService and returns a
    // 400
    var responseEntity =
        eventManager.predictFeaturesForLocationSolution(
            predictFeaturesForLocationSolutionRequestBody);
    assertEquals(HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());
  }

  // Creates a test LocationSolution with a random UUID at the provided EventLocation
  // Contains no FeaturePredictions or LocationBehaviors
  private LocationSolution createTestLocationSolution(EventLocation eventLocation) {
    return LocationSolution.builder()
        .setId(UUID.fromString("10000000-100-0000-1000-100000000012"))
        .setData(
            Objects.requireNonNull(EventTestFixtures.LOCATION_SOLUTION_DATA).toBuilder()
                .setFeaturePredictions(FeaturePredictionContainer.of())
                .setLocationBehaviors(List.of())
                .setLocation(eventLocation)
                .build())
        .build();
  }

  // Creates a test Channel with the provided channelName at the provided Location
  private Channel createTestChannel(String channelName, Location channelLocation) {
    return UtilsTestFixtures.CHANNEL.toBuilder()
        .setName(channelName)
        .setData(
            UtilsTestFixtures.CHANNEL.getData().orElseThrow().toBuilder()
                .setLocation(channelLocation)
                .build())
        .build();
  }

  private static Stream<Arguments> testUpdateEventStatus() {

    // incoming test data
    final var stageId = WorkflowDefinitionId.from("test");
    final var eventId = UUID.fromString("10000000-100-0000-1000-100000000013");

    final var incomingEventStatusUpdateRequest_InProgress =
        EventStatusUpdateRequest.from(
            stageId,
            eventId,
            EventStatusInfo.from(EventStatus.IN_PROGRESS, List.of("incomingAnalyst")));

    final var incomingEventStatusUpdateRequest_NotComplete =
        EventStatusUpdateRequest.from(
            stageId,
            eventId,
            EventStatusInfo.from(EventStatus.NOT_COMPLETE, List.of("incomingAnalyst")));
    final var incomingEventStatusUpdateRequest_NotComplete_SameAnalyst =
        EventStatusUpdateRequest.from(
            stageId,
            eventId,
            EventStatusInfo.from(EventStatus.NOT_COMPLETE, List.of("existingAnalyst")));

    final var incomingEventStatusUpdateRequest_Complete =
        EventStatusUpdateRequest.from(
            stageId,
            eventId,
            EventStatusInfo.from(EventStatus.COMPLETE, List.of("existingAnalyst")));

    final var incomingEventStatusUpdateRequest_NotStarted =
        EventStatusUpdateRequest.from(
            stageId,
            eventId,
            EventStatusInfo.from(EventStatus.NOT_STARTED, List.of("existingAnalyst")));

    // existing cache data
    final var existingEventStatusInfo_InProgress =
        EventStatusInfo.from(EventStatus.IN_PROGRESS, List.of("existingAnalyst"));
    final var existingEventStatusInfo_Complete =
        EventStatusInfo.from(EventStatus.COMPLETE, List.of("existingAnalyst"));
    final var existingEventStatusInfo_NotStarted =
        EventStatusInfo.from(EventStatus.NOT_STARTED, Collections.emptyList());
    final var existingEventStatusInfo_NotComplete =
        EventStatusInfo.from(EventStatus.NOT_COMPLETE, Collections.emptyList());

    final var cacheHit_InProgress =
        EventStatusInfoByStageIdAndEventIdsResponse.builder()
            .setStageId(stageId)
            .setEventStatusInfoMap(ImmutableMap.of(eventId, existingEventStatusInfo_InProgress))
            .build();
    final var cacheHit_Complete =
        EventStatusInfoByStageIdAndEventIdsResponse.builder()
            .setStageId(stageId)
            .setEventStatusInfoMap(ImmutableMap.of(eventId, existingEventStatusInfo_Complete))
            .build();

    final var cacheHit_NotStarted =
        EventStatusInfoByStageIdAndEventIdsResponse.builder()
            .setStageId(stageId)
            .setEventStatusInfoMap(ImmutableMap.of(eventId, existingEventStatusInfo_NotStarted))
            .build();

    final var cacheHit_NotComplete =
        EventStatusInfoByStageIdAndEventIdsResponse.builder()
            .setStageId(stageId)
            .setEventStatusInfoMap(ImmutableMap.of(eventId, existingEventStatusInfo_NotComplete))
            .build();

    // processing data
    final var finalEventStatusInfo_InProgress =
        EventStatusInfo.from(
            EventStatus.IN_PROGRESS, List.of("incomingAnalyst", "existingAnalyst"));

    final var finalEventStatusInfo_NotComplete =
        EventStatusInfo.from(EventStatus.IN_PROGRESS, List.of("existingAnalyst"));
    final var finalEventStatusInfo_NotComplete_Empty =
        EventStatusInfo.from(EventStatus.NOT_COMPLETE, Collections.emptyList());

    final var finalEventStatusInfo_Complete =
        EventStatusInfo.from(EventStatus.COMPLETE, Collections.emptyList());

    // expected returns
    final var responseStatus_OK = HttpStatus.OK;

    final var responseBody_OK_InProgress =
        EventStatusUpdateRequest.from(stageId, eventId, finalEventStatusInfo_InProgress);

    final var responseBody_OK_NotComplete =
        EventStatusUpdateRequest.from(stageId, eventId, finalEventStatusInfo_NotComplete);
    final var responseBody_OK_NotComplete_Empty =
        EventStatusUpdateRequest.from(stageId, eventId, finalEventStatusInfo_NotComplete_Empty);

    final var responseBody_OK_Complete =
        EventStatusUpdateRequest.from(stageId, eventId, finalEventStatusInfo_Complete);

    final var responseBody_OK_cacheNotStarted =
        EventStatusUpdateRequest.from(stageId, eventId, existingEventStatusInfo_NotStarted);

    final var responseStatus_MethodNotAllowedError = HttpStatus.METHOD_NOT_ALLOWED;
    final var responseBody_StatusChangeToCompleteError =
        Map.of("errorMessage", EventManager.STATUS_CHANGE_TO_COMPLETE_STATUS_ERROR);
    final var responseBody_GenericStatusChangeError =
        Map.of(
            "errorMessage",
            String.format(
                EventManager.STATUS_CHANGE_ERROR,
                EventStatus.IN_PROGRESS,
                EventStatus.NOT_STARTED));

    return Stream.of( // incomingEventStatus == IN_PROGRESS
        arguments(
            incomingEventStatusUpdateRequest_InProgress,
            cacheHit_InProgress,
            finalEventStatusInfo_InProgress,
            false,
            responseStatus_OK,
            responseBody_OK_InProgress),
        // incomingEventStatus == NOT_COMPLETE
        // existingStatus = COMPLETE
        // analystList is empty after removal
        arguments(
            incomingEventStatusUpdateRequest_NotComplete_SameAnalyst,
            cacheHit_Complete,
            finalEventStatusInfo_NotComplete_Empty,
            false,
            responseStatus_OK,
            responseBody_OK_NotComplete_Empty),
        // incomingEventStatus == NOT_COMPLETE
        // existingStatus = NOT_STARTED
        // analystList is empty after removal
        arguments(
            incomingEventStatusUpdateRequest_NotComplete_SameAnalyst,
            cacheHit_NotStarted,
            finalEventStatusInfo_NotComplete_Empty,
            false,
            responseStatus_OK,
            responseBody_OK_NotComplete_Empty),
        // incomingEventStatus == NOT_COMPLETE
        // existingStatus = NOT_COMPLETE
        // analystList is empty after removal
        arguments(
            incomingEventStatusUpdateRequest_NotComplete_SameAnalyst,
            cacheHit_NotComplete,
            finalEventStatusInfo_NotComplete_Empty,
            false,
            responseStatus_OK,
            responseBody_OK_NotComplete_Empty),
        // incomingEventStatus == NOT_COMPLETE
        // existingStatus == IN_PROGRESS
        // analystList is empty after removal
        arguments(
            incomingEventStatusUpdateRequest_NotComplete_SameAnalyst,
            cacheHit_InProgress,
            finalEventStatusInfo_NotComplete_Empty,
            false,
            responseStatus_OK,
            responseBody_OK_NotComplete_Empty),
        // incomingEventStatus == NOT_COMPLETE
        // existingStatus == IN_PROGRESS
        // analystList is not empty after removal
        arguments(
            incomingEventStatusUpdateRequest_NotComplete,
            cacheHit_InProgress,
            finalEventStatusInfo_NotComplete,
            false,
            responseStatus_OK,
            responseBody_OK_NotComplete),
        arguments(
            incomingEventStatusUpdateRequest_Complete,
            cacheHit_Complete,
            finalEventStatusInfo_Complete,
            true,
            responseStatus_MethodNotAllowedError,
            responseBody_StatusChangeToCompleteError),
        // incomingEventStatus == COMPLETE
        // existingStatus == IN_PROGRESS
        arguments(
            incomingEventStatusUpdateRequest_Complete,
            cacheHit_InProgress,
            finalEventStatusInfo_Complete,
            false,
            responseStatus_OK,
            responseBody_OK_Complete),
        // incomingEventStatus == COMPLETE
        // existingStatus == NOT_COMPLETE
        arguments(
            incomingEventStatusUpdateRequest_Complete,
            cacheHit_NotComplete,
            finalEventStatusInfo_Complete,
            false,
            responseStatus_OK,
            responseBody_OK_Complete),
        arguments(
            incomingEventStatusUpdateRequest_NotStarted,
            cacheHit_InProgress,
            finalEventStatusInfo_Complete,
            true,
            responseStatus_MethodNotAllowedError,
            responseBody_GenericStatusChangeError),
        // incomingEventStatus == NOT_STARTED
        // existingStatus == NOT_STARTED
        arguments(
            incomingEventStatusUpdateRequest_NotStarted,
            cacheHit_NotStarted,
            existingEventStatusInfo_NotStarted,
            false,
            responseStatus_OK,
            responseBody_OK_cacheNotStarted));
  }

  @ParameterizedTest
  @MethodSource("testUpdateEventStatus")
  void testUpdateEventStatusCoverages(
      EventStatusUpdateRequest incomingEventStatusUpdateRequest,
      EventStatusInfoByStageIdAndEventIdsResponse cacheHit,
      EventStatusInfo finalEventStatusInfo,
      boolean throwError,
      HttpStatus responseStatus,
      Object responseBody) {

    doReturn(cacheHit)
        .when(eventAccessor)
        .findEventStatusInfoByStageIdAndEventIds(
            incomingEventStatusUpdateRequest.getStageId(),
            List.of(incomingEventStatusUpdateRequest.getEventId()));

    final var publishedEvent =
        SystemEvent.from(
            "events",
            List.of(
                EventStatusUpdateRequest.from(
                    incomingEventStatusUpdateRequest.getStageId(),
                    incomingEventStatusUpdateRequest.getEventId(),
                    finalEventStatusInfo)),
            0);

    final var response = eventManager.updateEventStatus(incomingEventStatusUpdateRequest);

    if (!throwError) {
      verify(systemEventPublisher).sendSystemEvent(publishedEvent);
    }

    assertEquals(responseStatus, response.getStatusCode());
    assertEquals(responseBody, response.getBody());
  }

  private FeaturePredictionContainer buildArrivalTimeFeaturePredictionContainer(
      EventLocation eventLocation, Collection<Location> receiverLocations) {

    var predictions = new ArrayList<FeaturePrediction<?>>();

    receiverLocations.forEach(
        receiverLocation ->
            predictions.add(
                FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
                    .setPredictionValue(
                        ArrivalTimeFeaturePredictionValue.from(
                            FeatureMeasurementTypes.ARRIVAL_TIME,
                            ArrivalTimeMeasurementValue.from(
                                InstantValue.from(Instant.ofEpochSecond(1), Duration.ofHours(1)),
                                Optional.of(DurationValue.from(Duration.ofDays(1), Duration.ZERO))),
                            Map.of(),
                            Set.of()))
                    .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
                    .setPhase(PhaseType.P)
                    .setExtrapolated(false)
                    .setSourceLocation(eventLocation)
                    .setReceiverLocation(receiverLocation)
                    .noChannel()
                    .noPredictionChannelSegment()
                    .build()));

    return FeaturePredictionContainer.create(predictions);
  }
}
