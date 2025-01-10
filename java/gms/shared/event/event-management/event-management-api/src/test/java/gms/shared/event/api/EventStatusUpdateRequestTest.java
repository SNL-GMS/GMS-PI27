package gms.shared.event.api;

import gms.shared.event.coi.EventStatus;
import gms.shared.event.coi.EventStatusInfo;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EventStatusUpdateRequestTest {

  @Test
  void testSerialization() throws IOException {
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
    var request =
        EventStatusUpdateRequest.from(
            stageId,
            UUID.fromString("10000000-100-0000-1000-100000000003"),
            EventStatusInfo.from(EventStatus.IN_PROGRESS, List.of("analystID1", "analystID2")));
    JsonTestUtilities.assertSerializes(request, EventStatusUpdateRequest.class);
  }
}
