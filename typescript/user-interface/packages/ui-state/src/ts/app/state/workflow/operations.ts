import type { CommonTypes } from '@gms/common-model';
import { ArrayUtil, WorkflowTypes } from '@gms/common-model';
import { isInteractiveAnalysisStage } from '@gms/common-model/lib/workflow/types';
import { epochSecondsNow } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import { batch } from 'react-redux';

import { clearWaveforms } from '../../../workers/api/clear-waveforms';
import type {
  UpdateActivityIntervalStatusMutationFunc,
  UpdateActivityIntervalStatusParams,
  UpdateStageIntervalStatusMutationFunc,
  UpdateStageIntervalStatusParams
} from '../../api';
import { stationDefinitionSlice } from '../../api';
import { dataSlice } from '../../api/data/data-slice';
import { eventManagerApiSlice } from '../../api/event-manager/event-manager-api-slice';
import { processingConfigurationApiSlice } from '../../api/processing-configuration/processing-configuration-api-slice';
import { historySlice } from '../../history/history-slice';
import type { AppDispatch, AppState } from '../../store';
import { AnalystWorkspaceOperations } from '../analyst';
import { analystSlice } from '../analyst/analyst-slice';
import { WaveformDisplayMode, WaveformSortType } from '../analyst/types';
import { commonActions } from '../common/common-slice';
import { fksSlice } from '../fks';
import { AnalystWaveformOperations, waveformActions } from '../waveform';
import { workflowSlice } from './workflow-slice';

const logger = UILogger.create(
  'GMS_LOG_WORKFLOW_REDUX_OPERATIONS',
  process.env.GMS_LOG_WORKFLOW_REDUX_OPERATIONS
);

/**
 * This is not calling batch internally to avoid nested batch calls, which causes double rendering.
 */
const resetToDefaultState = (dispatch: AppDispatch) => {
  dispatch(workflowSlice.actions.setTimeRange({ startTimeSecs: null, endTimeSecs: null }));
  // ! This fixes a bug where changing intervals from AL1 to AL2 with the same time and station list
  // ! results in a cache hit, which prevents the logic from running that sets the filter for those stations
  dispatch(stationDefinitionSlice.util.resetApiState());

  dispatch(analystSlice.actions.setEffectiveNowTime(epochSecondsNow()));
  dispatch(analystSlice.actions.setSelectedFilterList(''));
  dispatch(analystSlice.actions.setSelectedSdIds([]));
  dispatch(analystSlice.actions.setOpenEventId(''));
  dispatch(analystSlice.actions.setSelectedEventIds([]));
  dispatch(analystSlice.actions.setMode(WaveformDisplayMode.DEFAULT));
  dispatch(analystSlice.actions.setMeasurementModeEntries({}));
  dispatch(analystSlice.actions.setSelectedSortType(WaveformSortType.stationNameAZ));
  dispatch(workflowSlice.actions.setStationGroup({ effectiveAt: -1, name: '', description: '' }));
  dispatch(workflowSlice.actions.setOpenIntervalName(''));
  dispatch(workflowSlice.actions.setOpenActivityNames([]));
  dispatch(workflowSlice.actions.setAnalysisMode(WorkflowTypes.AnalysisMode['']));
  dispatch(commonActions.setSelectedStationIds([]));
  dispatch(waveformActions.setCurrentStationGroupStationNames([]));
  dispatch(analystSlice.actions.setCurrentPhase(''));
  dispatch(analystSlice.actions.setActionTargetEventIds([]));
  dispatch(analystSlice.actions.setFileId({ workflowUniqueId: '', fileHandle: null }));

  // FK reset actions
  dispatch(fksSlice.actions.setSdIdsToShowFk([]));

  AnalystWaveformOperations.resetStationsVisibility(dispatch);
  AnalystWaveformOperations.resetWaveformIntervals(dispatch);

  // clear out cached data
  dispatch(eventManagerApiSlice.util.resetApiState());
  dispatch(dataSlice.actions.clearAll());

  // clear and reset the undo/redo stack and all history
  dispatch(historySlice.actions.clear());

  clearWaveforms().catch(e => {
    logger.error('Failure cleaning up the WaveformStore', e);
    throw e;
  });
};

export const setOpenInterval =
  (
    timeRange: CommonTypes.TimeRange,
    stationGroup: WorkflowTypes.StationGroup,
    openIntervalName: string,
    openActivityNames: string[],
    analysisMode: WorkflowTypes.AnalysisMode | null
  ) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    let openedNewActivity = false;
    const state = getState();
    const currentOpenActivityNames = state.app.workflow.openActivityNames;
    const processingAnalystConfigurationQuery =
      processingConfigurationApiSlice.endpoints.getProcessingAnalystConfiguration.select()(
        state
      ).data;
    const defaultPhaseLabelAssignment =
      processingAnalystConfigurationQuery &&
      processingAnalystConfigurationQuery?.phaseLists?.length > 0
        ? processingAnalystConfigurationQuery?.phaseLists[0].defaultPhaseLabelAssignment
        : '';
    const hasCurrentIntervalChanged =
      state.app.workflow.openIntervalName !== openIntervalName ||
      (state.app.workflow.timeRange && !isEqual(state.app.workflow.timeRange, timeRange));
    openActivityNames.forEach(openActivityName => {
      if (!includes(currentOpenActivityNames, openActivityName)) openedNewActivity = true;
    });
    batch(async () => {
      // clear out the following
      // if the processing stage interval id (or time interval) has changed
      if (hasCurrentIntervalChanged) {
        resetToDefaultState(dispatch);
      }
      if (openedNewActivity) {
        dispatch(analystSlice.actions.setSelectedFilterList(''));
      }
      dispatch(analystSlice.actions.setCurrentPhase(defaultPhaseLabelAssignment));
      dispatch(analystSlice.actions.setDefaultSignalDetectionPhase(defaultPhaseLabelAssignment));
      dispatch(workflowSlice.actions.setTimeRange(timeRange));
      dispatch(workflowSlice.actions.setStationGroup(stationGroup));
      dispatch(workflowSlice.actions.setOpenIntervalName(openIntervalName));
      dispatch(workflowSlice.actions.setOpenActivityNames(openActivityNames));
      dispatch(workflowSlice.actions.setAnalysisMode(analysisMode));

      // set default filter definitions for stations
      if (stationGroup && timeRange.startTimeSecs) {
        await dispatch(
          AnalystWaveformOperations.initializeStationVisibility(
            stationGroup,
            timeRange.startTimeSecs
          )
        );
      }
      AnalystWaveformOperations.initializeWaveformIntervals()(dispatch, getState);
      AnalystWorkspaceOperations.setPreferredFilterList()(dispatch, getState);
      await AnalystWorkspaceOperations.setDefaultFilter()(dispatch, getState);
    });
  };

export const setClosedInterval =
  (activityName: string, isStageInterval: boolean) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    batch(() => {
      // Only want to clear the state if they do not have multiple activities open
      if (getState().app.workflow.openActivityNames.length <= 1 || isStageInterval) {
        resetToDefaultState(dispatch);
      } else {
        const ids = getState().app.workflow.openActivityNames.filter(name => name !== activityName);
        dispatch(analystSlice.actions.setSelectedFilterList(''));
        dispatch(workflowSlice.actions.setOpenActivityNames(ids));
        AnalystWorkspaceOperations.setPreferredFilterList()(dispatch, getState);
      }
    });
  };

/**
 * Closes a stage
 *
 * @param userName current username
 * @param startTimeSecs open time range start time secs
 * @param openIntervalName open interval name
 * @param analystStageMutation mutation to close the stage
 */
export const closeStage = async (
  userName: string,
  startTimeSecs: number,
  openIntervalName: string,
  analystStageMutation: UpdateStageIntervalStatusMutationFunc
): Promise<void> => {
  const args: UpdateStageIntervalStatusParams = {
    stageIntervalId: {
      startTime: startTimeSecs,
      definitionId: {
        name: openIntervalName
      }
    },
    status: WorkflowTypes.IntervalStatus.NOT_COMPLETE,
    userName,
    time: epochSecondsNow()
  };
  await analystStageMutation(args);
};

/**
 * Helper function used by {@link setIntervalStatus}
 *
 * @returns stage name depending on the given interval type
 */
export const getStageName = (
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
): string => {
  if (WorkflowTypes.isActivityInterval(interval)) {
    return interval.stageName;
  }
  return interval.intervalId.definitionId.name;
};

/**
 * Helper function used by {@link setIntervalStatus}. Determines the type of
 * interval given and then updates the stage accordingly.
 *
 * @returns list of {@link WorkflowTypes.Activity} objects belonging to the
 * stage's {@link WorkflowTypes.Workflow}
 */
export const updateStage = async (
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval,
  stage: WorkflowTypes.Stage,
  userName: string,
  status: WorkflowTypes.IntervalStatus,
  activityMutation: UpdateActivityIntervalStatusMutationFunc,
  analystStageMutation: UpdateStageIntervalStatusMutationFunc
): Promise<WorkflowTypes.Activity[]> => {
  let activities: WorkflowTypes.Activity[] = [];

  // Update stage if interval is a StageInterval
  if (WorkflowTypes.isStageInterval(interval)) {
    const args: UpdateStageIntervalStatusParams = {
      stageIntervalId: {
        startTime: interval.intervalId.startTime,
        definitionId: {
          name: interval.intervalId.definitionId.name
        }
      },
      status,
      userName,
      time: epochSecondsNow() // what should this time be?
    };
    await analystStageMutation(args);
    if (isInteractiveAnalysisStage(stage)) {
      activities = stage.activities;
    }
  }

  // Update stage if interval is an ActivityInterval
  if (WorkflowTypes.isActivityInterval(interval)) {
    const args: UpdateActivityIntervalStatusParams = {
      activityIntervalId: {
        startTime: interval.intervalId.startTime,
        definitionId: {
          name: interval.intervalId.definitionId.name
        }
      },
      stageIntervalId: {
        startTime: interval.intervalId.startTime,
        definitionId: {
          name: interval.stageName
        }
      },
      status,
      userName,
      time: epochSecondsNow() // what should this time be?
    };
    await activityMutation(args);
    if (isInteractiveAnalysisStage(stage)) {
      activities = [
        ArrayUtil.findOrThrow(
          stage.activities,
          activity => activity.name === interval.intervalId.definitionId.name
        )
      ];
    }
  }

  return activities;
};

/**
 * Helper function used by {@link setIntervalStatus}. Opens or closes the
 * interval depending on it's {@link WorkflowTypes.IntervalStatus}
 */
export const openOrCloseStage = (
  dispatch: AppDispatch,
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval,
  stage: WorkflowTypes.Stage,
  status: WorkflowTypes.IntervalStatus,
  isActivityInOpenStageInterval: boolean,
  openActivityNames: string[],
  activities: WorkflowTypes.Activity[]
): void => {
  // Get the station group from the Workflow Stage
  // Per guidance, the first activity is the open activity that's to be used
  const { stationGroup, analysisMode } = activities[0];

  if (status === WorkflowTypes.IntervalStatus.IN_PROGRESS) {
    dispatch(
      setOpenInterval(
        {
          startTimeSecs: interval.intervalId.startTime,
          endTimeSecs: interval.endTime
        },
        stationGroup,
        stage.name,
        isActivityInOpenStageInterval
          ? [...activities.map(activity => activity.name), ...openActivityNames]
          : activities.map(activity => activity.name),
        analysisMode
      )
    );
  } else if (status === WorkflowTypes.IntervalStatus.NOT_COMPLETE) {
    dispatch(setClosedInterval(activities[0].name, WorkflowTypes.isStageInterval(interval)));
  }
};
