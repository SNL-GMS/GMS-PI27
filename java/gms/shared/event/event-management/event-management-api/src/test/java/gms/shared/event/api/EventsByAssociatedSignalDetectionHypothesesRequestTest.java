package gms.shared.event.api;

import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.util.List;
import org.junit.jupiter.api.Test;

class EventsByAssociatedSignalDetectionHypothesesRequestTest {

  @Test
  void testSerialization() throws IOException {
    var sdHypotheses = List.of(SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_NO_MCS);
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
    var request = EventsByAssociatedSignalDetectionHypothesesRequest.create(sdHypotheses, stageId);
    JsonTestUtilities.assertSerializes(
        request, EventsByAssociatedSignalDetectionHypothesesRequest.class);
  }
}
