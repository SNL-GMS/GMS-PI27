package gms.shared.event.coi;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import com.google.common.collect.ImmutableSet;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventTest {

  @Mock Event.Data data;

  @Mock EventHypothesis eventHypothesis;

  @Mock PreferredEventHypothesis preferredEventHypothesis;

  @Test
  void testSerializationFullyHydrated() {
    var event =
        EventTestFixtures.generateDummyEvent(
            UUID.fromString("10000000-100-0000-1000-100000000092"),
            WorkflowDefinitionId.from("STAGE"),
            "ORG",
            "Analyst",
            Instant.EPOCH,
            1.3,
            MagnitudeType.MB);
    JsonTestUtilities.assertSerializes(event, Event.class);
  }

  @Test
  void testSerializationFaceted() {
    Event event =
        Event.createEntityReference(UUID.fromString("10000000-100-0000-1000-100000000093"));
    JsonTestUtilities.assertSerializes(event, Event.class);
  }

  @Test
  void testCreateEntityReference() {
    var id = UUID.fromString("10000000-100-0000-1000-100000000094");
    Event event = Event.createEntityReference(id);
    assertEquals(id, event.getId());
    assertFalse(event.getData().isPresent());
  }

  @Test
  void testToEntityReference() {

    var eventId = UUID.fromString("10000000-100-0000-1000-100000000095");
    var hypothesisId =
        EventHypothesis.Id.from(eventId, UUID.fromString("10000000-100-0000-1000-100000000096"));
    Mockito.when(eventHypothesis.getId()).thenReturn(hypothesisId);
    Mockito.when(data.getEventHypotheses())
        .thenReturn(ImmutableSet.copyOf(List.of(eventHypothesis)));

    var event = Event.builder().setId(eventId).setData(data).build();

    Event entityRef = event.toEntityReference();

    assertTrue(event.getData().isPresent());
    assertEquals(event.getId(), entityRef.getId());
    assertFalse(entityRef.getData().isPresent());
  }

  @ParameterizedTest
  @MethodSource("eventDataBuildSource")
  void testEventDataBuildPartial(
      boolean isPartial, Class<Throwable> exception, Event.Data.Builder dataBuilder) {

    if (isPartial) {
      assertThrows(exception, dataBuilder::build);
    } else {
      assertDoesNotThrow(dataBuilder::build);
    }
  }

  private static Stream<Arguments> eventDataBuildSource() {
    var eventHypothesis = mock(EventHypothesis.class);
    var testWfDefId = WorkflowDefinitionId.from("TEST");
    var preferredEventHypothesis =
        PreferredEventHypothesis.from(testWfDefId, "ANALYST", eventHypothesis);
    return Stream.of(
        Arguments.arguments(false, null, Event.Data.builder()),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            Event.Data.builder().setMonitoringOrganization("TEST")),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            Event.Data.builder()
                .setMonitoringOrganization("TEST")
                .setEventHypotheses(List.of(eventHypothesis))),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            Event.Data.builder()
                .setMonitoringOrganization("")
                .setEventHypotheses(List.of(eventHypothesis))
                .setPreferredEventHypothesisByStage(
                    ImmutableSet.<PreferredEventHypothesis>builder()
                        .add(preferredEventHypothesis)
                        .build())),
        Arguments.arguments(
            false,
            null,
            Event.Data.builder()
                .setMonitoringOrganization("TEST")
                .setEventHypotheses(List.of(eventHypothesis))
                .setPreferredEventHypothesisByStage(
                    ImmutableSet.<PreferredEventHypothesis>builder()
                        .add(preferredEventHypothesis)
                        .build())));
  }

  @Test
  void testEventBuilderErrors() {
    var hypothesisId =
        EventHypothesis.Id.from(
            UUID.fromString("10000000-100-0000-1000-100000000097"),
            UUID.fromString("10000000-100-0000-1000-100000000098"));
    Mockito.when(eventHypothesis.getId()).thenReturn(hypothesisId);
    Mockito.when(data.getEventHypotheses())
        .thenReturn(ImmutableSet.copyOf(List.of(eventHypothesis)));
    var eventBuilder =
        Event.builder().setData(data).setId(UUID.fromString("10000000-100-0000-1000-100000000099"));
    assertThrows(IllegalStateException.class, eventBuilder::build);
  }

  @Test
  void testEventDataBuilderAddHypothesis() {
    var eventDataBuilder = Event.Data.builder();
    EventHypothesis mockToAdd = mock(EventHypothesis.class);

    // add to previously set hypotheses
    eventDataBuilder.setEventHypotheses(List.of(eventHypothesis));

    eventDataBuilder.addEventHypothesis(mockToAdd);
    var eventHypotheses = eventDataBuilder.getEventHypotheses();
    var expectedHypotheses = List.of(this.eventHypothesis, mockToAdd);
    assertEquals(expectedHypotheses.size(), eventHypotheses.size());
    assertTrue(eventHypotheses.containsAll(expectedHypotheses));

    // add to unset hypotheses creates new set of hypotheses
    eventDataBuilder = Event.Data.builder();
    eventDataBuilder.addEventHypothesis(mockToAdd);
    eventHypotheses = eventDataBuilder.getEventHypotheses();
    assertEquals(1, eventHypotheses.size());
    assertTrue(eventHypotheses.contains(mockToAdd));
  }

  @Test
  void testEventDataBuilderAddFinalEventHypothesis() {
    var eventDataBuilder = Event.Data.builder();
    EventHypothesis mockToAdd = mock(EventHypothesis.class);

    // add to previously set hypotheses
    eventDataBuilder.setFinalEventHypothesisHistory(List.of(eventHypothesis));

    eventDataBuilder.addFinalEventHypothesis(mockToAdd);
    var finalEventHypotheses = eventDataBuilder.getFinalEventHypothesisHistory();
    var expectedHypotheses = List.of(this.eventHypothesis, mockToAdd);
    assertEquals(expectedHypotheses.size(), finalEventHypotheses.size());
    assertEquals(expectedHypotheses.get(0), finalEventHypotheses.get(0));
    assertEquals(expectedHypotheses.get(1), finalEventHypotheses.get(1));

    // add to unset hypotheses creates new set of hypotheses
    eventDataBuilder = Event.Data.builder();
    eventDataBuilder.addFinalEventHypothesis(mockToAdd);
    finalEventHypotheses = eventDataBuilder.getFinalEventHypothesisHistory();
    assertEquals(1, finalEventHypotheses.size());
    assertTrue(finalEventHypotheses.contains(mockToAdd));
  }
}
