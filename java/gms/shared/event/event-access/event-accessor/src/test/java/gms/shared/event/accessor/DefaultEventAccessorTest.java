package gms.shared.event.accessor;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import com.google.common.collect.ImmutableSet;
import gms.shared.event.accessor.facet.EventFacetingUtility;
import gms.shared.event.api.EventRepository;
import gms.shared.event.api.EventStatusInfoByStageIdAndEventIdsResponse;
import gms.shared.event.coi.Event;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventStatusInfo;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

@ExtendWith(MockitoExtension.class)
class DefaultEventAccessorTest {

  @Mock private EventRepository eventRepository;

  @Mock private EventFacetingUtility eventFacetingUtility;

  @Mock private SignalDetectionAccessor signalDetectionAccessor;

  @Mock private EventStatusInfoCache eventStatusInfoCache;

  @Mock private Environment environment;

  @InjectMocks private DefaultEventAccessor eventAccessor;

  private UUID uuid = UUID.fromString("00000000-000-0000-0000-000000000001");

  @Test
  void testFindEventsByTimeFaceting() {
    var startTime = Instant.EPOCH;
    var endTime = Instant.ofEpochSecond(1);
    var stageId = WorkflowDefinitionId.from("stage");
    var facetingDefinitionEmpty = Optional.<FacetingDefinition>empty();
    var facetingDefinition =
        Optional.of(
            FacetingDefinition.builder()
                .setClassType(Event.class.getSimpleName())
                .setPopulated(true)
                .build());

    var event = Mockito.mock(Event.class);
    var events = Set.of(event);

    when(eventRepository.findByTime(startTime, endTime, stageId)).thenReturn(events);
    when(eventFacetingUtility.populateFacets(event, stageId, facetingDefinition.get()))
        .thenReturn(event);

    var noFaceting = eventAccessor.findByTime(startTime, endTime, stageId, facetingDefinitionEmpty);
    var faceting = eventAccessor.findByTime(startTime, endTime, stageId, facetingDefinition);

    assertEquals(events, noFaceting);
    assertEquals(events, faceting);
  }

  @Test
  void testFindByAssociatedDetectionHypotheses() {
    var signalDetection = SignalDetection.createEntityReference(uuid);
    var stageId = WorkflowDefinitionId.from("stage");
    var eventId = uuid;
    var dummyEvent =
        EventTestFixtures.generateDummyEvent(
            eventId, stageId, "Org", "analyst", Instant.EPOCH, 1.0, MagnitudeType.MB);
    var event =
        Event.builder()
            .setId(eventId)
            .setData(dummyEvent.getData().orElseThrow().toBuilder().build())
            .build();

    var events = Set.of(event);

    var signalDetectionHypotheses =
        List.of(SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS);
    when(eventRepository.findByAssociatedDetectionHypotheses(signalDetectionHypotheses, stageId))
        .thenReturn(events);
    when(eventFacetingUtility.populateFacets(
            any(Event.class), any(WorkflowDefinitionId.class), any(FacetingDefinition.class)))
        .thenReturn(event);
    var result =
        eventAccessor.findByAssociatedDetectionHypotheses(signalDetectionHypotheses, stageId);
    assertEquals(events, result);
  }

  @Test
  void testFindEventsWithDetectionsAndSegmentsByTimeNoEvents() {

    var signalDetectionsWithChannelSegments = SignalDetectionsWithChannelSegments.builder().build();
    var stageId = WorkflowDefinitionId.from("stage");
    var startTime = Instant.EPOCH;
    var endTime = Instant.ofEpochSecond(1);
    doReturn(new String[] {}).when(environment).getActiveProfiles();

    var eventsWithDetectionsAndSegmentsByTime =
        eventAccessor.findEventsWithDetectionsAndSegmentsByTime(startTime, endTime, stageId);

    assertEquals(Set.of(), eventsWithDetectionsAndSegmentsByTime.getEvents());
    assertEquals(
        signalDetectionsWithChannelSegments,
        eventsWithDetectionsAndSegmentsByTime.getDetectionsWithChannelSegments());
  }

  @Test
  void testFindHypothesesByIds() {
    var uuid = EventTestFixtures.EVENT_UUID;
    var eventHypothesisId = EventHypothesis.Id.from(uuid, uuid);
    var dummyEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            uuid,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            1.0,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(2.0, Optional.of(3.0), Units.DEGREES),
            List.of(EventHypothesis.builder().setId(eventHypothesisId).build()));
    var ids = List.of(eventHypothesisId);

    doReturn(List.of(dummyEventHypothesis)).when(eventRepository).findHypothesesByIds(ids);

    assertDoesNotThrow(() -> eventAccessor.findHypothesesByIds(ids));
  }

  @Test
  void testFindEventsWithDetectionsAndSegmentsByTime() {

    var event = Mockito.mock(Event.class);
    var eventData = Mockito.mock(Event.Data.class);
    var eventHypothesis = Mockito.mock(EventHypothesis.class);
    var eventHypothesisData = Mockito.mock(EventHypothesis.Data.class);
    var signalDetectionHypothesis = Mockito.mock(SignalDetectionHypothesis.class);
    var signalDetectionId = UUID.fromString("505c377a-b6a4-478f-b3cd-beef4ee6b801");
    var signalDetectionHypothesisId =
        SignalDetectionHypothesisId.from(
            signalDetectionId, UUID.fromString("505c377a-b6a4-478f-b3cd-beef4ee6b802"));
    var signalDetection = Mockito.mock(SignalDetection.class);
    var channelSegment = Mockito.mock(ChannelSegment.class);
    var signalDetectionsWithChannelSegments =
        SignalDetectionsWithChannelSegments.builder()
            .setSignalDetections(List.of(signalDetection))
            .setChannelSegments(List.of((ChannelSegment<?>) channelSegment))
            .build();
    var stageId = WorkflowDefinitionId.from("stage");
    var startTime = Instant.EPOCH;
    var endTime = Instant.ofEpochSecond(1);

    // Mock data
    doReturn(Optional.of(eventData)).when(event).getData();
    doReturn(ImmutableSet.of(eventHypothesis)).when(eventData).getEventHypotheses();
    doReturn(Optional.of(eventHypothesisData)).when(eventHypothesis).getData();
    doReturn(ImmutableSet.of(signalDetectionHypothesis))
        .when(eventHypothesisData)
        .getAssociatedSignalDetectionHypotheses();
    doReturn(signalDetectionHypothesisId).when(signalDetectionHypothesis).getId();
    // Repository/Accessor mocks
    doReturn(signalDetectionsWithChannelSegments)
        .when(signalDetectionAccessor)
        .findWithSegmentsByIds(List.of(signalDetectionId), stageId);
    doReturn(Set.of(event)).when(eventRepository).findByTime(startTime, endTime, stageId);
    doReturn(new String[] {}).when(environment).getActiveProfiles();

    when(eventFacetingUtility.populateFacets(
            any(Event.class), any(WorkflowDefinitionId.class), any(FacetingDefinition.class)))
        .thenReturn(event);

    var eventsWithDetectionsAndSegmentsByTime =
        eventAccessor.findEventsWithDetectionsAndSegmentsByTime(startTime, endTime, stageId);

    assertEquals(Set.of(event), eventsWithDetectionsAndSegmentsByTime.getEvents());
    assertEquals(
        signalDetectionsWithChannelSegments,
        eventsWithDetectionsAndSegmentsByTime.getDetectionsWithChannelSegments());
  }

  @Test
  void testFindEventStatusInfoByStageIdAndEventIds() {

    var stageId = Mockito.mock(WorkflowDefinitionId.class);
    var eventId = UUID.fromString("505c377a-b6a4-478f-b3cd-beef4ee6b803");
    var eventIds = new ArrayList<>(List.of(eventId, eventId, eventId));
    var eventStatusInfo = Mockito.mock(EventStatusInfo.class);
    var eventStatusInfos = Map.of(eventId, eventStatusInfo);

    doReturn(eventStatusInfo)
        .when(eventStatusInfoCache)
        .getOrCreateEventStatusInfo(stageId, eventId);

    var eventStatusInfoByStageAndEventIdsResponse =
        eventAccessor.findEventStatusInfoByStageIdAndEventIds(stageId, eventIds);

    var expectedEventStatusInfoMap =
        EventStatusInfoByStageIdAndEventIdsResponse.builder()
            .setStageId(stageId)
            .setEventStatusInfoMap(eventStatusInfos)
            .build()
            .getEventStatusInfoMap();

    assertEquals(stageId, eventStatusInfoByStageAndEventIdsResponse.getStageId());
    assertEquals(
        expectedEventStatusInfoMap,
        eventStatusInfoByStageAndEventIdsResponse.getEventStatusInfoMap());
  }

  @Test
  void testUpdateEventStatusInfo() {
    var stageId = Mockito.mock(WorkflowDefinitionId.class);
    var eventId = UUID.fromString("505c377a-b6a4-478f-b3cd-beef4ee6b804");
    var eventStatusInfo = Mockito.mock(EventStatusInfo.class);

    Assertions.assertDoesNotThrow(
        () -> eventAccessor.updateEventStatusInfo(stageId, eventId, eventStatusInfo));
  }
}
