package gms.shared.event.coi;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventHypothesisTest {

  @Mock EventHypothesis.Data data;

  private static final UUID UUID_1 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b871");
  private static final UUID UUID_2 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b872");
  private static final UUID UUID_3 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b873");

  @Test
  void testSerializationFullyHydrated() {
    var eventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            UUID_1,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            3.3,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
            List.of());

    JsonTestUtilities.assertSerializes(eventHypothesis, EventHypothesis.class);
  }

  @Test
  void testSerializationFaceted() {
    var eventHypothesis =
        EventHypothesis.createEntityReference(EventHypothesis.Id.from(UUID_1, UUID_2));
    JsonTestUtilities.assertSerializes(eventHypothesis, EventHypothesis.class);
  }

  @Test
  void testCreateEntityReference() {
    var id = EventHypothesis.Id.from(UUID_1, UUID_2);
    var eventHypothesis = EventHypothesis.createEntityReference(id);
    assertEquals(id, eventHypothesis.getId());
    assertFalse(eventHypothesis.getData().isPresent());
  }

  @Test
  void testToEntityReference() {

    var eventHypothesis =
        EventHypothesis.builder()
            .setData(data)
            .setId(EventHypothesis.Id.from(UUID_1, UUID_2))
            .build();

    var entityRef = eventHypothesis.toEntityReference();

    assertTrue(eventHypothesis.getData().isPresent());
    assertEquals(eventHypothesis.getId(), entityRef.getId());
    assertFalse(entityRef.getData().isPresent());
  }

  @Test
  void testCreateRejectedEventHypothesis() {
    var eventUUID = UUID_1;
    var rejectedEhUUID = UUID_2;
    var rejectedParentEh = UUID_3;
    var actualRejectedEventHypothesis =
        EventHypothesis.createRejectedEventHypothesis(eventUUID, rejectedEhUUID, rejectedParentEh);

    var expectedEventHypothesis =
        EventHypothesis.builder()
            .setId(EventHypothesis.Id.from(eventUUID, rejectedEhUUID))
            .setData(
                EventHypothesis.Data.builder()
                    .setParentEventHypotheses(
                        List.of(
                            EventHypothesis.builder()
                                .setId(EventHypothesis.Id.from(eventUUID, rejectedParentEh))
                                .build()))
                    .setRejected(true)
                    .setDeleted(false)
                    .build())
            .build();

    assertEquals(expectedEventHypothesis, actualRejectedEventHypothesis);
  }

  @Test
  void testIsDeletedCorrectlySet() {
    var eventUUID = UUID_1;
    var rejectedEhUUID = UUID_2;
    var rejectedParentEh = UUID_3;
    var actualRejectedEventHypothesis =
        EventHypothesis.createRejectedEventHypothesis(eventUUID, rejectedEhUUID, rejectedParentEh);
    var isDeleted = actualRejectedEventHypothesis.getData().get().isDeleted();

    assertFalse(isDeleted, "The isDeleted attribute should be set to false by default");
  }

  @Test
  void testIsRejectedNotSet() {

    var eventUUID = UUID_1;
    var ehUUID = UUID_2;
    var parentEh = UUID_3;

    var dataRejectedNotSet =
        EventHypothesis.Data.builder()
            .setParentEventHypotheses(
                List.of(
                    EventHypothesis.builder()
                        .setId(EventHypothesis.Id.from(eventUUID, parentEh))
                        .build()))
            .setDeleted(false)
            .build();

    assertNull(dataRejectedNotSet, "Data should be null if rejected is not set");
  }

  @Test
  void testIsDeletedNotSet() {

    var eventUUID = UUID_1;
    var ehUUID = UUID_2;
    var parentEh = UUID_3;

    var dataRejectedNotSet =
        EventHypothesis.Data.builder()
            .setParentEventHypotheses(
                List.of(
                    EventHypothesis.builder()
                        .setId(EventHypothesis.Id.from(eventUUID, parentEh))
                        .build()))
            .setRejected(true)
            .build();

    assertNull(dataRejectedNotSet, "Data should be null if deleted is not set");
  }

  @ParameterizedTest
  @MethodSource("eventHypothesisDataBuildSource")
  void testEventHypothesisDataBuild(
      boolean shouldThrow, Class<Throwable> exception, EventHypothesis.Data.Builder dataBuilder) {

    if (shouldThrow) {
      assertThrows(exception, dataBuilder::build);
    } else {
      assertDoesNotThrow(dataBuilder::build);
    }
  }

  private static Stream<Arguments> eventHypothesisDataBuildSource() {
    var locationSolution = mock(LocationSolution.class);
    return Stream.of(
        Arguments.arguments(false, null, EventHypothesis.Data.builder()),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            EventHypothesis.Data.builder()
                .setRejected(true)
                .setDeleted(false)
                .setLocationSolutions(List.of(locationSolution))),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            EventHypothesis.Data.builder()
                .setRejected(true)
                .setDeleted(false)
                .setPreferredLocationSolution(locationSolution)),
        Arguments.arguments(
            false, null, EventHypothesis.Data.builder().setRejected(true).setDeleted(false)),
        Arguments.arguments(
            false, null, EventHypothesis.Data.builder().setRejected(true).setDeleted(true)),
        Arguments.arguments(
            false, null, EventHypothesis.Data.builder().setRejected(false).setDeleted(true)),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            EventHypothesis.Data.builder()
                .setRejected(true)
                .setDeleted(true)
                .setAssociatedSignalDetectionHypotheses(
                    Set.of(
                        SignalDetectionHypothesis.builder()
                            .setId(SignalDetectionHypothesisId.from(UUID_1, UUID_2))
                            .setData(SignalDetectionHypothesis.Data.builder().build())
                            .build()))),
        Arguments.arguments(
            false,
            null,
            EventHypothesis.Data.builder()
                .setRejected(true)
                .setDeleted(true)
                .setParentEventHypotheses(
                    Set.of(
                        EventHypothesis.builder()
                            .setId(EventHypothesis.Id.from(UUID_1, UUID_1))
                            .build()))),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            EventHypothesis.Data.builder()
                .setRejected(true)
                .setDeleted(true)
                .setParentEventHypotheses(
                    Set.of(
                        EventHypothesis.builder()
                            .setId(EventHypothesis.Id.from(UUID_1, UUID_1))
                            .build(),
                        EventHypothesis.builder()
                            .setId(EventHypothesis.Id.from(UUID_2, UUID_2))
                            .build()))),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            EventHypothesis.Data.builder()
                .setRejected(false)
                .setDeleted(false)
                .setLocationSolutions(List.of(locationSolution))),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            EventHypothesis.Data.builder()
                .setRejected(false)
                .setDeleted(false)
                .setPreferredLocationSolution(locationSolution)
                .setLocationSolutions(Collections.emptyList())),
        Arguments.arguments(
            false,
            null,
            EventHypothesis.Data.builder()
                .setRejected(false)
                .setDeleted(false)
                .setPreferredLocationSolution(locationSolution)
                .setLocationSolutions(List.of(locationSolution))));
  }
}
