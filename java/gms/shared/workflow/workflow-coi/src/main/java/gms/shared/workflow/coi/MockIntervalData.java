package gms.shared.workflow.coi;

import static java.util.stream.Collectors.toMap;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public final class MockIntervalData {

  private static final double FULLY_AVAILABLE = 100.0;
  private static final double HALF_COMPLETE = 50.0;
  private static final String A_COMMENT = "A comment";
  private static final StageMetrics stageMetrics = StageMetrics.from(3, 3, 1, 4.4);

  private MockIntervalData() {
    // Hide implicit public constructor
  }

  public static Map<String, List<StageInterval>> get(
      Instant startTime, Instant endTime, Collection<WorkflowDefinitionId> stageIds) {
    return stageIds.stream()
        .map(WorkflowDefinitionId::getName)
        .map(name -> generateStage(name, startTime, endTime))
        .collect(toMap(StageInterval::getName, List::of));
  }

  private static StageInterval generateStage(String stageName, Instant startTime, Instant endTime) {
    if (stageName.startsWith("Auto")) {
      return generateAuto(stageName, List.of(stageName + " Seq"), startTime, endTime);
    } else {
      return generateInteractive(stageName, List.of("Event Review", "Scan"), startTime, endTime);
    }
  }

  private static AutomaticProcessingStageInterval generateAuto(
      String stageName, List<String> sequenceNames, Instant startTime, Instant endTime) {
    List<ProcessingSequenceInterval> sequenceIntervals =
        sequenceNames.stream()
            .map(sequenceName -> generateSequence(sequenceName, startTime, endTime))
            .toList();

    var intervalId = IntervalId.from(startTime, WorkflowDefinitionId.from(stageName));

    return AutomaticProcessingStageInterval.builder()
        .setIntervalId(intervalId)
        .setComment(A_COMMENT)
        .setEndTime(endTime)
        .setModificationTime(endTime)
        .setPercentAvailable(FULLY_AVAILABLE)
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setProcessingStartTime(startTime)
        .setProcessingEndTime(endTime)
        .setStorageTime(endTime)
        .setStageMetrics(stageMetrics)
        .setSequenceIntervals(sequenceIntervals)
        .build();
  }

  private static ProcessingSequenceInterval generateSequence(
      String sequenceName, Instant startTime, Instant endTime) {

    var intervalId = IntervalId.from(startTime, WorkflowDefinitionId.from(sequenceName));

    return ProcessingSequenceInterval.builder()
        .setIntervalId(intervalId)
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setEndTime(endTime)
        .setProcessingStartTime(startTime)
        .setProcessingEndTime(endTime)
        .setStorageTime(endTime)
        .setModificationTime(endTime)
        .setPercentAvailable(FULLY_AVAILABLE)
        .setComment(A_COMMENT)
        .setStageName(sequenceName)
        .setPercentComplete(HALF_COMPLETE)
        .setLastExecutedStepName("Step Name")
        .build();
  }

  private static InteractiveAnalysisStageInterval generateInteractive(
      String stageName, List<String> activityNames, Instant startTime, Instant endTime) {

    List<ActivityInterval> activityIntervals =
        activityNames.stream()
            .map(activityName -> generateActivity(stageName, activityName, startTime, endTime))
            .toList();

    var intervalId = IntervalId.from(startTime, WorkflowDefinitionId.from(stageName));

    return InteractiveAnalysisStageInterval.builder()
        .setIntervalId(intervalId)
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setEndTime(endTime)
        .setProcessingStartTime(startTime)
        .setProcessingEndTime(endTime)
        .setStorageTime(endTime)
        .setModificationTime(endTime)
        .setPercentAvailable(FULLY_AVAILABLE)
        .setComment(A_COMMENT)
        .setStageMetrics(stageMetrics)
        .setActivityIntervals(activityIntervals)
        .build();
  }

  private static ActivityInterval generateActivity(
      String stageName, String activityName, Instant startTime, Instant endTime) {

    var intervalId = IntervalId.from(startTime, WorkflowDefinitionId.from(activityName));

    return ActivityInterval.builder()
        .setIntervalId(intervalId)
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setEndTime(endTime)
        .setProcessingStartTime(startTime)
        .setProcessingEndTime(endTime)
        .setStorageTime(endTime)
        .setModificationTime(endTime)
        .setPercentAvailable(FULLY_AVAILABLE)
        .setComment(A_COMMENT)
        .setStageName(stageName)
        .setActiveAnalysts(List.of("analyst 1", "analyst 2"))
        .build();
  }
}
