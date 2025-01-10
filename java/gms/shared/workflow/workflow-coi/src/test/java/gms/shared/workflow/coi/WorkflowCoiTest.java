package gms.shared.workflow.coi;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.core.type.TypeReference;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class WorkflowCoiTest {

  private static ProcessingStep processingStep;
  private static ProcessingSequence processingSequence;
  private static AutomaticProcessingStage automaticProcessingStage;
  private static Workflow workflow;
  private static Activity activity;
  private static InteractiveAnalysisStage interactiveAnalysisStage;

  @BeforeAll
  public static void init() {
    processingStep = ProcessingStep.from("ProcessingStepName");
    processingSequence = ProcessingSequence.from("ProcessingSequenceName", List.of(processingStep));
    automaticProcessingStage =
        AutomaticProcessingStage.from(
            "AutomaticStageName", Duration.ofHours(10), List.of(processingSequence));
    var stationGroup = StationGroup.createVersionReference("name", Instant.EPOCH);
    activity = Activity.from("Activity1Name", stationGroup, AnalysisMode.SCAN);
    var activity2 = Activity.from("Activity2Name", stationGroup, AnalysisMode.EVENT_REVIEW);
    interactiveAnalysisStage =
        InteractiveAnalysisStage.from(
            "InteractiveStageName", Duration.ofHours(10), List.of(activity, activity2));
    workflow =
        Workflow.from("WorkflowName", List.of(automaticProcessingStage, interactiveAnalysisStage));
  }

  @Test
  void testProcessingStepSerialization() {
    JsonTestUtilities.assertSerializes(processingStep, ProcessingStep.class);
  }

  @Test
  void testProcessingSequenceSerialization() {
    JsonTestUtilities.assertSerializes(processingSequence, ProcessingSequence.class);
  }

  @Test
  void testAutomaticProcessingStageSerialization() {
    JsonTestUtilities.assertSerializes(automaticProcessingStage, AutomaticProcessingStage.class);
  }

  @Test
  void testWorkflowDefinitionSerialization() {
    WorkflowDefinition workflowDefinition =
        WorkflowDefinition.from("test", List.of("stage1", "stage2", "stage3"));
    JsonTestUtilities.assertSerializes(workflowDefinition, WorkflowDefinition.class);
  }

  @Test
  void testWorkflowSerialization() {
    JsonTestUtilities.assertSerializes(workflow, Workflow.class);
  }

  @Test
  void testActivitySerialization() {
    JsonTestUtilities.assertSerializes(activity, Activity.class);
  }

  @Test
  void testInteractiveAnalysisStageSerialization() {
    JsonTestUtilities.assertSerializes(interactiveAnalysisStage, InteractiveAnalysisStage.class);
  }

  @Test
  void testStageCollectionSerialization() {
    List<Stage> stages = List.of(interactiveAnalysisStage, automaticProcessingStage);
    JsonTestUtilities.assertSerializes(stages, new TypeReference<>() {});
  }

  @Test
  void testWorkflowHelperMethods() {
    assertEquals(
        Set.of(automaticProcessingStage, interactiveAnalysisStage),
        workflow.stages().collect(Collectors.toSet()));
    assertEquals(
        Set.of(automaticProcessingStage.getStageId(), interactiveAnalysisStage.getStageId()),
        workflow.stageIds().collect(Collectors.toSet()));
  }
}
