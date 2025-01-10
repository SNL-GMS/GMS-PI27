package gms.shared.workflow.repository.util;

import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.AutomaticProcessingStageInterval;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.ProcessingSequenceInterval;
import gms.shared.workflow.coi.StageInterval;
import java.time.Duration;
import java.util.List;

public final class IntervalShiftingUtility {

  private IntervalShiftingUtility() {
    // Hide implicit public constructor
  }

  public static StageInterval shiftStageInterval(StageInterval stageInterval, Duration timeShift) {
    if (stageInterval
        instanceof AutomaticProcessingStageInterval automaticProcessingStageInterval) {
      return automaticProcessingStageInterval.toBuilder()
          .setIntervalId(
              IntervalId.from(
                  stageInterval.getStartTime().plus(timeShift),
                  stageInterval.getWorkflowDefinitionId()))
          .setEndTime(stageInterval.getEndTime().plus(timeShift))
          .setProcessingStartTime(stageInterval.getProcessingStartTime().plus(timeShift))
          .setProcessingEndTime(stageInterval.getProcessingEndTime().plus(timeShift))
          .setStorageTime(stageInterval.getStorageTime().plus(timeShift))
          .setModificationTime(stageInterval.getModificationTime().plus(timeShift))
          .setSequenceIntervals(
              shiftSequenceIntervals(
                  automaticProcessingStageInterval.getSequenceIntervals(), timeShift))
          .build();
    } else if (stageInterval
        instanceof InteractiveAnalysisStageInterval interactiveAnalysisStageInterval) {
      return interactiveAnalysisStageInterval.toBuilder()
          .setIntervalId(
              IntervalId.from(
                  stageInterval.getStartTime().plus(timeShift),
                  stageInterval.getWorkflowDefinitionId()))
          .setEndTime(stageInterval.getEndTime().plus(timeShift))
          .setProcessingStartTime(stageInterval.getProcessingStartTime().plus(timeShift))
          .setProcessingEndTime(stageInterval.getProcessingEndTime().plus(timeShift))
          .setStorageTime(stageInterval.getStorageTime().plus(timeShift))
          .setModificationTime(stageInterval.getModificationTime().plus(timeShift))
          .setActivityIntervals(
              shiftActivityIntervals(
                  interactiveAnalysisStageInterval.getActivityIntervals(), timeShift))
          .build();
    } else {
      throw new IllegalStateException("Stage interval is of unknown subclass!!!");
    }
  }

  public static List<ActivityInterval> shiftActivityIntervals(
      List<ActivityInterval> activityIntervals, Duration timeShift) {
    return activityIntervals.stream()
        .map(
            activityInterval ->
                activityInterval.toBuilder()
                    .setIntervalId(
                        IntervalId.from(
                            activityInterval.getStartTime().plus(timeShift),
                            activityInterval.getWorkflowDefinitionId()))
                    .setEndTime(activityInterval.getEndTime().plus(timeShift))
                    .setProcessingStartTime(
                        activityInterval.getProcessingStartTime().plus(timeShift))
                    .setProcessingEndTime(activityInterval.getProcessingEndTime().plus(timeShift))
                    .setStorageTime(activityInterval.getStorageTime().plus(timeShift))
                    .setModificationTime(activityInterval.getModificationTime().plus(timeShift))
                    .build())
        .toList();
  }

  public static List<ProcessingSequenceInterval> shiftSequenceIntervals(
      List<ProcessingSequenceInterval> sequenceIntervals, Duration timeShift) {
    return sequenceIntervals.stream()
        .map(
            sequenceInterval ->
                sequenceInterval.toBuilder()
                    .setIntervalId(
                        IntervalId.from(
                            sequenceInterval.getStartTime().plus(timeShift),
                            sequenceInterval.getWorkflowDefinitionId()))
                    .setEndTime(sequenceInterval.getEndTime().plus(timeShift))
                    .setProcessingStartTime(
                        sequenceInterval.getProcessingStartTime().plus(timeShift))
                    .setProcessingEndTime(sequenceInterval.getProcessingEndTime().plus(timeShift))
                    .setStorageTime(sequenceInterval.getStorageTime().plus(timeShift))
                    .setModificationTime(sequenceInterval.getModificationTime().plus(timeShift))
                    .build())
        .toList();
  }
}
