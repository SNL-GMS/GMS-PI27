package gms.shared.event.api;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class EventsWithDetectionsAndSegmentsByTimeRequestTest {

  @Test
  void testSerialization() throws IOException {
    var startTime = Instant.EPOCH;
    var endTime = startTime.plusSeconds(300);
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
    var request = EventsWithDetectionsAndSegmentsByTimeRequest.create(startTime, endTime, stageId);
    JsonTestUtilities.assertSerializes(request, EventsWithDetectionsAndSegmentsByTimeRequest.class);
  }
}
