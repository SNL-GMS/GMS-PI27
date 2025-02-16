import { Button, Classes, Dialog } from '@blueprintjs/core';
import { WorkflowTypes } from '@gms/common-model';
import type { ProcessingAnalystConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import { DATE_TIME_FORMAT, MILLISECONDS_IN_SECOND } from '@gms/common-util';
import type GoldenLayout from '@gms/golden-layout';
import { DateRangePopup, DropDown } from '@gms/ui-core-components';
import { useMaybeGetNonIdealState } from '@gms/ui-core-components/lib/components/non-ideal-state/with-non-ideal-states';
import { removePopoverDismiss } from '@gms/ui-core-components/lib/components/ui-widgets/date-range-popup/date-range-popup';
import type {
  OperationalTimePeriodConfigurationQueryProps,
  ProcessingStationGroupNamesConfigurationQueryProps,
  StationGroupsByNamesQueryProps,
  WorkflowQuery
} from '@gms/ui-state';
import {
  useGetOperationalTimePeriodConfigurationQuery,
  useGetProcessingStationGroupNamesConfigurationQuery,
  useGetStationGroupsByNamesQuery,
  useProcessingAnalystConfiguration,
  useWorkflowQuery
} from '@gms/ui-state';
import { useInterval } from '@gms/ui-util';
import sortBy from 'lodash/sortBy';
import React, { useEffect, useState } from 'react';

import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';
import {
  processingStationGroupNamesConfigurationQueryNonIdealStateDefinitions,
  stationGroupQueryNonIdealStateDefinitions
} from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';

import { workflowQueryNonIdealStates } from './non-ideal-states';
import { WorkflowContext } from './workflow-context';

const title = 'Open Anything';

export interface OpenAnythingDialogProps {
  readonly glContainer?: GoldenLayout.Container;
  readonly isVisible: boolean;
  readonly onOpen: () => void;
  readonly onCancel: () => void;
}

type OpenAnythingPanelProps = OperationalTimePeriodConfigurationQueryProps &
  ProcessingStationGroupNamesConfigurationQueryProps &
  StationGroupsByNamesQueryProps &
  OpenAnythingDialogProps & {
    processingAnalystConfiguration: ProcessingAnalystConfiguration;
    readonly initialIntervalStartTimeMs: number;
    readonly initialIntervalEndTimeMs: number;
    readonly intervalStartTimeMs: number;
    readonly intervalEndTimeMs: number;
    readonly workflowQuery: WorkflowQuery;
    readonly setInterval: (startTimeMs: number, endTimeMs: number) => void;
  };

function OpenAnythingPanel(props: OpenAnythingPanelProps) {
  const {
    processingAnalystConfiguration,
    workflowQuery,
    stationsGroupsByNamesQuery,
    isVisible,
    initialIntervalStartTimeMs,
    initialIntervalEndTimeMs,
    intervalStartTimeMs,
    intervalEndTimeMs,
    onCancel,
    onOpen,
    setInterval
  } = props;

  const context = React.useContext(WorkflowContext);

  const processingStageList: string[] = React.useMemo(
    () =>
      workflowQuery.data?.stages
        ?.filter(stage => stage.mode === WorkflowTypes.StageMode.INTERACTIVE)
        .map(stage => stage.name) ?? [],
    [workflowQuery.data?.stages]
  );

  const stationGroupList =
    sortBy(
      stationsGroupsByNamesQuery.data?.map(stationGroup => stationGroup.name),
      stationGroupName => stationGroupName.toLowerCase()
    ) ?? [];

  const [selectedProcessingStage, setProcessingStage] = useState(processingStageList[0]);

  const [selectedStationGroup, setStationGroup] = useState(
    (
      workflowQuery.data?.stages?.filter(
        stage => stage.name === processingStageList[0]
      )[0] as unknown as WorkflowTypes.InteractiveAnalysisStage
    )?.activities[0]?.stationGroup?.name || undefined
  );
  const onApplyCallback = React.useCallback(() => {
    context.openAnythingConfirmationPrompt({
      timeRange: {
        startTimeSecs: intervalStartTimeMs / MILLISECONDS_IN_SECOND,
        endTimeSecs: intervalEndTimeMs / MILLISECONDS_IN_SECOND
      },
      stationGroup:
        stationsGroupsByNamesQuery.data.find(
          stationGroup => stationGroup.name === selectedStationGroup
        ) || stationsGroupsByNamesQuery.data[0],
      openIntervalName: selectedProcessingStage || processingStageList[0]
    });
    onOpen();
  }, [
    context,
    intervalEndTimeMs,
    intervalStartTimeMs,
    onOpen,
    processingStageList,
    selectedProcessingStage,
    selectedStationGroup,
    stationsGroupsByNamesQuery.data
  ]);

  return (
    <DateRangePopup
      startTimeMs={initialIntervalStartTimeMs}
      endTimeMs={initialIntervalEndTimeMs}
      format={DATE_TIME_FORMAT}
      isOpen={isVisible}
      title={title}
      maxSelectedRangeMs={
        processingAnalystConfiguration.maximumOpenAnythingDuration * MILLISECONDS_IN_SECOND
      }
      applyText="Open"
      cancelText="Cancel"
      onNewInterval={setInterval}
      onClose={onCancel}
      resetOnClose
      onApply={onApplyCallback}
      isLoading={stationsGroupsByNamesQuery?.isLoading}
    >
      <div className="open-anything-contents">
        <DropDown<string[]>
          className={Classes.FILL}
          displayLabel
          label="Processing stage"
          dropDownItems={processingStageList}
          value={selectedProcessingStage}
          title="Select processing stage"
          onChange={(value: string) => {
            setProcessingStage(value);
            setStationGroup(
              (
                workflowQuery.data?.stages?.filter(
                  stage => stage.name === value
                )[0] as unknown as WorkflowTypes.InteractiveAnalysisStage
              ).activities[0].stationGroup.name
            );
          }}
        />
        {stationsGroupsByNamesQuery?.isLoading ? (
          <div className="dropdown-container">
            <div className="dropdown-label">Station group:</div>
            <Button loading disabled className="dropdown-selector" />
          </div>
        ) : (
          <DropDown<string[]>
            className={Classes.FILL}
            displayLabel
            label="Station group"
            dropDownItems={stationGroupList}
            value={selectedStationGroup}
            title="Select station group"
            isLoading={stationsGroupsByNamesQuery?.isLoading}
            onChange={(value: string) => {
              setStationGroup(value);
            }}
          />
        )}
      </div>
    </DateRangePopup>
  );
}

function OpenAnythingDialogComponent(props: OpenAnythingDialogProps) {
  const { isVisible, onOpen, onCancel } = props;

  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const operationalTimePeriodConfigurationQuery = useGetOperationalTimePeriodConfigurationQuery();

  // Round down to the last hour
  const roundedNow = new Date(Date.now());
  roundedNow.setHours(roundedNow.getHours(), 0, 0, 0);

  // Use the maximum Range if it exists
  let initialConfiguredStartTime =
    roundedNow.getTime() -
    operationalTimePeriodConfigurationQuery.data.operationalPeriodStart * MILLISECONDS_IN_SECOND;

  const { maximumOpenAnythingDuration } = processingAnalystConfiguration;

  if (maximumOpenAnythingDuration) {
    initialConfiguredStartTime =
      roundedNow.getTime() -
      operationalTimePeriodConfigurationQuery.data.operationalPeriodEnd * MILLISECONDS_IN_SECOND -
      maximumOpenAnythingDuration * MILLISECONDS_IN_SECOND;
  }

  const [initialIntervalStartTimeMs, initialIntervalEndTimeMs] = useInterval(
    initialConfiguredStartTime,
    roundedNow.getTime() -
      operationalTimePeriodConfigurationQuery.data.operationalPeriodEnd * MILLISECONDS_IN_SECOND
  );

  const [intervalStartTimeMs, intervalEndTimeMs, setInterval] = useInterval(
    initialIntervalStartTimeMs,
    initialIntervalEndTimeMs
  );
  useEffect(() => {
    if (isVisible) {
      // Blueprint resets the display if you reopen the popup
      // So reset the underlying state as well
      setInterval(initialIntervalStartTimeMs, initialIntervalEndTimeMs);
    }
    // can't actually depend on setInterval or it loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const workflowQuery = useWorkflowQuery();

  const processingStationGroupNamesConfigurationQuery =
    useGetProcessingStationGroupNamesConfigurationQuery();

  const stationGroupQuery = useGetStationGroupsByNamesQuery({
    effectiveTime: initialIntervalEndTimeMs / MILLISECONDS_IN_SECOND,
    stationGroupNames: processingStationGroupNamesConfigurationQuery?.data?.stationGroupNames
  });

  const nonIdealState = useMaybeGetNonIdealState(
    {
      processingAnalystConfiguration,
      operationalTimePeriodConfigurationQuery,
      processingStationGroupNamesConfigurationQuery,
      stationGroupQuery
    },
    [
      ...AnalystNonIdealStates.operationalTimePeriodConfigNonIdealStateDefinitions,
      ...workflowQueryNonIdealStates,
      ...processingStationGroupNamesConfigurationQueryNonIdealStateDefinitions,
      ...stationGroupQueryNonIdealStateDefinitions
    ]
  );

  return nonIdealState?.element ? (
    <Dialog
      isOpen={isVisible}
      title={title}
      onClose={onCancel}
      onOpened={removePopoverDismiss}
      shouldReturnFocusOnClose
    >
      <div style={{ width: '100%', height: '100%' }}>{nonIdealState?.element}</div>
    </Dialog>
  ) : (
    <OpenAnythingPanel
      isVisible={isVisible}
      onOpen={onOpen}
      onCancel={onCancel}
      processingAnalystConfiguration={processingAnalystConfiguration}
      operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
      workflowQuery={workflowQuery}
      processingStationGroupNamesConfigurationQuery={processingStationGroupNamesConfigurationQuery}
      stationsGroupsByNamesQuery={stationGroupQuery}
      initialIntervalStartTimeMs={initialIntervalStartTimeMs}
      initialIntervalEndTimeMs={initialIntervalEndTimeMs}
      intervalStartTimeMs={intervalStartTimeMs}
      intervalEndTimeMs={intervalEndTimeMs}
      setInterval={setInterval}
    />
  );
}

function OpenAnythingComponent(props: OpenAnythingDialogProps) {
  const { isVisible, onOpen, onCancel } = props;

  // if not visible do nothing; do not execute any queries
  return isVisible ? (
    <OpenAnythingDialogComponent isVisible={isVisible} onOpen={onOpen} onCancel={onCancel} />
  ) : undefined;
}

export const OpenAnythingDialog = React.memo(OpenAnythingComponent);
