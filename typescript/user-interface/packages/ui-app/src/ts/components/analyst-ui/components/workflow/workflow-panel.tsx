/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { CommonTypes, WorkflowTypes } from '@gms/common-model';
import type { ProcessingAnalystConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import {
  isActivityInterval,
  isInteractiveAnalysisStage
} from '@gms/common-model/lib/workflow/types';
import { MILLISECONDS_IN_HALF_SECOND, startOfHour } from '@gms/common-util';
import type GoldenLayout from '@gms/golden-layout';
import { ModalPrompt, WithNonIdealStates } from '@gms/ui-core-components';
import type {
  CleanupStageIntervalsByIdAndTimeQuery,
  OperationalTimePeriodConfigurationQueryProps,
  StageIntervalsByIdAndTimeQuery,
  WorkflowQuery
} from '@gms/ui-state';
import {
  analystActions,
  closeStage,
  selectOpenActivityNames,
  selectOpenIntervalName,
  selectUsername,
  selectWorkflowTimeRange,
  setOpenInterval,
  useAppDispatch,
  useAppSelector,
  useUpdateStageIntervalStatusMutation,
  useWorkflowQuery
} from '@gms/ui-state';
import { cancelRequestsOnIntervalClose } from '@gms/ui-state/lib/app/api/cancel-requests';
import { UILogger } from '@gms/ui-util';
import min from 'lodash/min';
import throttle from 'lodash/throttle';
import React, { useState } from 'react';

import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';
import { messageConfig } from '~analyst-ui/config/message-config';
import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';

import { WorkflowHotkeys } from '../../common/hotkey-configs/workflow-hotkey-configs';
import {
  workflowIntervalQueryNonIdealStates,
  workflowQueryNonIdealStates
} from './non-ideal-states';
import type { OpenAnythingInterval } from './types';
import type { WorkflowContextData } from './workflow-context';
import { WorkflowContext } from './workflow-context';
import type { WorkflowTableProps } from './workflow-table';
import { WorkflowTable } from './workflow-table';
import { WorkflowToolbar } from './workflow-toolbar';
import { getTimeRangeForIntervals, useCloseInterval, useSetOpenInterval } from './workflow-util';

const logger = UILogger.create('GMS_LOG_WORKFLOW', process.env.GMS_LOG_WORKFLOW);

export type WorkflowPanelProps = OperationalTimePeriodConfigurationQueryProps & {
  readonly glContainer?: GoldenLayout.Container;
  readonly timeRange: CommonTypes.TimeRange;
  workflowQuery: WorkflowQuery;
  workflowIntervalQuery: StageIntervalsByIdAndTimeQuery;
  processingAnalystConfiguration: ProcessingAnalystConfiguration;
  cleanupWorkflowIntervalQuery: CleanupStageIntervalsByIdAndTimeQuery;
};

const useWorkflowPanelState = () => {
  const [isConfirmationPromptVisible, setConfirmationPromptVisible] = useState(false);
  const [popupInterval, setPopupInterval] = useState<
    WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval | OpenAnythingInterval | null
  >(null);

  const isOpenAnything = (
    object: Partial<
      WorkflowTypes.ActivityInterval & WorkflowTypes.StageInterval & OpenAnythingInterval
    >
  ): object is OpenAnythingInterval => {
    return (
      object &&
      object.stationGroup !== undefined &&
      object.timeRange !== undefined &&
      object.openIntervalName !== undefined
    );
  };

  return {
    isConfirmationPromptVisible,
    setConfirmationPromptVisible,
    isOpenAnything,
    popupInterval,
    setPopupInterval
  };
};

/**
 * Creates a function that when called with the open interval sets the open interval and activities
 *
 * @returns a referentially stable function that may be used to set the opened interval
 */
export const useOpenAnything = () => {
  const dispatch = useAppDispatch();
  const workflow = useWorkflowQuery();

  return React.useCallback(
    (interval: OpenAnythingInterval): void => {
      // based on the open interval name find the stage that matches
      const stage = workflow?.data?.stages?.find(s => s.name === interval.openIntervalName);
      let interactiveAnalysisStage: WorkflowTypes.InteractiveAnalysisStage;
      let activities: WorkflowTypes.Activity[] = [];
      if (isInteractiveAnalysisStage(stage)) {
        interactiveAnalysisStage = stage;
      }
      // get all activities and check for nullish
      if (interactiveAnalysisStage !== undefined || interactiveAnalysisStage !== null) {
        activities = interactiveAnalysisStage.activities;
      }

      // Cancel all queued and pending requests
      cancelRequestsOnIntervalClose();

      // Reset the request tracker
      dispatch(analystActions.resetRequestTracker());

      dispatch(
        setOpenInterval(
          interval.timeRange,
          interval.stationGroup,
          interval.openIntervalName,
          activities?.length > 0 ? [activities[0].name] : [],
          activities?.length > 0 ? activities[0].analysisMode : null
        )
      );
    },
    [dispatch, workflow?.data?.stages]
  );
};

const useWorkflowPanel = (): {
  isConfirmationPromptVisible: boolean;
  onCancelPrompt: () => void;
  showConfirmationPrompt: (
    interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
  ) => Promise<void>;
  showOpenAnythingConfirmationPrompt: (interval: OpenAnythingInterval) => void;
  onConfirmationPrompt: () => Promise<void>;
} => {
  const {
    isConfirmationPromptVisible,
    setConfirmationPromptVisible,
    isOpenAnything,
    popupInterval,
    setPopupInterval
  } = useWorkflowPanelState();

  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const workflowTimeRange = useAppSelector(selectWorkflowTimeRange);
  const { startTimeSecs, endTimeSecs } = workflowTimeRange;

  const userName = useAppSelector(selectUsername);
  const openInterval = useSetOpenInterval();
  const [stageMutation] = useUpdateStageIntervalStatusMutation();

  const openAnything = useOpenAnything();

  const onCancelPrompt = (): void => {
    setPopupInterval(null);
    setConfirmationPromptVisible(false);
  };

  const showConfirmationPrompt = React.useCallback(
    async (
      interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
    ): Promise<void> => {
      let stageName = interval.intervalId.definitionId.name;
      if (isActivityInterval(interval)) {
        stageName = interval.stageName;
      }

      // If nothing is open, no need to prompt
      if (!openIntervalName) {
        return openInterval(interval);
      }

      // If open but opening something in the same time range and stage interval no need to prompt
      if (
        openIntervalName === stageName &&
        startTimeSecs === interval.intervalId.startTime &&
        endTimeSecs === interval.endTime
      ) {
        return openInterval(interval);
      }
      setPopupInterval(interval);
      setConfirmationPromptVisible(true);
      return Promise.resolve();
    },
    [
      endTimeSecs,
      openInterval,
      openIntervalName,
      setConfirmationPromptVisible,
      setPopupInterval,
      startTimeSecs
    ]
  );

  const showOpenAnythingConfirmationPrompt = React.useCallback(
    (interval: OpenAnythingInterval): void => {
      if (endTimeSecs || startTimeSecs) {
        setPopupInterval(interval);
        setConfirmationPromptVisible(true);
        return;
      }
      openAnything(interval);
    },
    [endTimeSecs, openAnything, setConfirmationPromptVisible, setPopupInterval, startTimeSecs]
  );

  const onConfirmationPrompt = async (): Promise<void> => {
    setConfirmationPromptVisible(false);
    if (isOpenAnything(popupInterval)) {
      await closeStage(userName, startTimeSecs, openIntervalName, stageMutation);
      openAnything(popupInterval);
    } else {
      await openInterval(popupInterval);
    }
  };

  return {
    isConfirmationPromptVisible,
    onCancelPrompt,
    showConfirmationPrompt,
    showOpenAnythingConfirmationPrompt,
    onConfirmationPrompt
  };
};

type WorkflowPanelTableProps = WorkflowTableProps & {
  // ? The linter thinks the values are not used; however they are used by the non-ideal state checks
  readonly glContainer?: GoldenLayout.Container;
  readonly tableRef: React.MutableRefObject<WorkflowTable>;
  readonly hasFetchedInitialIntervals: boolean;
  workflowQuery: WorkflowQuery;
  workflowIntervalQuery: StageIntervalsByIdAndTimeQuery;
};

function WorkflowPanelTable(props: WorkflowPanelTableProps) {
  const {
    widthPx,
    heightPx,
    workflow,
    stageIntervals,
    timeRange,
    tableRef,
    staleStartTime,
    glContainer
  } = props;

  return (
    <WorkflowTable
      ref={ref => {
        tableRef.current = ref;
      }}
      widthPx={widthPx}
      heightPx={heightPx}
      timeRange={timeRange}
      workflow={workflow}
      stageIntervals={stageIntervals}
      staleStartTime={staleStartTime}
      glContainer={glContainer}
    />
  );
}

const WorkflowTableOrNonIdealState = WithNonIdealStates<WorkflowPanelTableProps>(
  [
    ...AnalystNonIdealStates.operationalTimePeriodConfigNonIdealStateDefinitions,
    ...workflowQueryNonIdealStates,
    ...workflowIntervalQueryNonIdealStates
  ],
  WorkflowPanelTable
);

/**
 * Component to render the workflow toolbar and workflow table.
 * It uses a workflow query which returns workflow and stage intervals
 */
export function WorkflowPanel(props: WorkflowPanelProps) {
  logger.debug(`Rendering WorkflowPanel`, props);

  const {
    glContainer,
    workflowQuery,
    workflowIntervalQuery,
    operationalTimePeriodConfigurationQuery,
    cleanupWorkflowIntervalQuery
  } = props;

  const { data: workflow } = workflowQuery;
  const { data: stageIntervals } = workflowIntervalQuery;

  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  const openStartTime = useAppSelector(selectWorkflowTimeRange).startTimeSecs || Infinity;

  const tableRef = React.useRef<WorkflowTable>(undefined);

  const timeRangeForIntervals = React.useMemo(
    () => getTimeRangeForIntervals(stageIntervals),
    [stageIntervals]
  );

  const closeInterval = useCloseInterval();

  const {
    isConfirmationPromptVisible,
    onCancelPrompt,
    showConfirmationPrompt,
    showOpenAnythingConfirmationPrompt,
    onConfirmationPrompt
  } = useWorkflowPanel();

  const onPan = (seconds: number): void => {
    if (tableRef && tableRef.current) {
      tableRef.current.panBy(seconds);
    }
  };

  // track if the workflow interval query is refetching; only show the non ideal state on the initial fetch
  const hasFetchedInitialIntervals = React.useRef(false);
  React.useEffect(() => {
    if (workflowIntervalQuery.isSuccess) {
      hasFetchedInitialIntervals.current = true;
    }
  }, [workflowIntervalQuery.isSuccess]);

  const viewableMinStartTime = tableRef?.current?.getViewableMinStartTime() || Infinity;

  const operationalDuration = React.useMemo(
    () =>
      operationalTimePeriodConfigurationQuery.data.operationalPeriodStart -
      operationalTimePeriodConfigurationQuery.data.operationalPeriodEnd,
    [
      operationalTimePeriodConfigurationQuery.data.operationalPeriodEnd,
      operationalTimePeriodConfigurationQuery.data.operationalPeriodStart
    ]
  );

  const operationalStartTime = React.useMemo(
    () => timeRangeForIntervals.endTimeSecs - operationalDuration,
    [operationalDuration, timeRangeForIntervals.endTimeSecs]
  );

  // determine the minimum stale boundary for cleanup
  const staleCleanUpBoundary = React.useMemo(
    () => startOfHour(min([viewableMinStartTime, openStartTime, operationalStartTime]) ?? 0),
    [openStartTime, operationalStartTime, viewableMinStartTime]
  );

  // run clean up of stale data ONLY if the following changes:
  // stale clean up func, stale clean up boundary changes, interval data
  React.useEffect(() => {
    // This can update state but is required due to a reliance on tableRef?.current?.getViewableMinStartTime() upstream
    cleanupWorkflowIntervalQuery(staleCleanUpBoundary);
  }, [cleanupWorkflowIntervalQuery, staleCleanUpBoundary, stageIntervals]);

  const openStage = workflow?.stages.find(stage => stage.name === openIntervalName);

  const allActivitiesOpenForSelectedInterval = React.useMemo(
    () =>
      isInteractiveAnalysisStage(openStage) &&
      openStage?.activities.length === openActivityNames.length,
    [openActivityNames.length, openStage]
  );

  const [widthPx, heightPx] = useBaseDisplaySize();

  // Memoized to avoid context re-rendering
  const closeConfirmationPrompt = React.useCallback(
    async (interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval) =>
      closeInterval(interval),
    [closeInterval]
  );

  // Memoized to avoid context re-rendering
  const openConfirmationPrompt = React.useCallback(
    async (interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval) =>
      showConfirmationPrompt(interval),
    [showConfirmationPrompt]
  );

  // Memoized to avoid context re-rendering
  const openAnythingConfirmationPrompt = React.useCallback(
    (interval: OpenAnythingInterval) => showOpenAnythingConfirmationPrompt(interval),
    [showOpenAnythingConfirmationPrompt]
  );

  // Memoized to avoid context re-rendering
  const workflowContextData: WorkflowContextData = React.useMemo(
    () => ({
      staleStartTime: operationalStartTime,
      allActivitiesOpenForSelectedInterval,
      closeConfirmationPrompt,
      openConfirmationPrompt,
      openAnythingConfirmationPrompt
    }),
    [
      allActivitiesOpenForSelectedInterval,
      closeConfirmationPrompt,
      openAnythingConfirmationPrompt,
      openConfirmationPrompt,
      operationalStartTime
    ]
  );

  return (
    <WorkflowHotkeys onPan={onPan}>
      <WorkflowContext.Provider value={workflowContextData}>
        <div className="workflow-panel" data-cy="workflow-panel" tabIndex={0}>
          <WorkflowToolbar onPan={throttle(onPan, MILLISECONDS_IN_HALF_SECOND / 4)} />
          <WorkflowTableOrNonIdealState
            tableRef={tableRef}
            glContainer={glContainer}
            workflowQuery={workflowQuery}
            workflowIntervalQuery={workflowIntervalQuery}
            widthPx={widthPx}
            heightPx={heightPx}
            timeRange={timeRangeForIntervals}
            workflow={workflow}
            stageIntervals={stageIntervals}
            hasFetchedInitialIntervals={hasFetchedInitialIntervals.current}
            staleStartTime={operationalStartTime}
          />
          <ModalPrompt
            actionText={messageConfig.tooltipMessages.workflowConfirmation.discardText}
            actionCallback={onConfirmationPrompt}
            optionalCallback={onCancelPrompt}
            cancelText={messageConfig.tooltipMessages.workflowConfirmation.cancelText}
            cancelButtonCallback={onCancelPrompt}
            onCloseCallback={onCancelPrompt}
            isOpen={isConfirmationPromptVisible}
            title={messageConfig.tooltipMessages.workflowConfirmation.title}
            actionTooltipText={messageConfig.tooltipMessages.workflowConfirmation.discardTooltip}
            cancelTooltipText={messageConfig.tooltipMessages.workflowConfirmation.cancelTooltip}
          >
            <div className="interval-confirmation-contents">
              <div className="interval-confirmation-text">
                <div className="interval-confirmation-header">
                  {messageConfig.tooltipMessages.workflowConfirmation.header}
                </div>
                <div className="interval-confirmation-paragraph">
                  {messageConfig.tooltipMessages.workflowConfirmation.text}
                </div>
              </div>
              <Icon icon={IconNames.ERROR} className="interval-confirmation-icon" size={48} />
            </div>
          </ModalPrompt>
        </div>
      </WorkflowContext.Provider>
    </WorkflowHotkeys>
  );
}
