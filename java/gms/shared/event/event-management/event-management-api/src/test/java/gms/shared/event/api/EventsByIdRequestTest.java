package gms.shared.event.api;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EventsByIdRequestTest {

  @Test
  void testSerialization() throws IOException {
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
    var request =
        EventsByIdRequest.create(
            List.of(
                UUID.fromString("10000000-100-0000-1000-100000000004"),
                UUID.fromString("10000000-100-0000-1000-100000000005")),
            stageId);
    JsonTestUtilities.assertSerializes(request, EventsByIdRequest.class);
  }
}
