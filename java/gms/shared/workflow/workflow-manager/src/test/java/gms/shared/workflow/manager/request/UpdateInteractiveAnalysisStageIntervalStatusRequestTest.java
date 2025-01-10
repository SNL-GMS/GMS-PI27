package gms.shared.workflow.manager.request;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class UpdateInteractiveAnalysisStageIntervalStatusRequestTest {

  @Test
  void testSerialization() throws IOException {

    var request =
        UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
            .setUserName("Test User")
            .setTime(Instant.MAX)
            .setStageIntervalId(IntervalId.from(Instant.now(), WorkflowDefinitionId.from("STAGE")))
            .setStatus(IntervalStatus.NOT_STARTED)
            .build();

    JsonTestUtilities.assertSerializes(
        request, UpdateInteractiveAnalysisStageIntervalStatusRequest.class);
  }
}
