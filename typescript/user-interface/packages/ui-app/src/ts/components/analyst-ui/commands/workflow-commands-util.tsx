import { WorkflowTypes } from '@gms/common-model';
import { useStageIntervalsQuery, useUsername } from '@gms/ui-state';
import flatten from 'lodash/flatten';
import uniqBy from 'lodash/uniqBy';

/**
 * Gets the interval with the latest start time from the list
 */
export function getLatestInterval<T extends { intervalId: { startTime: number }; endTime: number }>(
  intervals: T[]
): T | undefined {
  if (intervals.length === 0) {
    return undefined;
  }

  return intervals.reduce((latestInterval, intervalToCheck) => {
    if (
      !latestInterval.intervalId.startTime ||
      intervalToCheck.intervalId.startTime > latestInterval.intervalId.startTime
    ) {
      return intervalToCheck;
    }
    return latestInterval;
  }, intervals[0]);
}

/**
 * Gets the interval with the earliest start time from the list
 */
export function getEarliestInterval<
  T extends { intervalId: { startTime: number }; endTime: number }
>(intervals: T[]): T | undefined {
  if (intervals.length === 0) {
    return undefined;
  }

  return intervals.reduce((earliestInterval, intervalToCheck) => {
    if (
      !earliestInterval.intervalId.startTime ||
      intervalToCheck.intervalId.startTime < earliestInterval.intervalId.startTime
    ) {
      return intervalToCheck;
    }
    return earliestInterval;
  }, intervals[0]);
}

/**
 * Gets the list of active analysts, as an array of strings
 */
export function getActiveAnalystsRollup(interval: WorkflowTypes.InteractiveAnalysisStageInterval) {
  return WorkflowTypes.isInteractiveAnalysisStageInterval(interval)
    ? uniqBy(flatten(interval.activityIntervals.map(activity => activity.activeAnalysts)), name => {
        return name;
      })
    : undefined;
}

/**
 * returns the best candidate interval to open from a provided list of intervals. This attempts
 * to find the earliest interval that has this analyst's name on it. If that doesn't work, then it attempts
 * to find the earliest interval that nobody is working. If that still doesn't work, it just gets the latest.
 *
 * @param intervals a list of intervals from which to find the best candidate to auto-open
 * @returns the best candidate interval to open
 */
export function getBestInterval(
  stageIntervals: WorkflowTypes.StageInterval[] | undefined,
  username: string
): WorkflowTypes.StageInterval | undefined {
  // bail if we can't do anything.
  if (!stageIntervals || stageIntervals.length === 0) {
    return undefined; // if undefined, no option should appear in the context menu
  }

  // We only care about interactive intervals.
  const interactiveIntervals = stageIntervals.filter(interval => interval.stageMode);

  // We don't care about complete intervals
  const notYetComplete = interactiveIntervals.filter(
    interval => interval.status !== WorkflowTypes.IntervalStatus.COMPLETE
  );

  // if we have any previously open intervals, use the earliest one
  const userIntervals = notYetComplete.filter(interval => {
    if (WorkflowTypes.isInteractiveAnalysisStageInterval(interval)) {
      const activeAnalystsRollup = getActiveAnalystsRollup(interval);
      return activeAnalystsRollup?.includes(username);
    }
    return false;
  });
  if (userIntervals && userIntervals.length > 0) {
    return getEarliestInterval<WorkflowTypes.StageInterval>(userIntervals);
  }

  // Find the most recent interval that nobody is working.
  const notStarted = notYetComplete.filter(
    interval =>
      interval.status === WorkflowTypes.IntervalStatus.NOT_STARTED ||
      WorkflowTypes.IntervalStatus.NOT_COMPLETE
  );
  if (notStarted && notStarted.length > 0) {
    return getEarliestInterval<WorkflowTypes.StageInterval>(notStarted);
  }

  // If we haven't found one yet, just open the latest one
  return getLatestInterval<WorkflowTypes.StageInterval>(notYetComplete);
}

/**
 * @param intervalName the name of the interval, eg: "AL1", "AL2"
 * @returns the best workflow interval to open. @see getBestInterval
 * First tries to find an interval that the user had previously opened but not completed.
 * If that fails, tries to find the earliest interval that is not being worked.
 * If that fails, simply opens the latest interval.
 */
export const useBestInterval = (intervalName: string): WorkflowTypes.StageInterval | undefined => {
  const username = useUsername();
  const workflowIntervalQuery = useStageIntervalsQuery();
  const { data: workflowIntervals } = workflowIntervalQuery;
  const matchingIntervals = workflowIntervals?.find(interval => interval.name === intervalName)
    ?.value;
  return getBestInterval(matchingIntervals, username);
};
