import { WorkflowTypes } from '@gms/common-model';
import React from 'react';

import {
  useStageIntervalsByIdAndTimeQuery,
  useUpdateActivityIntervalStatusMutation,
  useUpdateStageIntervalStatusMutation,
  useWorkflowQuery
} from '../api';
import { cancelRequestsOnIntervalClose } from '../api/cancel-requests';
import {
  analystActions,
  closeStage,
  getStageName,
  openOrCloseStage,
  selectOpenActivityNames,
  selectOpenIntervalName,
  selectUsername,
  selectWorkflowTimeRange,
  updateStage
} from '../state';
import { useOperationalTimePeriodConfiguration } from './operational-time-period-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';

/**
 * @returns the result of the useStageIntervalsByIdAndTimeQuery query with the stages from the workflow query,
 * and the time period from the operational time period configuration from processing config
 */
export function useStageIntervalsQuery() {
  const workflowQuery = useWorkflowQuery();

  const stageNames = React.useMemo(
    () =>
      workflowQuery.isSuccess ? workflowQuery.data?.stages?.map(stage => stage.name) ?? [] : [],
    [workflowQuery.isSuccess, workflowQuery.data?.stages]
  );

  const { timeRange } = useOperationalTimePeriodConfiguration();
  return useStageIntervalsByIdAndTimeQuery(stageNames, timeRange);
}

/**
 * Gets the stage id for the currently open interval.
 * Returns undefined if no stage interval is found, or if no interval is open.
 */
export function useStageId(): WorkflowTypes.IntervalId | undefined {
  const { data: workflowIntervals } = useStageIntervalsQuery() ?? {};
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const openTimeRange = useAppSelector(selectWorkflowTimeRange);

  return React.useMemo(() => {
    if (openIntervalName == null || openTimeRange?.startTimeSecs == null) {
      return undefined;
    }

    const stageId = workflowIntervals
      ?.filter(interval => {
        return interval.name === openIntervalName;
      })
      .flatMap(stageInt => stageInt.value)
      .find(
        stageInt =>
          stageInt.intervalId.definitionId.name === openIntervalName &&
          stageInt.intervalId.startTime === openTimeRange.startTimeSecs &&
          stageInt.endTime === openTimeRange.endTimeSecs
      )?.intervalId;

    if (stageId == null) {
      // Handle the Open Anything case by building a stage interval ID
      return {
        startTime: openTimeRange.startTimeSecs,
        definitionId: {
          name: openIntervalName
        }
      };
    }
    return stageId;
  }, [openIntervalName, openTimeRange.endTimeSecs, openTimeRange.startTimeSecs, workflowIntervals]);
}

export function useSetInterval(
  status: WorkflowTypes.IntervalStatus.NOT_COMPLETE | WorkflowTypes.IntervalStatus.IN_PROGRESS
) {
  const dispatch = useAppDispatch();
  const workflowQuery = useWorkflowQuery();
  const userName = useAppSelector(selectUsername);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  const workflowTimeRange = useAppSelector(selectWorkflowTimeRange);
  const [activityMutation] = useUpdateActivityIntervalStatusMutation();
  const [analystStageMutation] = useUpdateStageIntervalStatusMutation();

  const { data: workflow } = workflowQuery;
  const workflowPanel = document.getElementsByClassName('workflow-panel');
  return React.useCallback(
    async (interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval) => {
      const { startTimeSecs } = workflowTimeRange;
      const stageName = getStageName(interval);
      const stage = workflow?.stages.find(s => s.name === stageName);

      // if stage is null or undefined you opened an interval without the workflow query loading which is not possible
      // but typescript doesn't know that so do nothing
      if (stage !== undefined) {
        // Cancel all queued and pending requests
        cancelRequestsOnIntervalClose();

        // Reset the request tracker
        dispatch(analystActions.resetRequestTracker());

        // Operation 1: Determines if there is activity for the currently-open stage
        const isActivityInOpenStageInterval = !(
          status === WorkflowTypes.IntervalStatus.IN_PROGRESS &&
          openIntervalName &&
          (openIntervalName !== stageName || interval.intervalId.startTime !== startTimeSecs)
        );

        // Close the stage, if applicable
        if (!isActivityInOpenStageInterval && startTimeSecs !== null) {
          // Close the open stage and/or activities since user is discarding changes and opening another interval
          await closeStage(userName, startTimeSecs, openIntervalName, analystStageMutation);
        }

        // Operation 2: Update stage depending on stage type
        const activities = await updateStage(
          interval,
          stage,
          userName,
          status,
          activityMutation,
          analystStageMutation
        );

        // Operation 3: Open or Close the interval depending on its status
        if (activities.length === 0) return;
        openOrCloseStage(
          dispatch,
          interval,
          stage,
          status,
          isActivityInOpenStageInterval,
          openActivityNames,
          activities
        );
        const workflowPanelElement = workflowPanel[0] as HTMLElement;
        // On open or close focus is being lost, apply focus back to workflow panel
        workflowPanelElement?.focus();
      }
    },
    [
      activityMutation,
      analystStageMutation,
      dispatch,
      openActivityNames,
      openIntervalName,
      status,
      userName,
      workflow?.stages,
      workflowPanel,
      workflowTimeRange
    ]
  );
}
