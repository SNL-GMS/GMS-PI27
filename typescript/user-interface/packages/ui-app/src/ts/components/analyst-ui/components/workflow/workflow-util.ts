import type { CommonTypes } from '@gms/common-model';
import { WorkflowTypes } from '@gms/common-model';
import {
  isAutomaticProcessingStage,
  isAutomaticProcessingStageInterval,
  isProcessingSequenceInterval
} from '@gms/common-model/lib/workflow/types';
import { toDate } from '@gms/common-util';
import type { StageIntervalList } from '@gms/ui-state';
import {
  selectOpenActivityNames,
  selectOpenIntervalName,
  selectUsername,
  selectWorkflowTimeRange,
  useAppSelector,
  useSetInterval,
  useStageIntervalsQuery
} from '@gms/ui-state';
import * as d3 from 'd3';
import React from 'react';

import { PIXELS_PER_SECOND } from './constants';

/**
 * @return the {@link WorkflowPanel} dom element
 */
export function getWorkflowPanelElement(): HTMLElement {
  return document.getElementsByClassName('workflow-panel')[0] as HTMLElement;
}

/**
 * Sets focus to the {@link WorkflowPanel}
 */
export function setFocusToWorkflowDisplay(): void {
  getWorkflowPanelElement()?.focus();
}

/**
 * Calculates the width for the given start and end times.
 *
 * @param startTime the start time
 * @param endTime the end time
 * @returns the width
 */
export const calculateWidth = (startTime: number, endTime: number): number => {
  return (endTime - startTime) * PIXELS_PER_SECOND;
};

/**
 * Returns the scales and total for the provided time range.
 * The scaleWidth can be used to determine the placement of an interval.
 * The scale can be used to determine the placement of ticks for the axis.
 *
 * @param timeRange the time range
 * @returns The scales and the total width
 */
export const getScaleForTimeRange = (
  timeRange: CommonTypes.TimeRange
): {
  scaleAxis: d3.ScaleTime<number, number>;
  scaleToPosition: d3.ScaleLinear<number, number>;
  scaleToTime: d3.ScaleLinear<number, number>;
  totalWidth: number;
} => {
  const totalWidth = timeRange ? calculateWidth(timeRange.startTimeSecs, timeRange.endTimeSecs) : 0;

  // apply a slight margin to account for the tick offset and to align with the day boundary
  const margin = 1.5;
  const scaleAxis = d3
    .scaleUtc()
    .domain([toDate(timeRange?.startTimeSecs), toDate(timeRange?.endTimeSecs)])
    .range([0 + margin, totalWidth + margin]);

  const scaleToPosition = d3
    .scaleLinear()
    .domain([timeRange?.startTimeSecs, timeRange?.endTimeSecs])
    .range([0, totalWidth]);

  const scaleToTime = d3
    .scaleLinear()
    .domain([0, totalWidth])
    .range([timeRange?.startTimeSecs, timeRange?.endTimeSecs]);

  return { scaleAxis, scaleToPosition, scaleToTime, totalWidth };
};

/**
 * Determines if a `stage interval` should be rendered as a percent bar.
 *
 * Auto Network is the only automatic stage mode where the cells should not be percent bars
 * Auto Network time chunks are 5min so if stage mode is automatic and duration is more than
 * 5min it's not a Auto Network cell and should be shown as a percent bar
 * Also, the status of the interval should be IN_PROGRESS
 *
 * @param interval stage interval
 * @returns boolean
 */
export const isStageIntervalPercentBar = (interval: WorkflowTypes.StageInterval): boolean => {
  const fiveMinInSeconds = 300;
  return (
    interval.endTime - interval.intervalId.startTime > fiveMinInSeconds &&
    interval.stageMode !== WorkflowTypes.StageMode.INTERACTIVE &&
    interval.status === WorkflowTypes.IntervalStatus.IN_PROGRESS
  );
};

/**
 * Retrieves the percentComplete value of an AutomaticProcessingStageInterval
 *
 * @param interval
 * @returns the percentComplete for the AutomaticProcessingStageInterval, or 0
 */
export const getPercentComplete = (
  interval: WorkflowTypes.StageInterval,
  workflow: WorkflowTypes.Workflow | undefined
): number => {
  if (isAutomaticProcessingStageInterval(interval) && interval.sequenceIntervals.length > 0) {
    const intervalStage = workflow?.stages.find(
      stage => stage.name === interval.intervalId.definitionId.name
    );

    if (isAutomaticProcessingStage(intervalStage)) {
      const stageIndex = intervalStage.sequences[0].steps.findIndex(
        step => step.name === interval.sequenceIntervals[0].lastExecutedStepName
      );

      if (stageIndex === -1) {
        return 0;
      }
      return (stageIndex / intervalStage.sequences[0].steps.length) * 100;
    }
  }
  if (isProcessingSequenceInterval(interval)) {
    return interval.percentComplete;
  }
  return 0;
};

/**
 * Opens an interval and updates the redux state to reflect a state with open interval
 */
export const useSetOpenInterval = (): ((
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
) => Promise<void>) => {
  return useSetInterval(WorkflowTypes.IntervalStatus.IN_PROGRESS);
};

/**
 * Closes an interval and updates the redux state to reflect a state with no open interval
 */
export const useCloseInterval = (): ((
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
) => Promise<void>) => {
  return useSetInterval(WorkflowTypes.IntervalStatus.NOT_COMPLETE);
};

/**
 * Retrieves the TimeRange for the provided intervals; i.e. the earliest start time and the latest end time.
 *
 * @param stageIntervals the stage intervals
 * @returns the time range for the intervals
 */
export const getTimeRangeForIntervals = (
  stageIntervals: StageIntervalList
): CommonTypes.TimeRange => {
  const timeRange: CommonTypes.TimeRange = {
    startTimeSecs: Infinity,
    endTimeSecs: -Infinity
  };

  if (stageIntervals) {
    stageIntervals.forEach(s =>
      s.value.forEach(interval => {
        timeRange.startTimeSecs =
          interval.intervalId.startTime <= timeRange.startTimeSecs
            ? interval.intervalId.startTime
            : timeRange.startTimeSecs;

        timeRange.endTimeSecs =
          interval.endTime >= timeRange.endTimeSecs ? interval.endTime : timeRange.endTimeSecs;
      })
    );
  }

  if (timeRange.startTimeSecs === Infinity || timeRange.endTimeSecs === -Infinity) {
    return {
      startTimeSecs: undefined,
      endTimeSecs: undefined
    };
  }
  return timeRange;
};

/**
 * Search the currently open stage for the intervals at the currently open time, and then filter
 * to only include the activity intervals that the current user has open.
 *
 * @returns a referentially stable array of the currently open activity intervals, or `undefined`
 * if none are found
 */
export const useCurrentActivityIntervals = () => {
  const userName = useAppSelector(selectUsername);
  const openStageName = useAppSelector(selectOpenIntervalName);
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  const workflowTimeRange = useAppSelector(selectWorkflowTimeRange);
  const stageIntervalQueryResults = useStageIntervalsQuery();

  const { startTimeSecs } = workflowTimeRange;

  return React.useMemo(() => {
    if (!stageIntervalQueryResults.data) {
      return undefined;
    }
    const openStageIntervals = stageIntervalQueryResults.data.find(
      stageInterval => stageInterval.name === openStageName
    );
    if (openStageIntervals == null) {
      return undefined;
    }
    if (
      !openStageIntervals.value.every(interval =>
        WorkflowTypes.isInteractiveAnalysisStageInterval(interval)
      )
    ) {
      throw new Error('Open stage interval is not an interactive interval.');
    }
    const openStageInterval = openStageIntervals.value.find(stageInterval => {
      return (
        stageInterval.intervalId.startTime === startTimeSecs &&
        stageInterval.intervalId.definitionId.name === openStageName
      );
    });
    if (openStageInterval == null) {
      return undefined;
    }
    if (!WorkflowTypes.isInteractiveAnalysisStageInterval(openStageInterval)) {
      throw new Error('Open stage interval does not contain activity intervals');
    }
    return openStageInterval.activityIntervals.filter(
      activityInterval =>
        openActivityNames.includes(activityInterval.intervalId.definitionId.name) &&
        activityInterval.activeAnalysts.includes(userName)
    );
  }, [openActivityNames, openStageName, stageIntervalQueryResults.data, startTimeSecs, userName]);
};
