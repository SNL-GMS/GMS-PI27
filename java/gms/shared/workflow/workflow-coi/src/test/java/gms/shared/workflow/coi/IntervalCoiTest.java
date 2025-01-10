package gms.shared.workflow.coi;

import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class IntervalCoiTest {

  private static final String NAME = "name";
  private static final String STAGE_NAME = "stage name";
  private static ActivityInterval activityInterval;
  private static StageMetrics stageMetrics;
  private static ProcessingSequenceInterval processingSequenceInterval;
  private static AutomaticProcessingStageInterval automaticProcessingStageInterval;
  private static InteractiveAnalysisStageInterval interactiveAnalysisStageInterval;

  @BeforeAll
  public static void init() {
    activityInterval =
        ActivityInterval.builder()
            .setIntervalId(IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from(NAME)))
            .setStatus(IntervalStatus.IN_PROGRESS)
            .setEndTime(Instant.EPOCH)
            .setProcessingStartTime(Instant.EPOCH)
            .setProcessingEndTime(Instant.EPOCH)
            .setStorageTime(Instant.EPOCH)
            .setModificationTime(Instant.EPOCH)
            .setPercentAvailable(50.0)
            .setComment("comment")
            .setStageName(STAGE_NAME)
            .setActiveAnalysts(List.of("Analyst1", "Analyst2"))
            .build();
    stageMetrics = StageMetrics.from(1, 1, 1, 1.1);
    processingSequenceInterval =
        ProcessingSequenceInterval.builder()
            .setIntervalId(IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from(NAME)))
            .setStatus(IntervalStatus.IN_PROGRESS)
            .setEndTime(Instant.EPOCH)
            .setProcessingStartTime(Instant.EPOCH)
            .setProcessingEndTime(Instant.EPOCH)
            .setStorageTime(Instant.EPOCH)
            .setModificationTime(Instant.EPOCH)
            .setPercentAvailable(1.1)
            .setComment("Comment")
            .setStageName(STAGE_NAME)
            .setPercentComplete(1.1)
            .setLastExecutedStepName("StepName")
            .build();
    automaticProcessingStageInterval =
        AutomaticProcessingStageInterval.builder()
            .setIntervalId(IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from(NAME)))
            .setStatus(IntervalStatus.IN_PROGRESS)
            .setEndTime(Instant.EPOCH)
            .setProcessingStartTime(Instant.EPOCH)
            .setProcessingEndTime(Instant.EPOCH)
            .setStorageTime(Instant.EPOCH)
            .setModificationTime(Instant.EPOCH)
            .setPercentAvailable(1.1)
            .setComment("Comment")
            .setStageMetrics(stageMetrics)
            .setSequenceIntervals(List.of(processingSequenceInterval))
            .build();
    interactiveAnalysisStageInterval =
        InteractiveAnalysisStageInterval.builder()
            .setIntervalId(IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from(NAME)))
            .setStatus(IntervalStatus.IN_PROGRESS)
            .setEndTime(Instant.EPOCH)
            .setProcessingStartTime(Instant.EPOCH)
            .setProcessingEndTime(Instant.EPOCH)
            .setStorageTime(Instant.EPOCH)
            .setModificationTime(Instant.EPOCH)
            .setPercentAvailable(1.1)
            .setComment("Comment")
            .setStageMetrics(stageMetrics)
            .setActivityIntervals(List.of(activityInterval))
            .build();
  }

  @Test
  void testActivityIntervalSerialization() {
    JsonTestUtilities.assertSerializes(activityInterval, ActivityInterval.class);
  }

  @Test
  void testStageMetricsSerialization() {
    JsonTestUtilities.assertSerializes(stageMetrics, StageMetrics.class);
  }

  @Test
  void testProcessingSequenceIntervalSerialization() {
    JsonTestUtilities.assertSerializes(
        processingSequenceInterval, ProcessingSequenceInterval.class);
  }

  @Test
  void testAutomaticProcessingStageIntervalSerialization() {
    JsonTestUtilities.assertSerializes(
        automaticProcessingStageInterval, AutomaticProcessingStageInterval.class);
    JsonTestUtilities.assertSerializes(automaticProcessingStageInterval, StageInterval.class);
  }

  @Test
  void testInteractiveAnalysisStageIntervalSerialization() {
    JsonTestUtilities.assertSerializes(
        interactiveAnalysisStageInterval, InteractiveAnalysisStageInterval.class);
    JsonTestUtilities.assertSerializes(interactiveAnalysisStageInterval, StageInterval.class);
  }
}
