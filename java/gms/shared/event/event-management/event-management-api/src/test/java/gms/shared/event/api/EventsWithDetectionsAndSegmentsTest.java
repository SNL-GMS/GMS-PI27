package gms.shared.event.api;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import com.google.common.collect.ImmutableSet;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class EventsWithDetectionsAndSegmentsTest {

  @Test
  void testSerialization() {

    var event =
        EventTestFixtures.generateDummyEvent(
            UUID.fromString("10000000-100-0000-1000-100000000007"),
            WorkflowDefinitionId.from("StageName"),
            "ORG",
            "NAME",
            Instant.EPOCH,
            0.0,
            MagnitudeType.MB);

    var eventsWithDetectionsAndSegments =
        EventsWithDetectionsAndSegments.builder()
            .setEvents(Set.of(event))
            .setDetectionsWithChannelSegments(
                SignalDetectionsWithChannelSegments.builder()
                    .setSignalDetections(ImmutableSet.of())
                    .setChannelSegments(ImmutableSet.of())
                    .build())
            .build();
    JsonTestUtilities.assertSerializes(
        eventsWithDetectionsAndSegments, EventsWithDetectionsAndSegments.class);
  }

  @Test
  @Disabled("Disabled so it doesn't run in the pipeline. Re-enable locally to generate dump")
  void testDumpMockEventsWithDetectionsAndSegments() throws IOException {
    var workflowDefId = WorkflowDefinitionId.from("TEST");
    var monitoringOrg = SignalDetectionTestFixtures.MONITORING_ORG;
    var mockEvents =
        List.of(
            EventTestFixtures.generateDummyEvent(
                UUID.fromString("10000000-100-0000-1000-100000000008"),
                workflowDefId,
                monitoringOrg,
                "ANALYST1",
                Instant.EPOCH,
                1.1,
                MagnitudeType.MB),
            EventTestFixtures.generateDummyEvent(
                UUID.fromString("10000000-100-0000-1000-100000000009"),
                workflowDefId,
                monitoringOrg,
                "ANALYST2",
                Instant.EPOCH.plus(1, ChronoUnit.HOURS),
                2.1,
                MagnitudeType.ML),
            EventTestFixtures.generateDummyEvent(
                UUID.fromString("10000000-100-0000-1000-100000000010"),
                workflowDefId,
                monitoringOrg,
                "ANALYST3",
                Instant.EPOCH.plus(2, ChronoUnit.HOURS),
                3.1,
                MagnitudeType.MS));
    try (FileOutputStream outputStream =
        new FileOutputStream(
            "src/test/resources/dumps/mock-events-with-detections-and-segments.json")) {
      assertDoesNotThrow(
          () ->
              outputStream.write(
                  ObjectMappers.jsonWriter()
                      .withDefaultPrettyPrinter()
                      .writeValueAsBytes(
                          EventsWithDetectionsAndSegments.builder()
                              .setEvents(mockEvents)
                              .setDetectionsWithChannelSegments(
                                  SignalDetectionsWithChannelSegments.builder()
                                      .setSignalDetections(Collections.emptySet())
                                      .setChannelSegments(Collections.emptySet())
                                      .build())
                              .build())));
    }
  }
}
