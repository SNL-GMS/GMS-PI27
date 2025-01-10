package gms.shared.workflow.manager.request;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class StageIntervalsByStageIdAndTimeRequestTest {

  @Test
  void testSerialization() throws IOException {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(30);
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
    StageIntervalsByStageIdAndTimeRequest request =
        StageIntervalsByStageIdAndTimeRequest.from(startTime, endTime, List.of(stageId));
    JsonTestUtilities.assertSerializes(request, StageIntervalsByStageIdAndTimeRequest.class);
  }
}
