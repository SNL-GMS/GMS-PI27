package gms.shared.workflow.manager.controller;

import static java.util.function.Predicate.isEqual;

import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

final class IntervalUtility {

  private static final Logger LOGGER = LoggerFactory.getLogger(IntervalUtility.class);

  private static final String INVALID_ACTIVITY_STATUS_CHANGE_MSG =
      "ActivityInterval cannot be marked {} because current status is {}";

  private IntervalUtility() {}

  static List<InteractiveAnalysisStageInterval> openInteractiveStageIntervals(
      List<InteractiveAnalysisStageInterval> intervals, String analyst) {

    return intervals.stream()
        .map(interval -> openInteractiveStageInterval(interval, analyst))
        .toList();
  }

  private static InteractiveAnalysisStageInterval openInteractiveStageInterval(
      InteractiveAnalysisStageInterval interval, String analyst) {

    var newActivityIntervals =
        interval.getActivityIntervals().stream()
            .map(activityInterval -> openActivityInterval(activityInterval, analyst))
            .toList();

    return interval.toBuilder()
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setActivityIntervals(newActivityIntervals)
        .build();
  }

  static List<InteractiveAnalysisStageInterval> closeInteractiveStageIntervals(
      List<InteractiveAnalysisStageInterval> intervals, String analyst) {

    return intervals.stream()
        .map(interval -> closeInteractiveStageInterval(interval, analyst))
        .toList();
  }

  private static InteractiveAnalysisStageInterval closeInteractiveStageInterval(
      InteractiveAnalysisStageInterval interval, String analyst) {

    if (interval.getStatus() != IntervalStatus.IN_PROGRESS) {
      LOGGER.info(
          "Cannot set the stage to {} because the stage is not {}",
          IntervalStatus.NOT_COMPLETE,
          IntervalStatus.IN_PROGRESS);
      return interval;
    }

    var newActivityIntervals =
        interval.getActivityIntervals().stream()
            .map(activityInterval -> closeActivityInterval(activityInterval, analyst))
            .toList();

    // The InteractiveStageInterval should be set to NOT_COMPLETE if there
    // is a mix of NOT_COMPLETE, NOT_STARTED, and COMPLETE activity intervals only.
    // Note because we just tried to close all activity interval above this, there is guaranteed
    // to always have at least one activity in NOT_COMPLETED or IN_PROGRESS so there cannot be a
    // list
    // of all COMPLETE activities
    var activitiesNotCompleted =
        newActivityIntervals.stream()
            .allMatch(
                activityInterval ->
                    activityInterval.getStatus() == IntervalStatus.NOT_COMPLETE
                        || activityInterval.getStatus() == IntervalStatus.NOT_STARTED
                        || activityInterval.getStatus() == IntervalStatus.COMPLETE);

    return interval.toBuilder()
        .setStatus(activitiesNotCompleted ? IntervalStatus.NOT_COMPLETE : interval.getStatus())
        .setActivityIntervals(newActivityIntervals)
        .build();
  }

  static List<InteractiveAnalysisStageInterval> completeInteractiveStageIntervals(
      List<InteractiveAnalysisStageInterval> intervals) {

    return intervals.stream().map(IntervalUtility::completeInteractiveStageInterval).toList();
  }

  private static InteractiveAnalysisStageInterval completeInteractiveStageInterval(
      InteractiveAnalysisStageInterval interval) {

    if (!verifyAllActivitiesComplete(interval)) {
      return interval;
    }

    return interval.toBuilder().setStatus(IntervalStatus.COMPLETE).build();
  }

  static ActivityInterval openActivityInterval(
      ActivityInterval activityInterval, String analystName) {
    List<String> newActiveAnalysts;
    if (activityInterval.getActiveAnalysts().contains(analystName)) {
      newActiveAnalysts = activityInterval.getActiveAnalysts();
    } else {
      newActiveAnalysts = new LinkedList<>(activityInterval.getActiveAnalysts());
      newActiveAnalysts.add(analystName);
    }
    return activityInterval.toBuilder()
        .setActiveAnalysts(newActiveAnalysts)
        .setStatus(IntervalStatus.IN_PROGRESS)
        .build();
  }

  static ActivityInterval closeActivityInterval(
      ActivityInterval activityInterval, String analystName) {

    if (activityInterval.getStatus() != IntervalStatus.IN_PROGRESS) {
      LOGGER.debug(
          INVALID_ACTIVITY_STATUS_CHANGE_MSG,
          IntervalStatus.NOT_COMPLETE,
          activityInterval.getStatus());
      return activityInterval;
    }

    var newActiveAnalysts =
        activityInterval.activeAnalysts().filter(isEqual(analystName).negate()).toList();

    var newIntervalStatus =
        newActiveAnalysts.isEmpty() ? IntervalStatus.NOT_COMPLETE : activityInterval.getStatus();

    return activityInterval.toBuilder()
        .setActiveAnalysts(newActiveAnalysts)
        .setStatus(newIntervalStatus)
        .build();
  }

  static ActivityInterval completeActivityInterval(
      ActivityInterval activityInterval, String analystName) {

    var newActiveAnalysts =
        activityInterval.activeAnalysts().filter(isEqual(analystName).negate()).toList();

    return activityInterval.toBuilder()
        .setActiveAnalysts(newActiveAnalysts)
        .setStatus(IntervalStatus.COMPLETE)
        .build();
  }

  static boolean verifyAllActivitiesComplete(
      InteractiveAnalysisStageInterval interactiveAnalysisStageInterval) {

    var allCompleted =
        interactiveAnalysisStageInterval.getActivityIntervals().stream()
            .allMatch(activityInterval -> activityInterval.getStatus() == IntervalStatus.COMPLETE);

    if (!allCompleted) {
      LOGGER.info(
          "InteractiveAnalysisStageInterval cannot be marked {} because not all activities are"
              + " complete",
          IntervalStatus.COMPLETE);
      return false;
    } else {
      return true;
    }
  }

  static InteractiveAnalysisStageInterval openActivityInterval(
      InteractiveAnalysisStageInterval stageInterval,
      IntervalId activityIntervalId,
      String userName) {

    // Find ActivityInterval to update
    var activityInterval =
        findActivityInterval(stageInterval.getActivityIntervals(), activityIntervalId);

    // Remove old ActivityInterval
    var activityIntervals = new ArrayList<>(stageInterval.getActivityIntervals());
    var activityIntervalIndex = activityIntervals.indexOf(activityInterval);
    activityInterval = IntervalUtility.openActivityInterval(activityInterval, userName);
    // Overwrite the activity interval with the updated one
    activityIntervals.set(activityIntervalIndex, activityInterval);

    // Update StageInterval with updated Status and ActivityInterval
    return stageInterval.toBuilder()
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setActivityIntervals(activityIntervals)
        .build();
  }

  static InteractiveAnalysisStageInterval closeActivityInterval(
      InteractiveAnalysisStageInterval stageInterval,
      IntervalId activityIntervalId,
      String userName) {

    // Find ActivityInterval to update
    var activityInterval =
        findActivityInterval(stageInterval.getActivityIntervals(), activityIntervalId);

    if (activityInterval.getStatus() != IntervalStatus.IN_PROGRESS) {
      LOGGER.info(
          INVALID_ACTIVITY_STATUS_CHANGE_MSG,
          IntervalStatus.NOT_COMPLETE,
          stageInterval.getStatus());
      return stageInterval;
    }

    // Remove old ActivityInterval
    var activityIntervals = new ArrayList<>(stageInterval.getActivityIntervals());
    var activityIntervalIndex = activityIntervals.indexOf(activityInterval);
    activityInterval = IntervalUtility.closeActivityInterval(activityInterval, userName);

    // Add the updated ActivityInterval back to the existing ActivityIntervals
    activityIntervals.set(activityIntervalIndex, activityInterval);

    // Update StageInterval with updated ActivityInterval
    var stageIntervalBuilder = stageInterval.toBuilder().setActivityIntervals(activityIntervals);

    // The InteractiveStageInterval should be set to NOT_COMPLETE if there
    // is a mix of NOT_COMPLETE, NOT_STARTED, and COMPLETE activity intervals only.
    // Note because we just closed an activity interval above this, there is guaranteed
    // to always have at least one activity in NOT_COMPLETED or IN_PROGRESS so there cannot be a
    // list
    // of all COMPLETE activities
    var activitiesNotCompleted =
        activityIntervals.stream()
            .allMatch(
                ai ->
                    ai.getStatus() == IntervalStatus.NOT_COMPLETE
                        || ai.getStatus() == IntervalStatus.NOT_STARTED
                        || ai.getStatus() == IntervalStatus.COMPLETE);

    if (activitiesNotCompleted) {
      stageIntervalBuilder.setStatus(IntervalStatus.NOT_COMPLETE);
    }

    return stageIntervalBuilder.build();
  }

  static InteractiveAnalysisStageInterval completeActivityInterval(
      InteractiveAnalysisStageInterval stageInterval,
      IntervalId activityIntervalId,
      String userName) {

    var activityInterval =
        findActivityInterval(stageInterval.getActivityIntervals(), activityIntervalId);

    if (activityInterval.getStatus() != IntervalStatus.IN_PROGRESS) {
      LOGGER.info(
          INVALID_ACTIVITY_STATUS_CHANGE_MSG, IntervalStatus.COMPLETE, stageInterval.getStatus());
      return stageInterval;
    }

    // Remove old ActivityInterval
    var activityIntervals = new ArrayList<>(stageInterval.getActivityIntervals());
    var activityIntervalIndex = activityIntervals.indexOf(activityInterval);
    activityInterval = IntervalUtility.completeActivityInterval(activityInterval, userName);

    // Add the updated ActivityInterval back to the existing ActivityIntervals
    activityIntervals.set(activityIntervalIndex, activityInterval);

    // Update StageInterval with updated Status
    return stageInterval.toBuilder().setActivityIntervals(activityIntervals).build();
  }

  static ActivityInterval findActivityInterval(
      Collection<ActivityInterval> activityIntervals, IntervalId activityIntervalId) {

    return activityIntervals.stream()
        .filter(ai -> ai.getIntervalId().equals(activityIntervalId))
        .findFirst()
        .orElseThrow(
            () ->
                new InvalidInputException(
                    String.format(
                        "ActivityInterval with id %s not contained in StageInterval",
                        activityIntervalId)));
  }
}
