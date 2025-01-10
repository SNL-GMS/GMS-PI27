import type { WorkflowTypes } from '@gms/common-model';
import type { StageIntervalList } from '@gms/ui-state';
import { getStore } from '@gms/ui-state';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import {
  getPercentComplete,
  getTimeRangeForIntervals,
  isStageIntervalPercentBar,
  useCloseInterval,
  useSetOpenInterval
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util';
import * as WorkflowDataTypes from './workflow-data-types';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const workflowData = jest.requireActual('../../../../__data__/workflow-data');
  return {
    ...actual,
    useStageIntervalsByIdAndTimeQuery: jest
      .fn()
      .mockReturnValue({ data: workflowData.stageIntervals })
  };
});

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const store = getStore();

describe('Workflow Util', () => {
  it('can determine cell percent bar', () => {
    const interactiveStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.interactiveAnalysisStageInterval
    );
    expect(interactiveStageInterval).toBeFalsy();

    const automaticStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.automaticProcessingStageInterval
    );
    expect(automaticStageInterval).toBeTruthy();

    expect(
      isStageIntervalPercentBar(WorkflowDataTypes.processingSequenceInterval as unknown as any)
    ).toBeTruthy();
  });

  it('handles useSetOpenInterval Hook', () => {
    const { result } = renderHook(() => useSetOpenInterval(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result.current).toMatchSnapshot();
  });

  it('handles useCloseInterval Hook', () => {
    const { result } = renderHook(() => useCloseInterval(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    expect(result.current).toMatchSnapshot();
  });

  it('handles getTimeRangeForIntervals', () => {
    const stageIntervals: StageIntervalList = [];

    let timeRange = getTimeRangeForIntervals(stageIntervals);

    expect(timeRange).toBeDefined();
    expect(timeRange.startTimeSecs).toBeUndefined();
    expect(timeRange.endTimeSecs).toBeUndefined();

    stageIntervals.push({
      name: WorkflowDataTypes.interactiveStage.name,
      value: [WorkflowDataTypes.interactiveAnalysisStageInterval]
    });

    timeRange = getTimeRangeForIntervals(stageIntervals);

    expect(timeRange.startTimeSecs).toEqual(
      WorkflowDataTypes.interactiveAnalysisStageInterval.intervalId.startTime
    );
    expect(timeRange.endTimeSecs).toEqual(
      WorkflowDataTypes.interactiveAnalysisStageInterval.endTime
    );
  });

  it('gets the percentComplete for an AutomaticProcessingStageInterval', () => {
    // Check that function exists
    expect(getPercentComplete).toBeDefined();
    // Check that function returns a percent complete based on the workflow stage
    expect(
      getPercentComplete(
        WorkflowDataTypes.automaticProcessingStageInterval,
        WorkflowDataTypes.workflow
      ).toFixed(2)
    ).toEqual('33.33');
    // Check that the function returns the percentComplete of a ProcessingSequenceInterval
    expect(
      getPercentComplete(
        WorkflowDataTypes.processingSequenceInterval as unknown as WorkflowTypes.StageInterval,
        WorkflowDataTypes.workflow
      )
    ).toEqual(WorkflowDataTypes.PERCENT_COMPLETE);
    // Check that the function returns 0 for a non-automatic StageInterval
    expect(
      getPercentComplete(
        WorkflowDataTypes.interactiveAnalysisStageInterval,
        WorkflowDataTypes.workflow
      )
    ).toEqual(0);
  });
});
