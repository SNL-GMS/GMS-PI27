import '@testing-library/jest-dom';

import { WorkflowTypes } from '@gms/common-model';
import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { StageMode } from '@gms/common-model/lib/workflow/types';
import { FORTY_FIVE_DAYS_IN_SECONDS } from '@gms/common-util';
import type {
  OperationalTimePeriodConfigurationQuery,
  ProcessingAnalystConfigurationQuery,
  StageIntervalList,
  StageIntervalsByIdAndTimeQuery,
  WorkflowQuery
} from '@gms/ui-state';
import { getStore, setOpenInterval, useWorkflowQuery, workflowSlice } from '@gms/ui-state';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';

import type { OpenAnythingInterval } from '~analyst-ui/components/workflow/types';
import { setFocusToWorkflowDisplay } from '~analyst-ui/components/workflow/workflow-util';

import {
  useOpenAnything,
  WorkflowPanel
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-panel';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { useQueryStateResult } from '../../../../__data__/test-util-data';
import { glContainer } from './gl-container';
import * as WorkflowDataTypes from './workflow-data-types';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const timeRange = { startTimeSecs: 1609500000, endTimeSecs: 1609506000 };
const MOCK_TIME = 1609506000000;

const store = getStore();
store.dispatch(workflowSlice.actions.setTimeRange(timeRange));

const intervalQueryResult: StageIntervalList = [];
intervalQueryResult.push({
  name: WorkflowDataTypes.interactiveStage.name,
  value: [WorkflowDataTypes.interactiveAnalysisStageInterval]
});

const intervalQuery: StageIntervalsByIdAndTimeQuery = cloneDeep(useQueryStateResult);
intervalQuery.data = intervalQueryResult;

const workflowQuery: WorkflowQuery = cloneDeep(useQueryStateResult);
workflowQuery.data = WorkflowDataTypes.workflow;

const processingAnalystConfigurationQuery: ProcessingAnalystConfigurationQuery =
  cloneDeep(useQueryStateResult);

const operationalTimePeriodConfigurationQuery: OperationalTimePeriodConfigurationQuery =
  cloneDeep(useQueryStateResult);

operationalTimePeriodConfigurationQuery.data = {
  operationalPeriodStart: FORTY_FIVE_DAYS_IN_SECONDS,
  operationalPeriodEnd: 0
};

const mockOpenInterval = jest.fn();
const mockCloseInterval = jest.fn();

jest.mock('../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  ...(jest.requireActual(
    '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util'
  ) as any),
  useSetOpenInterval: jest.fn(() => {
    return mockOpenInterval;
  }),
  useCloseInterval: jest.fn(() => {
    return mockCloseInterval;
  })
}));

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const mockDispatch = () => jest.fn();
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    setOpenInterval: jest.fn(),
    useWorkflowQuery: jest.fn(() => ({
      data: {
        stages: [
          {
            name: 'openIntervalName',
            mode: StageMode.INTERACTIVE,
            activities: [{ name: 'name', analysisMode: WorkflowTypes.AnalysisMode.EVENT_REVIEW }]
          }
        ]
      }
    })),
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
      ...processingAnalystConfigurationQuery,
      data: {
        mOpenAnythingDuration: 7200
      }
    })),
    useGetOperationalTimePeriodConfigurationQuery: jest.fn(
      () => operationalTimePeriodConfigurationQuery
    ),
    useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
      data: { stationGroupNames: [WorkflowDataTypes.stationGroupName] }
    }))
  };
});

describe('Workflow Panel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_TIME);
    (
      useWorkflowQuery as jest.Mock<
        {
          data: {
            stages: {
              name: string;
              mode: WorkflowTypes.StageMode;
              activities: {
                name: string;
                analysisMode: WorkflowTypes.AnalysisMode;
              }[];
            }[];
          };
        },
        []
      >
    ).mockClear();
    (setOpenInterval as jest.Mock<any, any>).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
  });

  it('is exported', () => {
    expect(WorkflowPanel).toBeDefined();
    expect(useOpenAnything).toBeDefined();
  });

  it('has a hook for OpenAnything', () => {
    const { result } = renderHook(() => useOpenAnything());
    const interval: OpenAnythingInterval = {
      openIntervalName: 'openIntervalName',
      stationGroup: { description: 'description', effectiveAt: 1, name: 'name' },
      timeRange: { startTimeSecs: 1, endTimeSecs: 2 }
    };
    act(() => {
      result.current(interval);
    });
    expect(useWorkflowQuery).toHaveBeenCalledTimes(1);
    expect(setOpenInterval).toHaveBeenCalledTimes(1);
    expect(setOpenInterval).toHaveBeenCalledWith(
      {
        endTimeSecs: 2,
        startTimeSecs: 1
      },
      { description: 'description', effectiveAt: 1, name: 'name' },
      'openIntervalName',
      ['name'],
      'EVENT_REVIEW'
    );
  });

  it('matches snapshot with expected text', () => {
    const { container } = render(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            processingAnalystConfiguration={processingAnalystConfigurationData}
            timeRange={timeRange}
            cleanupWorkflowIntervalQuery={jest.fn()}
          />
        </Provider>
      </BaseDisplay>
    );

    expect(container).toMatchSnapshot();
    expect(screen.getByText('Processing Stage:')).toBeInTheDocument();
    expect(screen.getByText('Open Time Range:')).toBeInTheDocument();
    expect(screen.getByText('Open Anything...')).toBeInTheDocument();
  });

  it('confirmation panel exists with discard and cancel buttons', () => {
    store.dispatch(workflowSlice.actions.setOpenIntervalName('Test Interval'));
    render(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            processingAnalystConfiguration={processingAnalystConfigurationData}
            timeRange={timeRange}
            cleanupWorkflowIntervalQuery={jest.fn()}
          />
        </Provider>
      </BaseDisplay>
    );

    const interval = screen.getByTestId('Open interval at 1622053587');
    fireEvent.doubleClick(interval);

    expect(screen.getByRole('button', { name: /Discard my changes/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    store.dispatch(workflowSlice.actions.setOpenIntervalName(undefined));
  });

  it('sets the interval on double click', () => {
    render(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            processingAnalystConfiguration={processingAnalystConfigurationData}
            timeRange={timeRange}
            cleanupWorkflowIntervalQuery={jest.fn()}
          />
        </Provider>
      </BaseDisplay>
    );

    const interval = screen.getByTestId('Open interval at 1622053587');
    fireEvent.doubleClick(interval);

    expect(mockOpenInterval).toHaveBeenCalledWith({
      activityIntervals: [
        {
          activeAnalysts: ['larry', 'moe', 'curly'],
          comment: 'interval example',
          endTime: 1622057187,
          intervalId: { definitionId: { name: 'Event Review' }, startTime: 1622053587 },
          modificationTime: 1622057667,
          percentAvailable: 100,
          processingEndTime: 1622057547,
          processingStartTime: 1622057487,
          stageName: 'AL1',
          status: 'IN_PROGRESS',
          storageTime: 1622057607
        }
      ],
      comment: 'interval example',
      endTime: 1622057187,
      intervalId: { definitionId: { name: 'AL1' }, startTime: 1622053587 },
      modificationTime: 1622057667,
      percentAvailable: 100,
      processingEndTime: 1622057547,
      processingStartTime: 1622057487,
      stageMetrics: {
        associatedSignalDetectionCount: 34,
        eventCount: 21,
        maxMagnitude: 8,
        unassociatedSignalDetectionCount: 55
      },
      stageMode: 'INTERACTIVE',
      status: 'IN_PROGRESS',
      storageTime: 1622057607
    });
  });

  it('mouse events work', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            processingAnalystConfiguration={processingAnalystConfigurationData}
            timeRange={timeRange}
            cleanupWorkflowIntervalQuery={jest.fn()}
          />
        </Provider>
      </BaseDisplay>
    );
    const workflowPanel = container.querySelector('.workflow-panel');

    user.hover(workflowPanel).catch(e => {
      throw new Error(e);
    });

    await waitFor(() => expect(workflowPanel).not.toHaveFocus());
  });
});

describe('Workflow Panel focus', () => {
  function FocusWorkflowPanel(props: { shouldSetFocus: boolean }) {
    const { shouldSetFocus } = props;

    React.useEffect(() => {
      if (shouldSetFocus) {
        setFocusToWorkflowDisplay();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            processingAnalystConfiguration={processingAnalystConfigurationData}
            timeRange={timeRange}
            cleanupWorkflowIntervalQuery={jest.fn()}
          />
        </Provider>
      </BaseDisplay>
    );
  }

  test('Can mount workflow panel and does not have focus', async () => {
    let resultWithoutFocus = null;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      resultWithoutFocus = await render(<FocusWorkflowPanel shouldSetFocus={false} />);
    });
    await waitFor(() =>
      expect(
        resultWithoutFocus.container.getElementsByClassName('workflow-panel')[0]
      ).not.toHaveFocus()
    );
  });

  test('Can mount workflow panel and set focus', async () => {
    let resultWithFocus = null;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      resultWithFocus = await render(<FocusWorkflowPanel shouldSetFocus />);
    });

    await waitFor(() =>
      expect(resultWithFocus.container.getElementsByClassName('workflow-panel')[0]).toHaveFocus()
    );
  });
});
